"""
backend/agent/tools.py

Tool functions for Strands Agents SDK.
Rule: The LLM NEVER computes risk. assess_risk invokes the deterministic
Python risk engine in backend/config/thresholds.py.
"""

import json
from typing import Dict, Any

try:
    from strands import tool
except ImportError:
    # Graceful decorator fallback if strands is imported dynamically
    def tool(func):
        return func

from backend.data.locations import get_district_info, TAMIL_NADU_DISTRICTS
from backend.services.weather_service import WeatherService
from backend.services.risk_engine import RiskEngine


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
def get_forecast(district: str) -> str:
    """
    Fetches real-time weather observation and 7-day forecast for any Tamil Nadu district.
    Args:
        district: Name of the Tamil Nadu district (e.g. Madurai, Thanjavur).
    Returns:
        JSON string of current weather and 7-day forecast.
    """
    dist_info = get_district_info(district)
    lat = dist_info["latitude"]
    lon = dist_info["longitude"]

    forecast = WeatherService.get_forecast_sync(lat, lon)

    return json.dumps({
        "district": district,
        "current": forecast.get("current", {}),
        "today_daily": {
            "temp_max": forecast.get("daily", {}).get("temperature_2m_max", [32.0])[0],
            "temp_min": forecast.get("daily", {}).get("temperature_2m_min", [24.0])[0],
            "rain_sum": forecast.get("daily", {}).get("precipitation_sum", [0.0])[0],
            "rain_prob": forecast.get("daily", {}).get("precipitation_probability_max", [20])[0],
            "wind_max": forecast.get("daily", {}).get("wind_speed_10m_max", [12.0])[0],
        },
        "daily": forecast.get("daily", {})
    })


@tool
def assess_risk(district: str, crop: str = "paddy", growth_stage: str = "vegetative") -> str:
    """
    Deterministically computes hazard levels (Heat, Rain, Drought, Wind) and spray windows.
    IMPORTANT: The LLM does NOT determine risk. It delegates to thresholds.py rules.
    Args:
        district: District name in Tamil Nadu.
        crop: Agricultural crop (e.g. paddy, banana, groundnut, sugarcane, cotton).
        growth_stage: Current stage (sowing, vegetative, flowering, harvest).
    Returns:
        JSON string containing deterministic risk levels, spray window, and metrics.
    """
    dist_info = get_district_info(district)
    full_weather = WeatherService.get_forecast_sync(dist_info["latitude"], dist_info["longitude"])

    risk_eval = RiskEngine.assess(full_weather, crop=crop, growth_stage=growth_stage)
    return json.dumps({
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
    })


@tool
def daily_farm_brief(district: str = "Madurai", crop: str = "paddy", growth_stage: str = "vegetative", language: str = "en") -> str:
    """
    Produces a short farm brief (strictly max 300 characters) in English or Tamil,
    covering the top risk, one concrete action for today, and one thing to avoid.
    Args:
        district: Name of Tamil Nadu district.
        crop: Target crop (e.g. paddy, banana, groundnut).
        growth_stage: Current stage (sowing, vegetative, flowering, harvest).
        language: Language code ('en' or 'ta').
    Returns:
        JSON string containing the SMS brief (max 300 chars), top risk, action today, and thing to avoid.
    """
    dist_info = get_district_info(district)
    full_weather = WeatherService.get_forecast_sync(dist_info["latitude"], dist_info["longitude"])

    full_weather["district"] = district
    risk_eval = RiskEngine.assess(full_weather, crop=crop, growth_stage=growth_stage)
    brief = risk_eval.get("farm_brief", {})

    selected_brief = brief.get("brief_ta" if language == "ta" else "brief_en", "")
    return json.dumps({
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
    })


@tool
def crop_advice(crop: str, growth_stage: str, risk_level: str) -> str:
    """
    Generates actionable farm safeguards for a given crop and growth stage under specific weather risk.
    Rule: NO pesticide chemical names or dosages; only weather-based irrigation and cultural safeguards.
    Args:
        crop: Crop name.
        growth_stage: Current growth stage.
        risk_level: Computed composite risk (LOW, MODERATE, HIGH, CRITICAL).
    Returns:
        Actionable recommendations in English and Tamil.
    """
    crop_lower = crop.lower()
    advice_en = []
    advice_ta = []

    if crop_lower == "paddy":
        if risk_level in ("HIGH", "CRITICAL"):
            advice_en.append("Drain excess water from field nursery immediately to prevent submergence injury.")
            advice_en.append("Withhold chemical fertilizer application until field waters recede.")
            advice_ta.append("நாற்றங்கால் வயல்களில் நீர் தேங்காமல் உடனடியாக வடிகால் வாய்க்கால்களை திறந்துவிடவும்.")
            advice_ta.append("வெள்ளநீர் வடியும் வரை ரசாயன உரங்களை இடுவதை முழுமையாக தவிர்க்கவும்.")
        else:
            advice_en.append("Maintain 2 to 3 cm shallow standing water for vegetative paddy.")
            advice_ta.append("தழைப்பருவ நெற்பயிருக்கு 2 முதல் 3 செ.மீ அளவு சீரான நீர்மட்டம் இருக்குமாறு பராமரிக்கவும்.")

    elif crop_lower == "banana":
        if risk_level in ("HIGH", "CRITICAL"):
            advice_en.append("Provide bamboo or casuarina propping support for tall and bunch-bearing banana plants to prevent lodging.")
            advice_ta.append("காற்றினால் மரம் சாயாமல் இருக்க சவுக்கு அல்லது மூங்கில் கழி கொண்டு முட்டுக் கொடுக்கவும்.")
        else:
            advice_en.append("Regular trench irrigation and check bunch propping ties.")
            advice_ta.append("வழக்கமான பாசனத்தை மேற்கொண்டு வாழை மர முட்டு கம்புகளை சரிபார்க்கவும்.")

    elif crop_lower == "groundnut":
        if risk_level in ("HIGH", "CRITICAL"):
            advice_en.append("Provide cross-drainage channels in groundnut beds to prevent collar rot and pod decay.")
            advice_ta.append("நிலக்கடலை பாத்திகளில் நீர் தேங்காமல் இருக்க குறுக்கு வடிகால்களை வெட்டவும்.")
        else:
            advice_en.append("Maintain adequate soil moisture during pod development stage.")
            advice_ta.append("காய் பிடிக்கும் பருவத்தில் நிலத்தில் உகந்த ஈரப்பதம் இருக்குமாறு பாசனம் செய்யவும்.")

    else:
        advice_en.append(f"Ensure field drainage channels are clear and monitor {crop} root zone moisture.")
        advice_ta.append(f"வயல் வடிகால்களை தூர்வாரி {crop} பயிர் வேர் பகுதியில் ஈரப்பதத்தை கண்காணிக்கவும்.")

    return json.dumps({
        "crop": crop,
        "growth_stage": growth_stage,
        "risk_level": risk_level,
        "safeguards_en": advice_en,
        "safeguards_ta": advice_ta
    })


@tool
def find_shelters(district: str) -> str:
    """
    Locates emergency crop storage, regulated market yards, and disaster shelters for a Tamil Nadu district.
    Args:
        district: District name in Tamil Nadu.
    Returns:
        JSON string containing nearest market yard, disaster shelter, and helpline numbers.
    """
    shelter_info = SHELTER_DATABASE.get(district, {
        "market_yard": f"{district} Central Regulated Market Yard & Storage Warehouse",
        "shelter": f"{district} Multi-Hazard Disaster Relief Center",
        "agri_officer_phone": "044-28521500 (TN Agriculture Directorate)",
        "kisan_call_center": "1800-180-1551"
    })

    return json.dumps({
        "district": district,
        "details": shelter_info,
        "helpline": "1800-180-1551 (Toll-Free Kisan Call Centre)",
        "state_disaster_helpline": "1077 (Disaster Control Room)"
    })
