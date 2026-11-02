"""
backend/main.py

FastAPI Application for ClimateGuard AI.
Bilingual (Tamil/English) Climate Early-Warning Agent for Tamil Nadu Farmers.
"""

import sys
import os

# Ensure both backend and project root directory are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
for _p in (CURRENT_DIR, PARENT_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.config.settings import settings
from backend.data.locations import TAMIL_NADU_DISTRICTS, get_district_info
from backend.services.weather_service import WeatherService
from backend.services.risk_engine import RiskEngine
from backend.agent.orchestrator import orchestrator
from backend.config.thresholds import calculate_7day_irrigation_schedule, RiskLevel
import json
import os

app = FastAPI(
    title=settings.app_name,
    description="Climate early-warning agent for Tamil Nadu farmers with deterministic risk computation and Strands Agents SDK.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str
    district: Optional[str] = "Madurai"
    crop: Optional[str] = "paddy"
    growth_stage: Optional[str] = "vegetative"
    session_id: Optional[str] = "farmer_web_session"
    language: Optional[str] = "en"


@app.on_event("startup")
def startup_event():
    orchestrator.print_startup_status()


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "model_provider": settings.model_provider,
        "live_agent_active": orchestrator.is_live,
        "live_agent_reason": orchestrator.live_reason,
        "mock_mode": settings.mock_mode or not orchestrator.is_live,
        "default_district": settings.default_district
    }


@app.get("/api/locations")
def get_locations():
    """Returns curated Tamil Nadu agricultural districts."""
    return {
        "districts": list(TAMIL_NADU_DISTRICTS.values()),
        "default": "Madurai"
    }


@app.get("/api/weather")
async def get_weather(
    district: str = Query("Madurai", description="Tamil Nadu district name"),
    crop: str = Query("paddy", description="Target crop"),
    growth_stage: str = Query("vegetative", description="Crop growth stage")
):
    """
    Fetches live Open-Meteo weather and executes deterministic agro-climatic
    risk evaluation per backend/config/thresholds.py.
    """
    dist_info = get_district_info(district)
    lat = dist_info["latitude"]
    lon = dist_info["longitude"]

    # 1. Fetch live weather from Open-Meteo
    weather_data = await WeatherService.get_forecast(lat, lon)
    weather_data["district"] = district

    # 2. Deterministic Risk Assessment (LLM NEVER decides risk)
    risk_evaluation = RiskEngine.assess(weather_data, crop=crop, growth_stage=growth_stage)

    # 3. Advisory Narrative
    explanation_en = (
        f"For {crop} in {district} during {growth_stage} stage: "
        f"Overall hazard rating is {risk_evaluation['composite_risk']}. "
        f"{risk_evaluation['rain_reason']}. {risk_evaluation['heat_reason']}. "
        f"Spray window status is {risk_evaluation['spray_window']['status']}. "
        f"Official IMD warnings take priority."
    )

    explanation_ta = (
        f"{district} மாவட்டத்தில் {growth_stage} பருவத்தில் உள்ள {crop} பயிருக்கு: "
        f"ஒட்டுமொத்த இடர் நிலை: {risk_evaluation['composite_risk']}. "
        f"மழை இடர்: {risk_evaluation['rain_risk']}, வெப்ப நிலை: {risk_evaluation['heat_risk']}. "
        f"தெளிப்பு நேரம்: {risk_evaluation['spray_window']['status']}. "
        f"இந்திய வானிலை ஆய்வு மையத்தின் (IMD) அதிகாரப்பூர்வ எச்சரிக்கைகளுக்கே முன்னுரிமை அளிக்கப்பட வேண்டும்."
    )

    return {
        "district": district,
        "crop": crop,
        "growth_stage": growth_stage,
        "weather": weather_data,
        "risk": risk_evaluation,
        "checklist": risk_evaluation["checklist"],
        "spray_window": risk_evaluation["spray_window"],
        "confidence": risk_evaluation.get("confidence"),
        "farm_brief": risk_evaluation.get("farm_brief"),
        "advisory": {
            "explanation": explanation_en,
            "explanation_ta": explanation_ta
        },
        "is_mock_mode": settings.mock_mode
    }


@app.get("/api/history")
async def get_history(district: str = Query("Madurai", description="District name")):
    """
    Historical climate archive endpoint for the Proof Page.
    Replays the Oct 2024 Madurai deluge event.
    """
    dist_info = get_district_info(district)
    history = await WeatherService.get_historical_archive(
        latitude=dist_info["latitude"],
        longitude=dist_info["longitude"],
        start_date="2024-10-24",
        end_date="2024-10-28"
    )
    return {
        "district": district,
        "event_name": "Madurai Extreme Rain & Inundation Event (Oct 2024)",
        "archive": history,
        "lead_time_hours": 48
    }


@app.post("/api/chat")
def chat_with_agent(req: ChatRequest):
    """
    Conversational endpoint interacting with ClimateGuardOrchestrator.
    Returns response, provider status, and full tool-call trace.
    """
    response_text, trace, is_live_call = orchestrator.run(
        query=req.query,
        session_id=req.session_id or "farmer_web_session",
        district=req.district or "Madurai",
        crop=req.crop or "paddy",
        growth_stage=req.growth_stage or "vegetative",
        language=req.language or "en"
    )

    return {
        "response": response_text,
        "provider": "gemini" if is_live_call else "mock",
        "provider_label": "Live agent (Gemini)" if is_live_call else "Mock mode",
        "is_mock": not is_live_call,
        "trace": trace.dict(),
        "district": req.district,
        "crop": req.crop
    }


@app.get("/api/irrigation")
async def get_irrigation_schedule(
    district: str = Query("Madurai", description="District name"),
    crop: str = Query("paddy", description="Target crop"),
    growth_stage: str = Query("vegetative", description="Crop growth stage")
):
    """
    7-Day deterministic irrigation plan derived from Open-Meteo ET0 and forecast rainfall.
    """
    dist_info = get_district_info(district)
    weather_data = await WeatherService.get_forecast(dist_info["latitude"], dist_info["longitude"])
    daily = weather_data.get("daily", {})

    dates = daily.get("time", [])
    et0_list = daily.get("et0_fao_evapotranspiration", [4.0] * 7)
    rain_list = daily.get("precipitation_sum", [0.0] * 7)

    schedule = calculate_7day_irrigation_schedule(
        dates=dates,
        et0_list=et0_list,
        rain_list=rain_list,
        crop=crop,
        growth_stage=growth_stage
    )
    schedule["district"] = district
    return schedule


@app.get("/api/whatif")
async def simulate_whatif_scenario(
    district: str = Query("Madurai", description="District name"),
    crop: str = Query("paddy", description="Target crop"),
    growth_stage: str = Query("vegetative", description="Crop growth stage"),
    dry_days_added: int = Query(0, ge=0, le=14, description="Additional consecutive dry days (0-14)"),
    temp_increase: float = Query(0.0, ge=0.0, le=5.0, description="Temperature increase in °C (0-5)")
):
    """
    What-If? Agro-Climatic Scenario Simulator.
    Re-evaluates deterministic risk on modified forecast.
    Label clearly: 'Scenario, not a forecast.'
    """
    dist_info = get_district_info(district)
    weather_data = await WeatherService.get_forecast(dist_info["latitude"], dist_info["longitude"])

    # 1. Baseline risk evaluation
    baseline_risk = RiskEngine.assess(weather_data, crop=crop, growth_stage=growth_stage)

    # 2. Modify forecast according to simulation parameters
    import copy
    sim_weather = copy.deepcopy(weather_data)
    daily = sim_weather.get("daily", {})
    current = sim_weather.get("current", {})

    # Apply temperature increase
    if "temperature_2m_max" in daily:
        daily["temperature_2m_max"] = [round(t + temp_increase, 1) for t in daily["temperature_2m_max"]]
    if "temperature_2m" in current:
        current["temperature_2m"] = round(current["temperature_2m"] + temp_increase, 1)
    if "apparent_temperature" in current:
        current["apparent_temperature"] = round(current["apparent_temperature"] + (temp_increase * 1.2), 1)

    # Increase ET0 evaporation slightly with heat (+0.2 mm/day per °C)
    if "et0_fao_evapotranspiration" in daily:
        daily["et0_fao_evapotranspiration"] = [
            round(e + (temp_increase * 0.25), 1) for e in daily["et0_fao_evapotranspiration"]
        ]

    # Apply dry spell (zero out rain for dry_days_added)
    if "precipitation_sum" in daily:
        new_rain = list(daily["precipitation_sum"])
        for i in range(min(dry_days_added, len(new_rain))):
            new_rain[i] = 0.0
        daily["precipitation_sum"] = new_rain

    # 3. Deterministic recomputation of risk on modified forecast
    simulated_risk = RiskEngine.assess(sim_weather, crop=crop, growth_stage=growth_stage)

    # 4. Agent explanation of action plan
    heat_diff = simulated_risk["heat_risk"] != baseline_risk["heat_risk"]
    drought_diff = simulated_risk["drought_risk"] != baseline_risk["drought_risk"]

    explanation_en = (
        f"Under this hypothetical scenario (+{temp_increase:.1f}°C heat, {dry_days_added} dry day(s)) for {crop} ({growth_stage} stage) in {district}: "
        f"Overall hazard rating shifts to {simulated_risk['composite_risk']}. "
        f"Heat risk is {simulated_risk['heat_risk']} and drought stress is {simulated_risk['drought_risk']}. "
        f"Action Plan: Prepare organic mulch to conserve root moisture, schedule light evening irrigation, "
        f"and monitor young crops for wilting signs. "
        f"Official IMD warnings take priority."
    )

    explanation_ta = (
        f"இந்த மாதிரி சூழல் ஆய்வில் (+{temp_increase:.1f}°C கூடுதல் வெப்பம், {dry_days_added} நாட்கள் வறட்சி) {district} மாவட்டத்தில் {growth_stage} பருவ {crop} பயிருக்கு: "
        f"ஒட்டுமொத்த இடர் நிலை: {simulated_risk['composite_risk']}. "
        f"வெப்ப இடர்: {simulated_risk['heat_risk']}, வறட்சி இடர்: {simulated_risk['drought_risk']}. "
        f"பாதுகாப்பு நடவடிக்கை: வேர் ஈரப்பதத்தை பாதுகாக்க மூடாக்கு (mulch) இடவும், மாலை வேளையில் குறைந்த நீர் பாய்ச்சவும், "
        f"பயிர் வாடாமல் கண்காணிக்கவும். "
        f"இந்திய வானிலை ஆய்வு மையத்தின் (IMD) அதிகாரப்பூர்வ எச்சரிக்கைகளுக்கே முன்னுரிமை."
    )

    return {
        "is_scenario": True,
        "disclaimer_en": "Scenario, not a forecast.",
        "disclaimer_ta": "இது ஒரு மாதிரி சூழல் ஆய்வு (Scenario), உண்மையான வானிலை முன்னறிவிப்பு அல்ல.",
        "params": {
            "district": district,
            "crop": crop,
            "growth_stage": growth_stage,
            "dry_days_added": dry_days_added,
            "temp_increase": temp_increase
        },
        "baseline_risk": {
            "composite": baseline_risk["composite_risk"],
            "heat": baseline_risk["heat_risk"],
            "drought": baseline_risk["drought_risk"],
            "rain": baseline_risk["rain_risk"],
            "wind": baseline_risk["wind_risk"],
            "temp_max": baseline_risk.get("metrics", {}).get("temp_max"),
            "consecutive_dry_days": baseline_risk.get("metrics", {}).get("consecutive_dry_days")
        },
        "simulated_risk": {
            "composite": simulated_risk["composite_risk"],
            "heat": simulated_risk["heat_risk"],
            "drought": simulated_risk["drought_risk"],
            "rain": simulated_risk["rain_risk"],
            "wind": simulated_risk["wind_risk"],
            "temp_max": simulated_risk.get("metrics", {}).get("temp_max"),
            "consecutive_dry_days": simulated_risk.get("metrics", {}).get("consecutive_dry_days")
        },
        "checklist": simulated_risk["checklist"],
        "explanation_en": explanation_en,
        "explanation_ta": explanation_ta
    }


@app.get("/api/safety-plan")
def get_public_safety_plan(hazard: Optional[str] = None):
    """
    Public safety advice for heat, rain, flood, and cyclone by vulnerable group.
    """
    path = os.path.join(os.path.dirname(__file__), "data", "public_safety_advice.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if hazard and hazard in data:
            return {hazard: data[hazard]}
        return data
    return {}


@app.get("/api/help-places")
def get_nearby_help_places(district: str = Query("Madurai", description="District name")):
    """
    Emergency shelters, relief points, and first aid centers.
    """
    path = os.path.join(os.path.dirname(__file__), "data", "help_places.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["district"] = district
        return data
    return {"district": district, "places": [], "notice": "sample data, verify locally"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.port, reload=True)
