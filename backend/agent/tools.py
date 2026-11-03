"""
backend/agent/tools.py

Tool definitions for ClimateGuard AI using Strands Agents SDK.
Rule: The LLM NEVER computes risk. assess_risk invokes the deterministic
Python risk engine in backend/config/thresholds.py.

Tools provided:
  - @tool get_forecast: Open-Meteo live observation and 7-day forecast
  - @tool assess_risk: Deterministic agromet evaluation (calls backend/config/thresholds.py)
  - @tool crop_advice: Reads backend/agent/data/guidance.json (every item has id, text, source_url, date_read)
  - @tool find_shelters: Emergency market yards and relief shelters
  - @tool daily_farm_brief: SMS-style daily brief
"""
from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, Any, List

try:
    from strands import tool
except ImportError:
    def tool(func):
        return func

try:
    from backend.data.locations import get_district_info, TAMIL_NADU_DISTRICTS
    from backend.services.weather_service import WeatherService
    from backend.services.risk_engine import RiskEngine
except (ModuleNotFoundError, ImportError):
    try:
        from data.locations import get_district_info, TAMIL_NADU_DISTRICTS
        from services.weather_service import WeatherService
        from services.risk_engine import RiskEngine
    except (ModuleNotFoundError, ImportError):
        # Fallback if neither is on path yet
        import sys
        backend_dir = Path(__file__).resolve().parent.parent
        project_root = backend_dir.parent
        for p in (str(backend_dir), str(project_root)):
            if p not in sys.path:
                sys.path.insert(0, p)
        try:
            from backend.data.locations import get_district_info, TAMIL_NADU_DISTRICTS
            from backend.services.weather_service import WeatherService
            from backend.services.risk_engine import RiskEngine
        except (ModuleNotFoundError, ImportError):
            from data.locations import get_district_info, TAMIL_NADU_DISTRICTS
            from services.weather_service import WeatherService
            from services.risk_engine import RiskEngine

DATA_DIR = Path(__file__).parent / "data"
TAMIL_REGEX = re.compile(r"[\u0B80-\u0BFF]")


@lru_cache(maxsize=1)
def guidance() -> dict:
    """Loads authoritative agronomic guidance from backend/agent/data/guidance.json."""
    guidance_file = DATA_DIR / "guidance.json"
    if not guidance_file.exists():
        return {"items": []}
    return json.loads(guidance_file.read_text(encoding="utf-8"))


def guidance_ids() -> set[str]:
    """Returns all verified guidance IDs from guidance.json."""
    return {item["id"] for item in guidance().get("items", [])}


def language_of(text: str) -> str:
    """Returns 'ta' if the text contains Tamil characters, otherwise 'en'."""
    return "ta" if TAMIL_REGEX.search(text or "") else "en"


def has_tamil(text: str) -> bool:
    """Checks whether the text contains any Tamil script glyphs."""
    return bool(TAMIL_REGEX.search(text or ""))


# Emergency shelters and regulated market yards in Tamil Nadu
SHELTER_DATABASE = {
    "Madurai": {
        "market_yard": "Madurai Mattuthavani Regulated Market Yard & Grain Storage",
        "shelter": "Madurai District Disaster Relief Centre, Collectorate Complex",
        "agri_officer_phone": "0452-2531110",
        "kisan_call_center": "1800-180-1551"
    },
    "Thanjavur": {
        "market_yard": "Thanjavur Central Regulated Market & Silo Storage, Vallam",
        "shelter": "Delta Cyclone Relief Cyclone Shelter, Kumbakonam Road",
        "agri_officer_phone": "04362-230121",
        "kisan_call_center": "1800-180-1551"
    },
    "Cuddalore": {
        "market_yard": "Cuddalore Port Agri Marketing Warehouse, Semmandalam",
        "shelter": "Multi-Purpose Cyclone Shelter (MPCS), Cuddalore Old Town",
        "agri_officer_phone": "04142-230005",
        "kisan_call_center": "1800-180-1551"
    },
    "Nagapattinam": {
        "market_yard": "Nagapattinam Regulated Market Complex, Velipalayam",
        "shelter": "Coastal Cyclone Protection Shelter, Nagore Coastal Zone",
        "agri_officer_phone": "04365-242200",
        "kisan_call_center": "1800-180-1551"
    }
}


@tool
def get_forecast(district: str = "Madurai") -> dict:
    """
    Fetches real-time weather observation and 7-day forecast for any Tamil Nadu district.
    Args:
        district: Name of the Tamil Nadu district (e.g. Madurai, Thanjavur, Cuddalore).
    Returns:
        Dictionary containing current observation and 7-day daily forecast metrics.
    """
    dist_info = get_district_info(district)
    lat = dist_info["latitude"]
    lon = dist_info["longitude"]

    forecast = WeatherService.get_forecast_sync(lat, lon)
    return {
        "district": district,
        "current": forecast.get("current", {}),
        "today_daily": {
            "temp_max": forecast.get("daily", {}).get("temperature_2m_max", [32.0])[0],
            "temp_min": forecast.get("daily", {}).get("temperature_2m_min", [24.0])[0],
            "rain_sum": forecast.get("daily", {}).get("precipitation_sum", [0.0])[0],
            "rain_prob": forecast.get("daily", {}).get("precipitation_probability_max", [20])[0],
            "wind_max": forecast.get("daily", {}).get("wind_speed_10m_max", [12.0])[0],
            "et0": forecast.get("daily", {}).get("et0_fao_evapotranspiration", [4.0])[0],
        },
        "daily": forecast.get("daily", {})
    }


def assess_risk_dict(district: str = "Madurai", crop: str = "paddy", growth_stage: str = "vegetative") -> dict:
    """
    Internal helper that executes deterministic risk computation via RiskEngine and thresholds.py.
    """
    dist_info = get_district_info(district)
    full_weather = WeatherService.get_forecast_sync(dist_info["latitude"], dist_info["longitude"])
    full_weather["district"] = district
    return RiskEngine.assess(full_weather, crop=crop, growth_stage=growth_stage)


@tool
def assess_risk(district: str = "Madurai", crop: str = "paddy", growth_stage: str = "vegetative") -> dict:
    """
    Deterministically computes hazard levels (Heat, Rain, Drought, Wind) and spray windows.
    IMPORTANT: The LLM does NOT determine risk. It delegates to thresholds.py rules.
    Args:
        district: District name in Tamil Nadu.
        crop: Agricultural crop (e.g. paddy, banana, groundnut, sugarcane, cotton).
        growth_stage: Current stage (sowing, vegetative, flowering, harvest).
    Returns:
        Dictionary containing deterministic risk levels, spray window, and metrics.
    """
    risk_eval = assess_risk_dict(district, crop, growth_stage)
    return {
        "district": district,
        "crop": crop,
        "growth_stage": growth_stage,
        "composite_risk": risk_eval["composite_risk"],
        "heat_risk": risk_eval["heat_risk"],
        "heat_reason": risk_eval["heat_reason"],
        "rain_risk": risk_eval["rain_risk"],
        "rain_reason": risk_eval["rain_reason"],
        "drought_risk": risk_eval["drought_risk"],
        "drought_reason": risk_eval["drought_reason"],
        "wind_risk": risk_eval["wind_risk"],
        "wind_reason": risk_eval["wind_reason"],
        "spray_window": risk_eval["spray_window"],
        "confidence": risk_eval.get("confidence", {}),
        "farm_brief": risk_eval.get("farm_brief", {}),
        "metrics": risk_eval["metrics"]
    }


@tool
def crop_advice(crop: str = "paddy", growth_stage: str = "vegetative", risk_level: str = "LOW") -> list[dict]:
    """
    Reads authoritative crop guidance from backend/agent/data/guidance.json.
    Every item returned contains id, text, source_url, and date_read.
    Rule: NO pesticide chemical names or dosages; only agromet safeguards.
    Args:
        crop: Crop name (e.g. paddy, banana, groundnut, sugarcane, cotton).
        growth_stage: Current stage (sowing, vegetative, flowering, harvest).
        risk_level: Computed composite risk (LOW, MODERATE, HIGH, CRITICAL).
    Returns:
        List of curated guidance dictionaries backed by authoritative sources.
    """
    all_items = guidance().get("items", [])
    crop_lower = crop.lower()

    # Prioritize guidance matching crop or general, and relevant hazards
    matched = []
    for item in all_items:
        item_crop = item.get("crop", "general").lower()
        if item_crop == "general" or item_crop == crop_lower:
            matched.append({
                "id": item["id"],
                "text": item["text"],
                "source_url": item["source_url"],
                "date_read": item["date_read"]
            })

    # Return top 4 most pertinent guidance items
    return matched[:4] if matched else all_items[:3]


@tool
def find_shelters(district: str = "Madurai") -> dict:
    """
    Locates emergency crop storage, regulated market yards, and disaster shelters for a Tamil Nadu district.
    Args:
        district: District name in Tamil Nadu.
    Returns:
        Dictionary containing nearest market yard, disaster shelter, and helpline numbers.
    """
    shelter_info = SHELTER_DATABASE.get(district, {
        "market_yard": f"{district} Central Regulated Market Yard & Storage Warehouse",
        "shelter": f"{district} Multi-Hazard Disaster Relief Center",
        "agri_officer_phone": "044-28521500 (TN Agriculture Directorate)",
        "kisan_call_center": "1800-180-1551"
    })

    return {
        "district": district,
        "details": shelter_info,
        "helpline": "1800-180-1551 (Toll-Free Kisan Call Centre)",
        "state_disaster_helpline": "1077 (Disaster Control Room)"
    }


@tool
def daily_farm_brief(district: str = "Madurai", crop: str = "paddy", growth_stage: str = "vegetative", language: str = "en") -> dict:
    """
    Produces a short farm brief (strictly max 300 characters) in English or Tamil,
    covering the top risk, one concrete action for today, and one thing to avoid.
    Args:
        district: Name of Tamil Nadu district.
        crop: Target crop (e.g. paddy, banana, groundnut).
        growth_stage: Current stage (sowing, vegetative, flowering, harvest).
        language: Language code ('en' or 'ta').
    Returns:
        Dictionary containing the brief, top risk, action today, and thing to avoid.
    """
    risk_eval = assess_risk_dict(district, crop, growth_stage)
    brief = risk_eval.get("farm_brief", {})

    selected_brief = brief.get("brief_ta" if language == "ta" else "brief_en", "")
    return {
        "district": district,
        "crop": crop,
        "language": language,
        "brief": selected_brief,
        "brief_en": brief.get("brief_en", ""),
        "brief_ta": brief.get("brief_ta", ""),
        "top_risk": brief.get("top_risk", ""),
        "action_today": brief.get("action_today_ta" if language == "ta" else "action_today_en", ""),
        "avoid_today": brief.get("avoid_today_ta" if language == "ta" else "avoid_today_en", ""),
        "char_count": len(selected_brief)
    }
