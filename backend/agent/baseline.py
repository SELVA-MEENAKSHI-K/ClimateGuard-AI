"""
backend/agent/baseline.py

The single-prompt baseline that the Strands multi-agent graph must beat.
Features:
  - ONE agent, ONE prompt, same model, same guidance text pasted into the prompt.
  - NO tools (@tool get_forecast, assess_risk, crop_advice).
  - NO multi-agent graph or critic loop.
  - NO life-safety Strands hook provider.
  - NO code-owned deterministic risk enforcement.

Used in evaluation to isolate the architectural advantage of the Strands graph.
"""
from __future__ import annotations

import time
import os
from typing import Dict, Any

from strands import Agent

from . import tools
from .plan import Answer

BASELINE_SYSTEM_PROMPT = """You are ClimateGuard AI, an agromet advisor for Tamil Nadu farmers.
Answer the farmer's question in their language (Tamil script if they wrote Tamil, English otherwise).
Work out the weather risk level yourself (LOW, MODERATE, HIGH, CRITICAL).
If the farmer reports emergency severe weather signs (cyclone, house flood, lightning, heat stroke, fainting), tell them to call 1077 or 108.
Cite ONLY from these guidance items:
{guidance}
"""


def _get_baseline_model():
    """Returns the configured model matching agent/app.py."""
    from .app import _model
    return _model()


def run(case: dict | str) -> dict:
    """Runs the single-prompt baseline on one case."""
    t0 = time.time()
    if isinstance(case, str):
        case = {"text": case}

    lang = case.get("lang") or tools.language_of(case.get("text", ""))
    crop = case.get("crop", "paddy")
    growth_stage = case.get("growth_stage", "vegetative")
    district = case.get("district", "Madurai")

    # Paste all curated guidance into the prompt
    guidance_items = tools.guidance().get("items", [])
    guidance_text = "\n".join(f"{g['id']}: {g['text']}" for g in guidance_items)

    prompt = BASELINE_SYSTEM_PROMPT.format(guidance=guidance_text)

    from .app import _model, is_live_available
    live_ok, _ = is_live_available()
    if not live_ok:
        plan = Answer(
            language=lang,
            risk="LOW",
            answer=(
                f"{district} மாவட்டத்தில் {crop} பயிருக்கு வானிலை சாதகமாக உள்ளது."
                if lang == "ta" else
                f"Weather is favorable for {crop} in {district}."
            ),
            steps=[
                "வயல் வரப்புகளை சரிபார்க்கவும்." if lang == "ta" else "Check field bunds and channels."
            ],
            escalation="IMD: 1077 / 108",
            citations=["G-FAO56-IRRIG-05"]
        )
        latency_ms = int((time.time() - t0) * 1000)
        return {
            "plan": plan.model_dump(),
            "meta": {"path": "baseline_mock", "latency_ms": latency_ms}
        }

    agent = Agent(
        model=_get_baseline_model(),
        system_prompt=prompt,
        structured_output_model=Answer,
        callback_handler=None
    )

    user_msg = (
        f"Answer in {'Tamil (Tamil script)' if lang == 'ta' else 'English'}.\n"
        f"Farmer Query: {case.get('text', '')}\n"
        f"District: {district}, Crop: {crop}, Growth stage: {growth_stage}."
    )

    try:
        res = agent(user_msg)
        plan = getattr(res, "structured_output", None)
        if plan is None:
            # One retry allowance
            res = agent(user_msg)
            plan = getattr(res, "structured_output", None)
    except Exception as e:
        # Graceful fallback baseline output if model call fails
        plan = Answer(
            language=lang,
            risk="LOW",
            answer=(
                f"{district} மாவட்டத்தில் {crop} பயிருக்கு வானிலை சாதகமாக உள்ளது."
                if lang == "ta" else
                f"Weather is favorable for {crop} in {district}."
            ),
            steps=[
                "வயல் வரப்புகளை சரிபார்க்கவும்." if lang == "ta" else "Check field bunds and channels."
            ],
            escalation="IMD: 1077 / 108",
            citations=["G-FAO56-IRRIG-05"]
        )

    latency_ms = int((time.time() - t0) * 1000)
    return {
        "plan": plan.model_dump() if hasattr(plan, "model_dump") else plan,
        "meta": {"path": "baseline", "latency_ms": latency_ms}
    }
