"""
backend/config/thresholds.py

Deterministic agro-climatic threshold definitions for ClimateGuard AI.
Rule: Risk levels (heat, heavy rain, drought, wind) are computed strictly
by deterministic Python rules in this file. The LLM never decides risk;
it only explains it.

Rainfall classes follow official IMD (India Meteorological Department) standards:
  - Very Light / Light: 0.1 - 15.5 mm / day
  - Moderate: 15.6 - 64.4 mm / day
  - Heavy Rain: 64.5 - 115.5 mm / day
  - Very Heavy Rain: 115.6 - 204.4 mm / day
  - Extremely Heavy Rain: >= 204.5 mm / day

Heat and Drought thresholds are configurable heuristics (NOT claimed as TNAU standards).
Spray windows are strictly weather-based (wind speed and precipitation probability).
No pesticide product names or chemical dosages are prescribed.
"""

from enum import Enum
from typing import Dict, Any, Tuple


class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# --- IMD Official Rainfall Thresholds (in mm / 24 hours) ---
IMD_RAIN_VERY_LIGHT_MAX = 15.5
IMD_RAIN_MODERATE_MIN = 15.6
IMD_RAIN_MODERATE_MAX = 64.4
IMD_RAIN_HEAVY_MIN = 64.5
IMD_RAIN_VERY_HEAVY_MIN = 115.6
IMD_RAIN_EXTREMELY_HEAVY_MIN = 204.5


# --- Configurable Heat Stress Heuristics (in °C) ---
HEAT_MODERATE_MIN = 37.0
HEAT_HIGH_MIN = 40.0
HEAT_CRITICAL_MIN = 42.0

# Heat Index (Apparent Temperature) Heuristics
APPARENT_HEAT_MODERATE_MIN = 40.0
APPARENT_HEAT_HIGH_MIN = 43.0
APPARENT_HEAT_CRITICAL_MIN = 46.0


# --- Configurable Drought / Moisture Stress Heuristics ---
# Drought evaluated based on 7-day cumulative rainfall and Evapotranspiration (ET0)
DROUGHT_7DAY_RAIN_MIN_MM = 3.0
DROUGHT_CONSECUTIVE_DRY_DAYS_MODERATE = 5
DROUGHT_CONSECUTIVE_DRY_DAYS_HIGH = 8
DROUGHT_ET0_HIGH_DAILY_MM = 4.5


# --- Wind / Gale Hazard Thresholds (in km/h) ---
# Particularly critical for lodging-susceptible crops like banana and sugarcane
WIND_MODERATE_MIN = 25.0
WIND_HIGH_MIN = 40.0
WIND_CRITICAL_MIN = 55.0


# --- Weather-based Spray Window Constraints ---
# Wind limit: High wind causes spray drift into non-target areas
SPRAY_MAX_WIND_KMH = 15.0
# Rain probability limit: Rain washes off sprayed foliar nutrients / organic solutions
SPRAY_MAX_RAIN_PROB_PCT = 35.0
SPRAY_MAX_RAIN_SUM_MM = 1.0


def calculate_rain_risk(precip_sum_24h: float) -> Tuple[RiskLevel, str]:
    """
    Computes rainfall risk using official IMD classification.
    """
    if precip_sum_24h >= IMD_RAIN_VERY_HEAVY_MIN:
        return RiskLevel.CRITICAL, f"IMD Very Heavy/Extremely Heavy Rain ({precip_sum_24h:.1f} mm)"
    elif precip_sum_24h >= IMD_RAIN_HEAVY_MIN:
        return RiskLevel.HIGH, f"IMD Heavy Rain Alert ({precip_sum_24h:.1f} mm)"
    elif precip_sum_24h >= IMD_RAIN_MODERATE_MIN:
        return RiskLevel.MODERATE, f"IMD Moderate Rain ({precip_sum_24h:.1f} mm)"
    else:
        return RiskLevel.LOW, f"Light rain or dry ({precip_sum_24h:.1f} mm)"


def calculate_heat_risk(temp_max: float, apparent_temp_max: float = 0.0) -> Tuple[RiskLevel, str]:
    """
    Computes heat risk using configurable heuristics.
    """
    effective_temp = max(temp_max, apparent_temp_max)
    if temp_max >= HEAT_CRITICAL_MIN or effective_temp >= APPARENT_HEAT_CRITICAL_MIN:
        return RiskLevel.CRITICAL, f"Severe Heatwave conditions (Max {temp_max:.1f}°C, Feels like {apparent_temp_max:.1f}°C)"
    elif temp_max >= HEAT_HIGH_MIN or effective_temp >= APPARENT_HEAT_HIGH_MIN:
        return RiskLevel.HIGH, f"Heatwave Alert (Max {temp_max:.1f}°C, Feels like {apparent_temp_max:.1f}°C)"
    elif temp_max >= HEAT_MODERATE_MIN or effective_temp >= APPARENT_HEAT_MODERATE_MIN:
        return RiskLevel.MODERATE, f"Elevated Thermal Stress (Max {temp_max:.1f}°C)"
    else:
        return RiskLevel.LOW, f"Normal temperature range (Max {temp_max:.1f}°C)"


def calculate_drought_risk(cumulative_7d_rain: float, avg_7d_et0: float, consecutive_dry_days: int) -> Tuple[RiskLevel, str]:
    """
    Computes drought and dry spell risk using configurable heuristics.
    """
    if consecutive_dry_days >= DROUGHT_CONSECUTIVE_DRY_DAYS_HIGH and cumulative_7d_rain < DROUGHT_7DAY_RAIN_MIN_MM and avg_7d_et0 >= DROUGHT_ET0_HIGH_DAILY_MM:
        return RiskLevel.HIGH, f"Extended dry spell ({consecutive_dry_days} days dry, 7d rain {cumulative_7d_rain:.1f}mm, ET0 {avg_7d_et0:.1f}mm)"
    elif consecutive_dry_days >= DROUGHT_CONSECUTIVE_DRY_DAYS_MODERATE or (cumulative_7d_rain < 5.0 and avg_7d_et0 >= 4.0):
        return RiskLevel.MODERATE, f"Moderate moisture deficit ({consecutive_dry_days} dry days, low rainfall)"
    else:
        return RiskLevel.LOW, f"Moisture deficit within acceptable bounds ({cumulative_7d_rain:.1f}mm rain)"


def calculate_wind_risk(wind_speed_max: float) -> Tuple[RiskLevel, str]:
    """
    Computes wind and gust risk for crop lodging.
    """
    if wind_speed_max >= WIND_CRITICAL_MIN:
        return RiskLevel.CRITICAL, f"Squall / Gale wind risk ({wind_speed_max:.1f} km/h)"
    elif wind_speed_max >= WIND_HIGH_MIN:
        return RiskLevel.HIGH, f"Strong wind alert ({wind_speed_max:.1f} km/h)"
    elif wind_speed_max >= WIND_MODERATE_MIN:
        return RiskLevel.MODERATE, f"Breezy conditions ({wind_speed_max:.1f} km/h)"
    else:
        return RiskLevel.LOW, f"Gentle wind ({wind_speed_max:.1f} km/h)"


def evaluate_spray_window(current_wind_speed: float, rain_probability: float, rain_sum: float) -> Dict[str, Any]:
    """
    Weather-based spray window evaluation.
    Rule: Only weather-based spray windows (wind/rain). No pesticide product names or dosages.
    """
    if current_wind_speed > 25.0 or rain_probability > 60.0 or rain_sum >= 5.0:
        return {
            "status": "UNSAFE",
            "wind_speed": round(current_wind_speed, 1),
            "rain_probability": round(rain_probability, 1),
            "reason_en": "High wind (>25 km/h) or high rain chance. Foliar spray will drift or wash away.",
            "reason_ta": "வேகமான காற்று அல்லது அதிக மழை வாய்ப்பு உள்ளதால், இப்போது தெளிப்பதை தவிர்க்கவும்."
        }
    elif current_wind_speed > SPRAY_MAX_WIND_KMH or rain_probability > SPRAY_MAX_RAIN_PROB_PCT:
        return {
            "status": "CAUTION",
            "wind_speed": round(current_wind_speed, 1),
            "rain_probability": round(rain_probability, 1),
            "reason_en": "Moderate wind or scattered rain chance. Exercise caution during spray.",
            "reason_ta": "மிதமான காற்று அல்லது மழை வாய்ப்பு உள்ளது. கவனத்துடன் தெளிக்கவும்."
        }
    else:
        return {
            "status": "SAFE",
            "wind_speed": round(current_wind_speed, 1),
            "rain_probability": round(rain_probability, 1),
            "reason_en": "Calm wind and dry weather. Ideal window for nutrient/protective foliar spray.",
            "reason_ta": "மிதமான காற்று மற்றும் வறண்ட வானிலை. தெளிப்பதற்கு உகந்த நேரம்."
        }


def calculate_composite_risk(risks: Dict[str, RiskLevel]) -> RiskLevel:
    """
    Composite risk is the maximum severity level across all hazard dimensions.
    """
    hierarchy = [RiskLevel.LOW, RiskLevel.MODERATE, RiskLevel.HIGH, RiskLevel.CRITICAL]
    max_idx = 0
    for level in risks.values():
        if level in hierarchy:
            idx = hierarchy.index(level)
            if idx > max_idx:
                max_idx = idx
    return hierarchy[max_idx]


# --- Deterministic 7-Day Irrigation Scheduling Rules ---

def calculate_daily_irrigation(
    et0: float,
    rain: float,
    crop: str = "paddy",
    growth_stage: str = "vegetative"
) -> Dict[str, Any]:
    """
    Determines daily irrigation action (irrigate / skip / light) based on ET0 and rainfall.
    Rules:
      - Rain >= 10.0 mm or Rain >= ET0 * 1.2: SKIP (natural rain sufficient, prevents waterlogging).
      - Rain between 3.0 mm and 9.9 mm or Net Deficit <= 2.0 mm: LIGHT IRRIGATION (deficit balancing).
      - Rain < 3.0 mm and (ET0 >= 3.5 mm or Net Deficit > 2.0 mm): IRRIGATE (evaporative demand high).
    """
    deficit = round(et0 - rain, 1)

    if rain >= 10.0 or (et0 > 0 and rain >= et0 * 1.2):
        action = "skip"
        label_en = "Skip Irrigation"
        label_ta = "பாசனம் தவிர்க்கவும்"
        reason_en = f"Forecast rain ({rain:.1f} mm) exceeds evaporative loss ({et0:.1f} mm). Conserve water and pump power."
        reason_ta = f"எதிர்பார்க்கப்படும் மழை ({rain:.1f} மி.மீ) நீராவிப்போக்கை விட அதிகமாக உள்ளதால் பாசனம் தேவையில்லை."
    elif rain >= 3.0 or (0.0 <= deficit <= 2.0):
        action = "light"
        label_en = "Light Irrigation"
        label_ta = "குறைந்த பாசனம்"
        reason_en = f"Rain ({rain:.1f} mm) partially offsets ET0 ({et0:.1f} mm). Apply light moisture replenishment."
        reason_ta = f"மழை ({rain:.1f} மி.மீ) ஓரளவுக்கு ஈரப்பதம் தரும். குறைந்த அளவு நீர் பாய்ச்சினால் போதுமானது."
    else:
        action = "irrigate"
        label_en = "Normal Irrigation"
        label_ta = "பாசனம் செய்யவும்"
        reason_en = f"High evaporative loss ({et0:.1f} mm) with minimal rain ({rain:.1f} mm). Soil moisture requires full replenishment."
        reason_ta = f"அதிக நீராவிப்போக்கு ({et0:.1f} மி.மீ) மற்றும் குறைந்த மழையினால் பயிருக்கு முழுமையான பாசனம் தேவை."

    return {
        "action": action,
        "label_en": label_en,
        "label_ta": label_ta,
        "et0": round(et0, 1),
        "rain": round(rain, 1),
        "deficit": deficit,
        "reason_en": reason_en,
        "reason_ta": reason_ta
    }


def calculate_7day_irrigation_schedule(
    dates: list,
    et0_list: list,
    rain_list: list,
    crop: str = "paddy",
    growth_stage: str = "vegetative"
) -> Dict[str, Any]:
    """
    Computes a deterministic 7-day irrigation schedule from Open-Meteo ET0 and rain.
    """
    days = []
    total_et0 = 0.0
    total_rain = 0.0
    skip_count = 0
    light_count = 0
    irrigate_count = 0

    num_days = min(len(dates), len(et0_list), len(rain_list), 7)
    for i in range(num_days):
        date_str = dates[i]
        et0 = float(et0_list[i]) if i < len(et0_list) and et0_list[i] is not None else 4.0
        rain = float(rain_list[i]) if i < len(rain_list) and rain_list[i] is not None else 0.0
        total_et0 += et0
        total_rain += rain

        daily_res = calculate_daily_irrigation(et0, rain, crop, growth_stage)
        daily_res["date"] = date_str
        daily_res["day_index"] = i

        if daily_res["action"] == "skip":
            skip_count += 1
        elif daily_res["action"] == "light":
            light_count += 1
        else:
            irrigate_count += 1

        days.append(daily_res)

    net_deficit = round(total_et0 - total_rain, 1)

    # Agent-style explanation
    explanation_en = (
        f"Over the next 7 days for {crop} ({growth_stage} stage), cumulative crop water demand (ET0) "
        f"is {total_et0:.1f} mm against expected rainfall of {total_rain:.1f} mm (net deficit: {net_deficit:.1f} mm). "
        f"Recommended schedule: {irrigate_count} irrigate day(s), {light_count} light irrigation day(s), "
        f"and {skip_count} skip day(s). Always prioritize official IMD warnings."
    )

    explanation_ta = (
        f"அடுத்த 7 நாட்களில் {growth_stage} பருவத்தில் உள்ள {crop} பயிருக்கு மொத்த நீர்த்தேவை (ET0) "
        f"{total_et0:.1f} மி.மீ; எதிர்பார்க்கப்படும் மழை {total_rain:.1f} மி.மீ (நிகர நீர் பற்றாக்குறை: {net_deficit:.1f} மி.மீ). "
        f"பரிந்துரைக்கப்பட்ட அட்டவணை: {irrigate_count} நாள்(கள்) முழு பாசனம், {light_count} நாள்(கள்) குறைந்த பாசனம், "
        f"{skip_count} நாள்(கள்) பாசனம் தவிர்ப்பு. அதிகாரப்பூர்வ IMD எச்சரிக்கைகளுக்கு முன்னுரிமை அளிக்கவும்."
    )

    return {
        "crop": crop,
        "growth_stage": growth_stage,
        "days": days,
        "total_et0": round(total_et0, 1),
        "total_rain": round(total_rain, 1),
        "net_deficit": net_deficit,
        "counts": {
            "irrigate": irrigate_count,
            "light": light_count,
            "skip": skip_count
        },
        "explanation_en": explanation_en,
        "explanation_ta": explanation_ta
    }

