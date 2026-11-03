"""
backend/agent/app.py

ClimateGuard AI: Bilingual (Tamil/English) Agromet Early-Warning & Climate Advisory Graph.
Built with Strands Agents SDK using Planner -> Critic multi-agent graph with SevereWeatherGate hook.

Key architectural boundaries:
  - Code-owned deterministic risk: assess_risk (thresholds.py) determines risk level;
    code re-enforces risk in the final plan and never allows the LLM to invent or alter it.
  - Life-safety hook (agent/safety.py): cancels all LLM agent nodes on severe weather or emergency
    keywords (cyclone, house flood, lightning, heat stroke, fainting) and returns fixed bilingual safety text.
  - Multi-agent graph: planner agent proposes Answer; critic agent validates against rules;
    revises once if needed.
  - Persistent farmer session: FileSessionManager maintains district, crop, and profile across runs.
  - Multi-model: _model() reads MODEL_PROVIDER (bedrock | google) from env.
  - Evidence lines ([weather], [risk], [safety], [critic], [plan]) match the strands-ship kit convention.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure backend and project root directories are in sys.path when running as `python -m agent.app`
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
for p in (str(BACKEND_DIR), str(PROJECT_ROOT)):
    if p not in sys.path:
        sys.path.insert(0, p)

from strands import Agent
from strands.multiagent import GraphBuilder

from agent import safety, tools
from agent.plan import Answer, Critique
from agent.sessions import get_session_manager, profile_store

MAX_PLANNER_PASSES = 2
logging.getLogger("strands").setLevel(logging.CRITICAL)

PLANNER_PROMPT = """You are ClimateGuard AI, an expert agromet early-warning and climate advisor for Tamil Nadu farmers.
Your goal is to answer the farmer's question in plain {lang} (ta = Tamil script, en = English) using deterministic weather facts.

Strict Rules:
1. Call assess_risk first to obtain the deterministic risk evaluation. Copy the risk level exactly.
2. Call crop_advice to find verified safeguards for this crop. Cite ONLY valid guidance IDs (e.g. G-TNAU-DRAIN-01) returned by tools.
3. Write every text field strictly in the requested language ({lang}: en = English, ta = Tamil script). Short, direct, respectful sentences.
4. steps: 2 to 4 concrete, actionable farming steps for this crop and today's weather.
   Never invent numbers (irrigation mm, wind speeds) that the tools did not provide.
5. escalation: Remind the farmer that official IMD alerts take precedence, and note helpline 1077 / 108.
6. Zero Chemical Advice: Never prescribe chemical pesticide names or dosages; focus solely on cultural and irrigation timing.
7. If the critic returns problems, fix every problem listed and return the complete corrected plan.
"""

CRITIC_PROMPT = """You are the Agromet Quality & Safety Critic. Review the proposed farming plan.
Reply ok=false with one short line per problem if ANY rule is broken:
- The risk level differs from the deterministic assess_risk fact in the task;
- A text field is not in the requested language ({lang}: en = English, ta = Tamil script);
- Any advice prescribes chemical pesticides, dosages, or tells the farmer to spray before heavy rain or during high winds;
- Any advice suggests standing under trees during lightning or ignoring flood warnings;
- The answer or escalation is empty, or misses mentioning official IMD priority or helpline 1077 / 108;
- The plan cites IDs not present in {valid_ids}.

Otherwise reply ok=true with an empty problems list. Do not rewrite the plan."""


def _model():
    """
    Returns the configured Strands model provider based on MODEL_PROVIDER (bedrock | google).
    """
    provider = os.environ.get("MODEL_PROVIDER", "google").strip().lower()

    if provider == "bedrock":
        from strands.models import BedrockModel
        model_id = os.environ.get("SHIP_MODEL", "us.amazon.nova-2-lite-v1:0")
        region = os.environ.get("AWS_REGION", "us-east-1")
        return BedrockModel(model_id=model_id, region_name=region, temperature=0.2)
    else:
        # Default Google Gemini provider
        from strands.models.gemini import GeminiModel
        api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
        model_id = os.environ.get("GEMINI_MODEL_ID", "gemini-2.5-flash")
        if api_key:
            return GeminiModel(model_id=model_id, client_args={"api_key": api_key}, params={"temperature": 0.2})
        return GeminiModel(model_id=model_id, params={"temperature": 0.2})


def is_live_available() -> Tuple[bool, str]:
    """Checks if the configured model provider has valid credentials."""
    provider = os.environ.get("MODEL_PROVIDER", "google").strip().lower()
    if os.environ.get("MOCK_MODE", "").lower() == "true":
        return False, "MOCK_MODE=true explicitly set"
    if provider == "bedrock":
        if os.environ.get("AWS_ACCESS_KEY_ID") or os.environ.get("AWS_PROFILE"):
            return True, "AWS Bedrock credentials configured"
        return False, "Bedrock requires AWS credentials"
    else:
        if os.environ.get("GOOGLE_API_KEY", "").strip():
            return True, "Google Gemini API key configured"
        return False, "Missing GOOGLE_API_KEY in environment"


def build_graph(lang: str, gate: safety.SevereWeatherGate, session_id: str = "farmer_default"):
    """
    Constructs the Planner -> Critic Strands multi-agent graph with SevereWeatherGate hook.
    """
    model_instance = _model()
    session_mgr = get_session_manager(session_id=session_id)

    valid_ids = sorted(tools.guidance_ids())

    planner = Agent(
        name="planner",
        model=model_instance,
        system_prompt=PLANNER_PROMPT.format(lang=lang),
        tools=[tools.get_forecast, tools.assess_risk, tools.crop_advice],
        structured_output_model=Answer,
        session_manager=session_mgr,
        callback_handler=None
    )

    critic = Agent(
        name="critic",
        model=model_instance,
        system_prompt=CRITIC_PROMPT.format(lang=lang, valid_ids=valid_ids),
        structured_output_model=Critique,
        callback_handler=None
    )

    seen_passes: set[int] = set()

    def needs_revision(state) -> bool:
        critic_res = state.results.get("critic")
        verdict = getattr(critic_res.result, "structured_output", None) if critic_res else None
        current_passes = sum(1 for n in state.execution_order if n.node_id == "planner")

        if verdict is not None and current_passes not in seen_passes:
            seen_passes.add(current_passes)
            status = "PASS" if verdict.ok else "REVISE - " + "; ".join(verdict.problems)[:200]
            print(f"[critic] pass {current_passes}: {status}", flush=True)

        return bool(verdict is not None and not verdict.ok and current_passes < MAX_PLANNER_PASSES)

    builder = GraphBuilder()
    builder.add_node(planner, "planner")
    builder.add_node(critic, "critic")
    builder.add_edge("planner", "critic")
    builder.add_edge("critic", "planner", condition=needs_revision)
    builder.set_entry_point("planner")
    builder.set_max_node_executions(MAX_PLANNER_PASSES * 2)
    builder.reset_on_revisit(True)
    builder.set_hook_providers([gate])

    return builder.build()


def _emergency_plan(lang: str, risk_level: str, triggers: list[str]) -> Answer:
    """Fixed, code-owned emergency life-safety plan. No LLM writes this text."""
    return Answer(
        language=lang,
        risk=risk_level if risk_level in ("HIGH", "CRITICAL") else "CRITICAL",
        answer=safety.EMERGENCY_TEXT[lang],
        steps=safety.EMERGENCY_STEPS[lang],
        escalation=safety.EMERGENCY_ESCALATION[lang],
        citations=["G-DISASTER-1077", "G-IMD-ALERT-07"]
    )


def _enforce(plan: Answer, risk_level: str, lang: str, critic_ok: Optional[bool]) -> Tuple[Answer, list[str]]:
    """
    Deterministic boundary: Enforces code-owned fields back onto the model's output.
    Ensures that LLM output can NEVER override the deterministic risk level.
    """
    fixed = []

    # 1. Strictly enforce deterministic risk level
    if plan.risk != risk_level:
        fixed.append(f"risk corrected: {plan.risk} -> {risk_level}")
        plan.risk = risk_level

    # 2. Enforce language code
    if plan.language != lang:
        fixed.append(f"language corrected: {plan.language} -> {lang}")
        plan.language = lang

    # 3. Filter unknown citations
    valid_ids = tools.guidance_ids()
    unknown = [c for c in plan.citations if c not in valid_ids]
    if unknown:
        fixed.append(f"dropped invalid citations: {', '.join(unknown)}")
        plan.citations = [c for c in plan.citations if c in valid_ids]

    if not plan.citations:
        plan.citations = ["G-FAO56-IRRIG-05"]

    # 4. Enforce official emergency escalation notice
    has_helpline = any(num in plan.escalation for num in ("1077", "108", "112"))
    if not has_helpline:
        append_txt = (
            " உடனே 1077 அல்லது 108 என்ற எண்ணை அழையுங்கள். அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை."
            if lang == "ta" else
            " Call 1077 (Disaster Room) or 108 in emergency. Official IMD alerts take precedence."
        )
        plan.escalation = (plan.escalation + append_txt).strip()
        fixed.append("escalation: added 1077 / 108 helpline notice")

    return plan, fixed


def _deterministic_mock_plan(user_query: str, district: str, crop: str, growth_stage: str, lang: str, risk_eval: dict) -> Answer:
    """
    High-fidelity deterministic fallback answering the user question when offline or in mock mode.
    """
    comp_risk = risk_eval.get("composite_risk", "LOW")
    rain_risk = risk_eval.get("rain_risk", "LOW")
    spray_status = risk_eval.get("spray_window", {}).get("status", "SAFE")
    query_lower = user_query.lower()

    is_rain_query = any(w in query_lower for w in ("மழை", "rain", "மழைய", "மழை வருமா", "வானிலை"))
    is_spray_query = any(w in query_lower for w in ("தெளி", "மருந்து", "spray", "பூச்சி"))
    is_irrig_query = any(w in query_lower for w in ("பாசனம்", "தண்ணீர்", "irrigation", "water"))

    if is_rain_query:
        if rain_risk in ("HIGH", "CRITICAL"):
            ans_ta = f"{district} மாவட்டத்தில் அடுத்த 48 மணி நேரத்தில் கனமழை வாய்ப்பு உள்ளது (இடர் நிலை: {rain_risk}). வயல் வடிகால் வாய்க்கால்களை தூர்வாரி தயார் நிலையில் வைக்கவும். ரசாயன உரம் இடுவதை ஒத்திவைக்கவும்."
            ans_en = f"Heavy rainfall is forecast for {district} district over the next 48 hours (Risk: {rain_risk}). Ensure field drainage channels are clear to prevent waterlogging. Postpone fertilizer application."
            steps_ta = [
                "வயல் வடிகால் வாய்க்கால்களை உடனடியாக தூர்வாரவும்.",
                "நாற்றங்கால் அல்லது தாழ்வான பகுதியில் மழைநீர் தேங்காமல் கண்காணிக்கவும்.",
                "அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கு முன்னுரிமை அளிக்கவும்."
            ]
            steps_en = [
                "Clear and open all field drainage channels immediately.",
                "Monitor nursery beds and low-lying plots to avoid submergence.",
                "Follow official IMD meteorological alerts."
            ]
            cites = ["G-TNAU-DRAIN-01", "G-IMD-ALERT-07"]
        else:
            ans_ta = f"{district} மாவட்டத்தில் தற்போதைய கணிப்பின்படி கனமழை வாய்ப்பு குறைவு (மழை இடர்: {rain_risk}). தழைப்பருவ {crop} பயிருக்கு தேவையான வழக்கமான பாசனத்தை தொடரலாம்."
            ans_en = f"Minimal heavy rainfall risk for {district} over the coming 48 hours (Risk: {rain_risk}). Proceed with normal scheduled irrigation for {crop}."
            steps_ta = [
                "வயலில் 2-3 செ.மீ சீரான நீர்மட்டம் பராமரிக்கவும்.",
                "லேசான மேகமூட்டம் இருந்தால் தழைச்சத்து உரமிடுவதை கண்காணிக்கவும்."
            ]
            steps_en = [
                "Maintain 2-3 cm standing water depth in fields.",
                "Observe sky conditions before nitrogen top-dressing."
            ]
            cites = ["G-FAO56-IRRIG-05"]
    elif is_spray_query:
        ans_ta = f"{district} மாவட்டத்தில் தெளிப்பு நேரம்: {spray_status}. காற்றின் வேகம் 15 கி.மீ/ம-க்கு குறைவாக இருக்கும் போது இலைவழி ஊட்டச்சத்து தெளிக்க உகந்தது."
        ans_en = f"Foliar spray window in {district} is {spray_status}. Favorable when wind speeds are below 15 km/h with low rain probability."
        steps_ta = [
            "காலை 6:00 - 9:00 அல்லது மாலை 4:00 மணிக்கு மேல் தெளிக்கவும்.",
            "மழைக்கு முன் உரம் அல்லது தெளிப்பை தவிர்க்கவும்."
        ]
        steps_en = [
            "Apply sprays in early morning (6:00-9:00 AM) or after 4:00 PM.",
            "Avoid spraying prior to approaching rain."
        ]
        cites = ["G-TNAU-SPRAY-03"]
    else:
        ans_ta = f"{district} மாவட்டத்தில் {crop} ({growth_stage} பருவம்) பயிருக்கு கணிக்கப்பட்ட இடர் நிலை: {comp_risk}. தெளிப்பு நேரம்: {spray_status}."
        ans_en = f"For {crop} in {district} ({growth_stage} stage): Current computed agromet hazard is {comp_risk}. Spray window: {spray_status}."
        steps_ta = [
            "மண்ணின் ஈரப்பதத்திற்கேற்ப பாசனம் திட்டமிடவும்.",
            "அதிகாரப்பூர்வ IMD எச்சரிக்கைகளை பின்பற்றவும்."
        ]
        steps_en = [
            "Align irrigation with soil moisture and ET0 demand.",
            "Follow official IMD meteorological forecasts."
        ]
        cites = ["G-FAO56-IRRIG-05", "G-IMD-ALERT-07"]

    return Answer(
        language=lang,
        risk=comp_risk,
        answer=ans_ta if lang == "ta" else ans_en,
        steps=steps_ta if lang == "ta" else steps_en,
        escalation=safety.EMERGENCY_ESCALATION[lang],
        citations=cites
    )


def run(case: dict | str) -> dict:
    """
    Executes one ClimateGuard AI plan for one case.
    Matches the exact signature expected by kit/ship_kit/measure.py:
    Returns:
        {"plan": Answer.model_dump(), "meta": evidence_dict}
    """
    t0 = time.time()
    if isinstance(case, str):
        case = {"text": case}

    user_text = case.get("text", "").strip()
    lang = case.get("lang") or tools.language_of(user_text)
    session_id = case.get("session_id", "farmer_default")

    # Update or fetch farmer profile
    profile = profile_store.get_profile(session_id)
    district = case.get("district") or profile.get("district", "Madurai")
    crop = case.get("crop") or profile.get("crop", "paddy")
    growth_stage = case.get("growth_stage") or profile.get("growth_stage", "vegetative")
    profile_store.update_profile(session_id, district=district, crop=crop, growth_stage=growth_stage)

    # 1. Deterministic agromet risk evaluation (Code-owned!)
    risk_eval = tools.assess_risk_dict(district, crop, growth_stage)
    comp_risk = risk_eval.get("composite_risk", "LOW")
    print(f"[risk] {district} {crop} ({growth_stage}) -> {comp_risk}", flush=True)

    # 2. Red-flag emergency safety check
    tier, triggers = safety.check_safety(user_text)
    meta = {
        "district": district,
        "crop": crop,
        "growth_stage": growth_stage,
        "tier": tier,
        "triggers": triggers,
        "risk": comp_risk,
        "passes": 0,
        "critic_ok": None,
        "fixed": [],
        "is_mock": False
    }

    # If severe weather emergency triggered, cancel graph and return fixed code text
    if tier == "emergency":
        print(f"[safety] RED FLAG ({', '.join(triggers)}) -> EMERGENCY 1077/108, agents cancelled", flush=True)
        plan = _emergency_plan(lang, comp_risk, triggers)
        meta.update(path="emergency", is_mock=False)
        meta["latency_ms"] = int((time.time() - t0) * 1000)
        print(f"[plan] {plan.risk} | emergency | {meta['latency_ms']} ms", flush=True)
        return {"plan": plan.model_dump(), "meta": meta}

    # 3. Check model provider availability
    live_ok, live_reason = is_live_available()
    gate = safety.SevereWeatherGate()

    if live_ok:
        try:
            task_prompt = (
                f"Farmer Query ({lang}): {user_text}\n"
                f"District: {district}, Crop: {crop}, Growth Stage: {growth_stage}.\n"
                f"assess_risk Facts (FIXED BY CODE): risk_level={comp_risk}, "
                f"rain_risk={risk_eval.get('rain_risk')}, heat_risk={risk_eval.get('heat_risk')}, "
                f"spray_window={risk_eval.get('spray_window', {}).get('status')}."
            )
            graph = build_graph(lang, gate, session_id=session_id)
            res = graph(task_prompt, invocation_state={"user_text": user_text})

            if gate.tripped:
                print(f"[safety] Hook tripped ({', '.join(gate.tripped)}) -> EMERGENCY 1077", flush=True)
                plan = _emergency_plan(lang, comp_risk, gate.tripped)
                meta.update(path="emergency")
            else:
                planner_res = res.results["planner"].result.structured_output
                critic_res = res.results.get("critic")
                verdict = getattr(critic_res.result, "structured_output", None) if critic_res else None

                passes_count = sum(1 for n in res.execution_order if n.node_id == "planner")
                critic_ok = bool(verdict and verdict.ok)

                meta.update(
                    path="agent_graph",
                    passes=passes_count,
                    critic_ok=critic_ok,
                    critic_problems=list(verdict.problems) if verdict else []
                )

                plan, meta["fixed"] = _enforce(planner_res, comp_risk, lang, critic_ok)
                if meta["fixed"]:
                    print("[code] enforced: " + "; ".join(meta["fixed"]), flush=True)

        except Exception as e:
            print(f"[fallback] Live agent exception ({e}) -> using deterministic fallback", flush=True)
            plan = _deterministic_mock_plan(user_text, district, crop, growth_stage, lang, risk_eval)
            meta.update(path="mock_fallback", is_mock=True, reason=str(e))
    else:
        # Mock mode fallback (deterministic, fast, zero keys required)
        print(f"[mock] {live_reason} -> using deterministic agromet plan", flush=True)
        plan = _deterministic_mock_plan(user_text, district, crop, growth_stage, lang, risk_eval)
        meta.update(path="mock_mode", is_mock=True, reason=live_reason)

    meta["latency_ms"] = int((time.time() - t0) * 1000)
    print(f"[plan] {plan.risk} | {meta.get('path')} | {meta['latency_ms']} ms", flush=True)
    return {"plan": plan.model_dump(), "meta": meta}


def _print_plan(plan_data: dict) -> None:
    print("=" * 60)
    print(f"Risk: {plan_data.get('risk')} | Language: {plan_data.get('language')}")
    print("=" * 60)
    print(plan_data.get("answer", ""))
    print("\nAction Steps:")
    for s in plan_data.get("steps", []):
        print(f"  • {s}")
    print("\nEscalation / IMD Warning:")
    print(f"  {plan_data.get('escalation', '')}")
    if plan_data.get("citations"):
        print(f"\nCitations: {', '.join(plan_data.get('citations', []))}")
    print("=" * 60)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m agent.app",
        description="ClimateGuard AI - Bilingual Agromet Early-Warning & Climate Advisory Agent"
    )
    parser.add_argument("text", nargs="?", default="நாளைக்கு மழை வருமா?", help="Farmer query in Tamil or English")
    parser.add_argument("--district", default="Madurai", help="Tamil Nadu district name (default: Madurai)")
    parser.add_argument("--crop", default="paddy", help="Crop type (default: paddy)")
    parser.add_argument("--growth-stage", default="vegetative", help="Crop growth stage (default: vegetative)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON instead of formatted text")

    args = parser.parse_args(argv)

    case = {
        "text": args.text,
        "district": args.district,
        "crop": args.crop,
        "growth_stage": args.growth_stage
    }

    result = run(case)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        _print_plan(result["plan"])

    return 0


if __name__ == "__main__":
    sys.exit(main())
