"""
backend/agent/orchestrator.py

ClimateGuard AI Multi-Agent Orchestrator using Strands Agents SDK.
Features:
  - Default: Strands Google Gemini model provider with GOOGLE_API_KEY from backend/.env.
  - Startup diagnostics: Prints the exact reason if mock path is used (missing key, wrong provider, import error, exception).
  - Tools: get_forecast, assess_risk, crop_advice, find_shelters, daily_farm_brief.
  - Graceful fallback: Mock is ONLY a fallback when live call raises an error or is unconfigured.
  - Language-aware & question-aware mock fallback: Keyword routing for spray, rain, heat, drought, wind in user's language.
"""

import time
import json
import os
import re
from typing import Dict, Any, Tuple, Optional

from backend.config.settings import settings
from backend.agent.models import RiskAssessmentSchema, ToolCallTrace, AgentTrace
from backend.agent.tools import get_forecast, assess_risk, crop_advice, find_shelters, daily_farm_brief


class ClimateGuardOrchestrator:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.is_live = False
        self.live_reason = ""
        self.provider = settings.model_provider
        self.agent = None

        self._initialize_provider()

    def _initialize_provider(self):
        """
        Initializes the Strands Agent with the configured model provider.
        Diagnoses exact reason for mock fallback:
          - 'missing key': GOOGLE_API_KEY missing or empty
          - 'wrong provider': MODEL_PROVIDER not recognized
          - 'import error': failure to import google model provider
          - 'exception': any initialization error
        """
        if settings.mock_mode:
            self.is_live = False
            self.live_reason = "mock mode explicitly enabled via MOCK_MODE=true in backend/.env"
            return

        provider = os.environ.get("MODEL_PROVIDER", settings.model_provider).strip().lower()
        self.provider = provider

        if provider == "google":
            api_key = settings.google_api_key.strip()
            if not api_key:
                self.is_live = False
                self.live_reason = "missing key: GOOGLE_API_KEY is not set or empty in backend/.env"
                return

            try:
                from strands.models.gemini import GeminiModel
                from strands import Agent
            except ImportError as e:
                self.is_live = False
                self.live_reason = f"import error: could not import Strands Gemini model provider ({e})"
                return
            except Exception as e:
                self.is_live = False
                self.live_reason = f"exception during import: {e}"
                return

            try:
                # Use Strands Google Gemini model provider
                model_id = settings.gemini_model_id or "gemini-2.5-flash"
                gemini_model = GeminiModel(
                    model_id=model_id,
                    client_args={"api_key": api_key}
                )

                system_prompt = (
                    "You are ClimateGuard AI, an agromet climate early-warning and advisory agent for Tamil Nadu farmers.\n"
                    "Rules:\n"
                    "1. Deterministic Safety Boundary: You NEVER calculate or invent risk levels. You MUST use the @assess_risk tool to obtain risk evaluations.\n"
                    "2. Official IMD Priority: Always explicitly state that India Meteorological Department (IMD) official alerts take priority.\n"
                    "3. Actionable Safeguards: Give specific, practical advice for the farmer's crop and growth stage.\n"
                    "4. Zero Chemical Prescription: Never prescribe chemical pesticide brand names or dosages; focus strictly on weather timing.\n"
                    "5. Language: Always respond directly in the farmer's requested language (Tamil or English). If asked in Tamil, answer in clear, polite Tamil."
                )

                self.agent = Agent(
                    name="ClimateGuardOrchestrator",
                    model=gemini_model,
                    system_prompt=system_prompt,
                    tools=[get_forecast, assess_risk, crop_advice, find_shelters, daily_farm_brief]
                )
                self.is_live = True
                self.live_reason = f"live Strands Google Gemini agent active (model: {model_id})"

            except Exception as e:
                self.is_live = False
                self.live_reason = f"exception during Gemini model initialization: {e}"

        elif provider == "bedrock":
            aws_key = os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_SESSION_TOKEN")
            aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
            if not (aws_key and aws_secret):
                self.is_live = False
                self.live_reason = "missing key: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set for Bedrock"
                return
            try:
                from strands import Agent
                self.agent = Agent(
                    name="ClimateGuardOrchestrator",
                    system_prompt="You are ClimateGuard AI agromet advisor for Tamil Nadu farmers.",
                    tools=[get_forecast, assess_risk, crop_advice, find_shelters, daily_farm_brief]
                )
                self.is_live = True
                self.live_reason = "live Strands Bedrock agent active"
            except Exception as e:
                self.is_live = False
                self.live_reason = f"exception during Bedrock agent initialization: {e}"
        else:
            self.is_live = False
            self.live_reason = f"wrong provider: unsupported MODEL_PROVIDER '{provider}' (must be 'google' or 'bedrock')"

    def print_startup_status(self):
        """Prints exact provider status and reasoning at backend startup."""
        print("=" * 72)
        print("[ClimateGuard AI] - Strands Agent Startup Diagnostics")
        print(f"* Model Provider: {settings.model_provider}")
        if self.is_live:
            print(f"* Live Agent Status: ACTIVE [Live agent (Gemini)]")
            print(f"* Details: {self.live_reason}")
            print(f"* Default Route: Real Strands Orchestrator + Tools is DEFAULT")
        else:
            print(f"* Live Agent Status: FALLBACK ACTIVE [Mock mode]")
            print(f"* Exact Reason: {self.live_reason}")
            print("* Mock Fallback: Language-aware keyword router active (spray, rain, heat, drought, wind)")
        print("=" * 72)

    def get_or_create_session(self, session_id: str, district: str = "Madurai", crop: str = "paddy", stage: str = "vegetative") -> Dict[str, Any]:
        """Manages session memory for the farmer profile."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "district": district,
                "crop": crop,
                "growth_stage": stage,
                "history": []
            }
        else:
            if district: self.sessions[session_id]["district"] = district
            if crop: self.sessions[session_id]["crop"] = crop
            if stage: self.sessions[session_id]["growth_stage"] = stage
        return self.sessions[session_id]

    @staticmethod
    def _is_tamil_text(text: str) -> bool:
        """Detects whether text contains Tamil characters (Unicode block 0B80-0BFF)."""
        return bool(re.search(r'[\u0B80-\u0BFF]', text))

    def run(
        self,
        query: str,
        session_id: str = "default_farmer",
        district: str = "Madurai",
        crop: str = "paddy",
        growth_stage: str = "vegetative",
        language: str = "en"
    ) -> Tuple[str, AgentTrace, bool]:
        """
        Executes query through Strands agent or graceful fallback.
        Returns: (response_text, AgentTrace, is_live_call)
        """
        current_provider = os.environ.get("MODEL_PROVIDER", settings.model_provider).strip().lower()
        if self.provider != current_provider:
            self._initialize_provider()
        session = self.get_or_create_session(session_id, district, crop, growth_stage)
        tool_traces = []

        is_tamil = language == "ta" or self._is_tamil_text(query)
        target_lang = "ta" if is_tamil else "en"

        # -----------------------------------------------------------------
        # 1. Primary Path: Live Strands Agent
        # -----------------------------------------------------------------
        if self.is_live and self.agent is not None:
            t0 = time.time()
            try:
                lang_instruction = "Respond entirely in Tamil." if is_tamil else "Respond in English."
                prompt = (
                    f"Farmer Question: {query}\n"
                    f"Farmer Profile: District={session['district']}, Crop={session['crop']}, Stage={session['growth_stage']}\n"
                    f"Requested Language: {'Tamil (தமிழ்)' if is_tamil else 'English'}.\n"
                    f"{lang_instruction}\n"
                    f"Please consult tools (get_forecast, assess_risk, crop_advice) and provide a concise, actionable answer. Include 'Official IMD warnings take priority'."
                )

                result = self.agent(prompt)
                duration = int((time.time() - t0) * 1000)

                tool_traces.append(ToolCallTrace(
                    name="strands_gemini_agent",
                    status="SUCCESS",
                    duration_ms=duration,
                    args={"query": query, "district": session["district"], "model": settings.gemini_model_id},
                    output=f"Executed via Strands Agent (Gemini {settings.gemini_model_id})"
                ))

                trace = AgentTrace(
                    orchestrator="ClimateGuardOrchestrator",
                    provider="gemini",
                    mode="strands_gemini",
                    is_mock=False,
                    reason=None,
                    error=None,
                    farmer_profile={
                        "district": session["district"],
                        "crop": session["crop"],
                        "growth_stage": session["growth_stage"]
                    },
                    tool_calls=tool_traces,
                    structured_output=None
                )
                session["history"].append({"user": query, "assistant": str(result.message)})
                return str(result.message), trace, True

            except Exception as e:
                print(f"[StrandsAgent] Live call error: {e}. Executing mock fallback specialist runner.")
                fallback_error = str(e)
        else:
            fallback_error = self.live_reason

        # -----------------------------------------------------------------
        # 2. Mock Fallback Path: Deterministic Multi-Tool Specialist Runner
        # -----------------------------------------------------------------
        # Tool 1: get_forecast
        t0 = time.time()
        forecast_raw = get_forecast(session["district"])
        t1 = time.time()
        forecast_data = forecast_raw if isinstance(forecast_raw, dict) else json.loads(forecast_raw)
        tool_traces.append(ToolCallTrace(
            name="get_forecast",
            status="SUCCESS",
            duration_ms=max(int((t1 - t0) * 1000), 18),
            args={"district": session["district"]},
            output=forecast_data
        ))

        # Tool 2: assess_risk
        t2 = time.time()
        risk_raw = assess_risk(session["district"], session["crop"], session["growth_stage"])
        t3 = time.time()
        risk_data = risk_raw if isinstance(risk_raw, dict) else json.loads(risk_raw)
        tool_traces.append(ToolCallTrace(
            name="assess_risk",
            status="SUCCESS",
            duration_ms=max(int((t3 - t2) * 1000), 15),
            args={
                "district": session["district"],
                "crop": session["crop"],
                "growth_stage": session["growth_stage"],
                "engine": "thresholds.py"
            },
            output={
                "composite_risk": risk_data["composite_risk"],
                "heat_risk": risk_data["heat_risk"],
                "rain_risk": risk_data["rain_risk"],
                "drought_risk": risk_data["drought_risk"],
                "spray_status": risk_data["spray_window"]["status"]
            }
        ))

        # Tool 3: crop_advice
        t4 = time.time()
        advice_raw = crop_advice(session["crop"], session["growth_stage"], risk_data["composite_risk"])
        advice_data = advice_raw if isinstance(advice_raw, (dict, list)) else json.loads(advice_raw)
        t5 = time.time()
        tool_traces.append(ToolCallTrace(
            name="crop_advice",
            status="SUCCESS",
            duration_ms=max(int((t5 - t4) * 1000), 20),
            args={"crop": session["crop"], "stage": session["growth_stage"]},
            output=advice_data
        ))

        # Tool 4: daily_farm_brief
        t6 = time.time()
        brief_raw = daily_farm_brief(
            district=session["district"],
            crop=session["crop"],
            growth_stage=session["growth_stage"],
            language=target_lang
        )
        t7 = time.time()
        brief_data = brief_raw if isinstance(brief_raw, dict) else json.loads(brief_raw)
        tool_traces.append(ToolCallTrace(
            name="daily_farm_brief",
            status="SUCCESS",
            duration_ms=max(int((t7 - t6) * 1000), 12),
            args={"district": session["district"], "crop": session["crop"], "language": target_lang},
            output=brief_data
        ))

        # Pydantic Structured Output Validation
        structured_assessment = RiskAssessmentSchema(
            district=session["district"],
            crop=session["crop"],
            growth_stage=session["growth_stage"],
            composite_risk=risk_data["composite_risk"],
            heat_risk=risk_data["heat_risk"],
            rain_risk=risk_data["rain_risk"],
            drought_risk=risk_data["drought_risk"],
            wind_risk=risk_data["wind_risk"],
            spray_status=risk_data["spray_window"]["status"],
            confidence=risk_data.get("confidence", {}),
            farm_brief_en=brief_data.get("brief_en", risk_data.get("farm_brief", {}).get("brief_en")),
            farm_brief_ta=brief_data.get("brief_ta", risk_data.get("farm_brief", {}).get("brief_ta")),
            immediate_action_en=(
                f"For {session['crop']} in {session['district']}: "
                f"Rain risk is {risk_data['rain_risk']}, wind risk is {risk_data['wind_risk']}. "
                f"Spray window is {risk_data['spray_window']['status']}. {risk_data['spray_window']['reason_en']}"
            ),
            immediate_action_ta=(
                f"{session['district']} மாவட்டத்தில் {session['crop']} பயிருக்கு: "
                f"கணித்த மழை இடர் நிலை: {risk_data['rain_risk']}, காற்றின் வேகம்: {risk_data['wind_risk']}. "
                f"தெளிப்பு நேரம்: {risk_data['spray_window']['status']}. {risk_data['spray_window']['reason_ta']}"
            )
        )

        # Keyword-routed response generation in user's selected language
        final_answer = self._generate_keyword_response(
            query=query,
            is_tamil=is_tamil,
            profile=session,
            risk_data=risk_data,
            advice_data=advice_data,
            forecast_data=forecast_data
        )

        trace = AgentTrace(
            orchestrator="ClimateGuardOrchestrator",
            provider="mock",
            mode="mock_fallback" if self.is_live else "mock_mode",
            is_mock=True,
            reason=fallback_error,
            error=fallback_error if self.is_live else None,
            farmer_profile={
                "district": session["district"],
                "crop": session["crop"],
                "growth_stage": session["growth_stage"]
            },
            tool_calls=tool_traces,
            structured_output=structured_assessment
        )

        session["history"].append({"user": query, "assistant": final_answer})
        return final_answer, trace, False

    def _generate_keyword_response(
        self,
        query: str,
        is_tamil: bool,
        profile: Dict[str, Any],
        risk_data: Dict[str, Any],
        advice_data: Dict[str, Any],
        forecast_data: Dict[str, Any]
    ) -> str:
        """
        Generates query-dependent, language-aware response via keyword routing:
          - spray (தெளி, மருந்து, spray, foliar)
          - rain (மழை, வருமா, rain, downpour, flood)
          - heat (வெப்பம், வெயில், heat, temperature, heatwave)
          - drought / water (வறட்சி, பாசனம், தண்ணீர், drought, dry, irrigation)
          - wind (காற்று, புயல், wind, storm, gale)
        """
        q = query.lower()
        district = profile["district"]
        crop = profile["crop"]
        stage = profile["growth_stage"]

        spray_window = risk_data.get("spray_window", {})
        spray_status = spray_window.get("status", "SAFE")
        rain_sum = risk_data.get("metrics", {}).get("precipitation_sum", 0.0)
        temp_max = risk_data.get("metrics", {}).get("temp_max", 32.0)
        max_wind = risk_data.get("metrics", {}).get("wind_speed_max", 12.0)
        dry_days = risk_data.get("metrics", {}).get("consecutive_dry_days", 0)

        daily = forecast_data.get("daily", {})
        rain_today = daily.get("precipitation_sum", [rain_sum])[0] if daily.get("precipitation_sum") else rain_sum
        rain_tomorrow = daily.get("precipitation_sum", [0.0, 0.0])[1] if len(daily.get("precipitation_sum", [])) > 1 else 0.0
        rain_prob_tomorrow = daily.get("precipitation_probability_max", [20, 30])[1] if len(daily.get("precipitation_probability_max", [])) > 1 else 25

        # 1. SPRAY ROUTE
        if any(k in q for k in ["spray", "தெளி", "மருந்து", "பூச்சிக்கொல்லி", "foliar", "chemical"]):
            if is_tamil:
                if spray_status == "SAFE":
                    return (
                        f"🌾 [ClimateGuard AI - தெளிப்பு நேரம்: சாதகமானது (SAFE)]\n\n"
                        f"{district} மாவட்டத்தில் இன்று {crop} ({stage} பருவம்) பயிருக்கு மருந்து/உரம் தெளிக்க வானிலை உகந்ததாக உள்ளது.\n"
                        f"• காற்றின் வேகம்: {max_wind} கி.மீ/மணி (அமைதியானது, மருந்து காற்றில் அடித்துச் செல்லப்படாது).\n"
                        f"• மழை வாய்ப்பு: மிகக் குறைவு ({rain_today} மி.மீ).\n"
                        f"• பரிந்துரை: அதிகாலை அல்லது மாலை வேளையில் தெளிக்கவும். பரிந்துரைக்கப்பட்ட பாதுகாப்பான விவசாய நடைமுறைகளை பின்பற்றவும்.\n\n"
                        f"⚠️ இந்திய வானிலை ஆய்வு மையத்தின் (IMD) அதிகாரப்பூர்வ எச்சரிக்கைகளுக்கே முன்னுரிமை."
                    )
                else:
                    return (
                        f"⚠️ [ClimateGuard AI - தெளிப்பு நேரம்: தவிர்க்கவும் ({spray_status})]\n\n"
                        f"{district} மாவட்டத்தில் தற்போது {crop} பயிருக்கு தெளிப்பு செய்ய உகந்த சூழல் இல்லை.\n"
                        f"• காரணம்: {spray_window.get('reason_ta', 'அதிக காற்று அல்லது மழை வாய்ப்பு')}.\n"
                        f"• காற்றின் வேகம்: {max_wind} கி.மீ/மணி | மழை அளவு: {rain_sum} மி.மீ.\n"
                        f"• பரிந்துரை: காற்று தணிந்து அல்லது மழை நின்ற பிறகே தெளிப்பு மேற்கொள்ளவும். மருந்து வீணாவதை தடுக்க தற்காலிகமாக ஒத்திவைக்கவும்.\n\n"
                        f"⚠️ அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை."
                    )
            else:
                if spray_status == "SAFE":
                    return (
                        f"🌾 [ClimateGuard AI - Spray Window: SAFE]\n\n"
                        f"Weather conditions in {district} are favorable for foliar spraying on {crop} ({stage} stage) today.\n"
                        f"• Wind speed: {max_wind} km/h (calm, minimal drift risk).\n"
                        f"• Expected rain: {rain_today} mm (low rain probability).\n"
                        f"• Recommendation: Schedule spray in early morning or late afternoon for maximum uptake. Follow official extension guidelines.\n\n"
                        f"⚠️ Official IMD warnings take priority."
                    )
                else:
                    return (
                        f"⚠️ [ClimateGuard AI - Spray Window: {spray_status}]\n\n"
                        f"Spraying is currently NOT recommended for {crop} in {district}.\n"
                        f"• Reason: {spray_window.get('reason_en', 'Adverse wind or precipitation conditions')}.\n"
                        f"• Wind speed: {max_wind} km/h | Expected Rain: {rain_sum} mm.\n"
                        f"• Recommendation: Wait for weather clearance to prevent chemical drift and wash-off.\n\n"
                        f"⚠️ Official IMD warnings take priority."
                    )

        # 2. RAIN ROUTE (Matches: நாளை மழை வருமா?, rain tomorrow, will it rain, downpour)
        if any(k in q for k in ["மழை", "வருமா", "தூறல்", "கனமழை", "வெள்ளம்", "rain", "precipitation", "shower", "downpour", "flood"]):
            if is_tamil:
                rain_text = "லேசான மழை வாய்ப்புள்ளது" if rain_tomorrow > 1.0 else "மழைக்கான வாய்ப்பு மிகக் குறைவு"
                return (
                    f"🌧️ [ClimateGuard AI - மழை முன்னறிவிப்பு & பயிர் பாதுகாப்பு]\n\n"
                    f"{district} மாவட்டத்தில் {crop} ({stage} பருவம்) பயிருக்கான மழை நிலவரம்:\n"
                    f"• நாளை மழை வாய்ப்பு: {rain_text} (சுமார் {rain_tomorrow:.1f} மி.மீ, வாய்ப்பு: {rain_prob_tomorrow}%).\n"
                    f"• அடுத்த 48 மணி நேர மழையளவு: {rain_sum:.1f} மி.மீ (இடர் நிலை: {risk_data['rain_risk']}).\n"
                    f"• விவசாயப் பாதுகாப்பு நடவடிக்கைகள்:\n"
                    f"  1. வயல் வடிகால் வாய்க்கால்களை தூர்வாரி தேங்குநீர் வடிய வழிவகை செய்யவும்.\n"
                    f"  2. தாழ்வான நெல் வயல் வரப்புகளின் உயரத்தை சரிபார்க்கவும்.\n"
                    f"  3. மேகமூட்டம் அல்லது மழை பெய்யும் போது தழைச்சத்து (யூரியா) உரம் இடுவதை தற்காலிகமாக தவிர்க்கவும்.\n\n"
                    f"⚠️ இந்திய வானிலை ஆய்வு மையத்தின் (IMD) அதிகாரப்பூர்வ எச்சரிக்கைகளுக்கே முன்னுரிமை."
                )
            else:
                rain_desc = f"Light rain expected (~{rain_tomorrow:.1f} mm, {rain_prob_tomorrow}% probability)" if rain_tomorrow > 1.0 else "Dry / low rain probability"
                return (
                    f"🌧️ [ClimateGuard AI - Rainfall Outlook & Farm Advisory]\n\n"
                    f"Rainfall outlook for {crop} ({stage} stage) in {district}:\n"
                    f"• Tomorrow's Forecast: {rain_desc}.\n"
                    f"• 48-Hour Precipitation Total: {rain_sum:.1f} mm (Rain risk rating: {risk_data['rain_risk']}).\n"
                    f"• Agricultural Safeguards:\n"
                    f"  1. Inspect and clear drainage ditches to prevent root-zone waterlogging.\n"
                    f"  2. Reinforce bunds in low-lying plots.\n"
                    f"  3. Postpone nitrogen top-dressing during wet spells to avoid leaching losses.\n\n"
                    f"⚠️ Official IMD warnings take priority."
                )

        # 3. HEAT ROUTE
        if any(k in q for k in ["வெப்பம்", "வெயில்", "சூடு", "அனல்", "heat", "temperature", "heatwave", "thermal"]):
            if is_tamil:
                return (
                    f"☀️ [ClimateGuard AI - வெப்ப நிலை & பயிர் பாதுகாப்பு]\n\n"
                    f"{district} மாவட்டத்தில் {crop} பயிருக்கான வெப்ப நிலவரம்:\n"
                    f"• அதிகபட்ச வெப்பநிலை: {temp_max}°C (வெப்ப இடர்: {risk_data['heat_risk']}).\n"
                    f"• பாதுகாப்பு நடவடிக்கைகள்:\n"
                    f"  1. வேர் பகுதியில் மண் ஈரப்பதத்தை பாதுகாக்க வைக்கோல் அல்லது இலைகளால் மூடாக்கு (mulch) இடவும்.\n"
                    f"  2. மாலை வேளையில் (5:00 மணிக்கு மேல்) லேசான நீர் பாய்ச்சவும்.\n"
                    f"  3. நண்பகல் வேளையில் பயிர்களுக்கு எவ்வித ரசாயன தெளிப்பும் செய்ய வேண்டாம்.\n\n"
                    f"⚠️ அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை."
                )
            else:
                return (
                    f"☀️ [ClimateGuard AI - Heat Outlook & Crop Protection]\n\n"
                    f"Thermal conditions for {crop} ({stage} stage) in {district}:\n"
                    f"• Maximum Temperature: {temp_max}°C (Heat risk: {risk_data['heat_risk']}).\n"
                    f"• Farm Safeguards:\n"
                    f"  1. Apply organic mulch (paddy straw/leaves) to reduce soil moisture evaporation.\n"
                    f"  2. Provide light evening irrigation to replenish plant turgor.\n"
                    f"  3. Avoid midday chemical operations during peak thermal radiation.\n\n"
                    f"⚠️ Official IMD warnings take priority."
                )

        # 4. DROUGHT / IRRIGATION ROUTE
        if any(k in q for k in ["வறட்சி", "பாசனம்", "தண்ணீர்", "ஈரப்பதம்", "drought", "dry", "irrigation", "water"]):
            if is_tamil:
                return (
                    f"💧 [ClimateGuard AI - பாசனம் & வறட்சி மேலாண்மை]\n\n"
                    f"{district} மாவட்டத்தில் {crop} ({stage} பருவம்) பாசன வழிகாட்டல்:\n"
                    f"• வறண்ட நாட்களின் எண்ணிக்கை: {dry_days} நாட்கள் (வறட்சி இடர்: {risk_data['drought_risk']}).\n"
                    f"• பாசன பரிந்துரை: நிலத்தில் 2-3 செ.மீ சீரான நீர்மட்டம் பராமரிக்கவும். நீராவிப்போக்கு அதிகம் உள்ளதால் சுழற்சி முறையில் நீர் பாய்ச்சவும்.\n"
                    f"• விரிவான 7-நாள் பாசன அட்டவணைக்கு 'பாசனத் திட்டம்' (Irrigation Plan) பக்கத்தை பார்க்கவும்.\n\n"
                    f"⚠️ அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை."
                )
            else:
                return (
                    f"💧 [ClimateGuard AI - Irrigation & Moisture Management]\n\n"
                    f"Moisture advisory for {crop} ({stage} stage) in {district}:\n"
                    f"• Dry Spell Status: {dry_days} consecutive dry day(s) (Drought stress: {risk_data['drought_risk']}).\n"
                    f"• Irrigation Action: Maintain a shallow standing layer of 2-3 cm for paddy. Schedule alternate furrow wetting to conserve water.\n"
                    f"• Consult the 'Irrigation Plan' tab for the full 7-day ET0-derived schedule.\n\n"
                    f"⚠️ Official IMD warnings take priority."
                )

        # 5. WIND ROUTE
        if any(k in q for k in ["காற்று", "புயல்", "wind", "gale", "storm", "gust", "lodging"]):
            if is_tamil:
                return (
                    f"💨 [ClimateGuard AI - காற்று இடர் & பாதுகாப்பு]\n\n"
                    f"{district} மாவட்டத்தில் காற்றின் வேகம்: {max_wind} கி.மீ/மணி (காற்று இடர் நிலை: {risk_data['wind_risk']}).\n"
                    f"• வாழை போன்ற மரப்பயிர்களுக்கு சவுக்கு கம்புகள் கொண்டு முட்டு கொடுக்கவும்.\n"
                    f"• முதிர்ந்த பயிர்கள் காற்றில் சாயாமல் இருக்க நீர் பாய்ச்சுவதை காற்று வீசும் நேரங்களில் தவிர்க்கவும்.\n\n"
                    f"⚠️ அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கே முன்னுரிமை."
                )
            else:
                return (
                    f"💨 [ClimateGuard AI - Wind & Lodging Advisory]\n\n"
                    f"Wind conditions in {district}: Peak speed {max_wind} km/h (Wind risk rating: {risk_data['wind_risk']}).\n"
                    f"• Stake and prop tall crops (especially banana, sugarcane) with bamboo supports.\n"
                    f"• Avoid deep field flooding during windy intervals to prevent root lodging.\n\n"
                    f"⚠️ Official IMD warnings take priority."
                )

        # 6. GENERAL AGRO ADVISORY (Fallback)
        safeguards = advice_data.get("safeguards_ta" if is_tamil else "safeguards_en", [])
        safeguards_str = "\n• ".join(safeguards) if safeguards else ("வடிகால் வாய்க்கால்களை சுத்தம் செய்யவும்." if is_tamil else "Maintain clean drainage trenches.")

        if is_tamil:
            return (
                f"🌾 [ClimateGuard AI - {crop.title()} பயிர் வழிகாட்டல் ({district})]\n\n"
                f"வளர்ச்சிப் பருவம்: {stage} | ஒட்டுமொத்த இடர் நிலை: {risk_data['composite_risk']}\n"
                f"• மழை இடர்: {risk_data['rain_risk']} | வெப்ப இடர்: {risk_data['heat_risk']} | காற்று இடர்: {risk_data['wind_risk']}\n"
                f"• தெளிப்பு நேரம்: {spray_status}\n\n"
                f"முக்கிய பயிர் பாதுகாப்பு நடவடிக்கைகள்:\n• {safeguards_str}\n\n"
                f"⚠️ இந்திய வானிலை ஆய்வு மையத்தின் (IMD) அதிகாரப்பூர்வ எச்சரிக்கைகளுக்கே முன்னுரிமை."
            )
        else:
            return (
                f"🌾 [ClimateGuard AI - Crop Advisory for {crop.title()} in {district}]\n\n"
                f"Growth Stage: {stage.title()} | Overall Hazard Rating: {risk_data['composite_risk']}\n"
                f"• Rain Risk: {risk_data['rain_risk']} | Heat Risk: {risk_data['heat_risk']} | Wind Risk: {risk_data['wind_risk']}\n"
                f"• Weather Spray Window: {spray_status}\n\n"
                f"Key Actionable Safeguards:\n• {safeguards_str}\n\n"
                f"⚠️ Official IMD warnings take priority."
            )


# Global singleton orchestrator
orchestrator = ClimateGuardOrchestrator()
