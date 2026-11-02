"""
backend/services/risk_engine.py

Deterministic Risk Engine applying backend/config/thresholds.py rules
to real-time Open-Meteo weather data.
Rule: The LLM NEVER computes risk. All risk classifications, thresholds,
spray windows, and proactive checklists are generated deterministically here.
"""

from typing import Dict, Any, List, Optional
import os
import json
from backend.config.thresholds import (
    RiskLevel,
    calculate_rain_risk,
    calculate_heat_risk,
    calculate_drought_risk,
    calculate_wind_risk,
    evaluate_spray_window,
    calculate_composite_risk
)


class RiskEngine:
    @staticmethod
    def assess(
        weather_data: Dict[str, Any],
        crop: str = "paddy",
        growth_stage: str = "vegetative",
        user_type: str = "farmer",
        protecting: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes deterministic rules over live weather forecast.
        Reused for both Farmer and General Public modes.
        """
        if not protecting:
            protecting = ["everyone"]
        daily = weather_data.get("daily", {})
        current = weather_data.get("current", {})

        # Extract primary metrics
        today_max_temp = daily.get("temperature_2m_max", [current.get("temperature_2m", 30.0)])[0]
        apparent_temp = current.get("apparent_temperature", today_max_temp)
        today_rain_sum = daily.get("precipitation_sum", [current.get("precipitation", 0.0)])[0]
        today_max_wind = daily.get("wind_speed_10m_max", [current.get("wind_speed_10m", 10.0)])[0]
        today_rain_prob = daily.get("precipitation_probability_max", [30])[0]

        # 7-day cumulative rainfall and average ET0
        precip_sums = daily.get("precipitation_sum", [today_rain_sum])
        et0_values = daily.get("et0_fao_evapotranspiration", [4.0])
        cumulative_7d_rain = sum(precip_sums[:7])
        avg_7d_et0 = sum(et0_values[:7]) / max(len(et0_values[:7]), 1)

        # Count consecutive dry days (rain < 1.0 mm)
        consecutive_dry_days = 0
        for r in precip_sums:
            if r < 1.0:
                consecutive_dry_days += 1
            else:
                break

        # 1. Deterministic Heat Assessment
        heat_risk, heat_reason = calculate_heat_risk(today_max_temp, apparent_temp)

        # 2. Deterministic Rainfall Assessment (IMD standard)
        rain_risk, rain_reason = calculate_rain_risk(today_rain_sum)

        # 3. Deterministic Drought Assessment
        drought_risk, drought_reason = calculate_drought_risk(cumulative_7d_rain, avg_7d_et0, consecutive_dry_days)

        # 4. Deterministic Wind Assessment
        wind_risk, wind_reason = calculate_wind_risk(today_max_wind)

        # 5. Composite Risk
        composite = calculate_composite_risk({
            "heat": heat_risk,
            "rain": rain_risk,
            "drought": drought_risk,
            "wind": wind_risk
        })

        # 6. Spray Window (strictly weather-based: wind/rain)
        spray_eval = evaluate_spray_window(
            current_wind_speed=current.get("wind_speed_10m", 10.0),
            rain_probability=today_rain_prob,
            rain_sum=today_rain_sum
        )

        # 7. Proactive Checklist grouped by next 6h / 24h / 48h
        checklist = RiskEngine._build_proactive_checklist(
            crop=crop,
            stage=growth_stage,
            heat_risk=heat_risk,
            rain_risk=rain_risk,
            wind_risk=wind_risk,
            drought_risk=drought_risk
        )

        # 8. Deterministic Forecast Confidence across multi-models
        confidence_eval = RiskEngine.compute_confidence(
            daily=daily,
            models=weather_data.get("models_used", ["ecmwf_ifs025", "gfs_seamless", "icon_seamless"])
        )

        result = {
            "composite_risk": composite.value,
            "heat_risk": heat_risk.value,
            "heat_reason": heat_reason,
            "rain_risk": rain_risk.value,
            "rain_reason": rain_reason,
            "drought_risk": drought_risk.value,
            "drought_reason": drought_reason,
            "wind_risk": wind_risk.value,
            "wind_reason": wind_reason,
            "metrics": {
                "temp_max": round(today_max_temp, 1),
                "apparent_temp": round(apparent_temp, 1),
                "precipitation_sum": round(today_rain_sum, 1),
                "precipitation_probability": round(today_rain_prob, 0),
                "wind_speed_max": round(today_max_wind, 1),
                "consecutive_dry_days": consecutive_dry_days,
                "cumulative_7d_rain": round(cumulative_7d_rain, 1),
                "avg_7d_et0": round(avg_7d_et0, 2)
            },
            "spray_window": spray_eval,
            "checklist": checklist,
            "confidence": confidence_eval
        }

        # 9. Daily Farm Brief (max 300 characters)
        farm_brief = RiskEngine.generate_farm_brief(
            risk_data=result,
            crop=crop,
            district=weather_data.get("district", "Madurai"),
            growth_stage=growth_stage
        )
        result["farm_brief"] = farm_brief

        # 10. General Public Safety: Checklist, Brief, Nearby Help, and Emergency Contacts
        district_name = weather_data.get("district", "Madurai")
        public_checklist = RiskEngine.build_public_safety_checklist(
            heat_risk=heat_risk,
            rain_risk=rain_risk,
            wind_risk=wind_risk,
            drought_risk=drought_risk,
            groups=protecting
        )
        public_brief = RiskEngine.generate_public_safety_brief(
            risk_data=result,
            district=district_name,
            groups=protecting
        )
        help_places = RiskEngine.load_help_places(district=district_name)
        emergency_contacts = {
            "national_emergency": "112",
            "disaster_helpline_tn": "1077 (District Disaster Control Room)",
            "state_disaster_placeholder": "TN State Disaster Helpline: [Placeholder - User will fill in]",
            "ambulance": "108",
            "women_helpline": "1091",
            "childline": "1098"
        }

        result["public_safety_checklist"] = public_checklist
        result["public_safety_brief"] = public_brief
        result["help_places"] = help_places
        result["emergency_contacts"] = emergency_contacts
        result["user_type"] = user_type
        result["protecting"] = protecting
        return result

    @staticmethod
    def compute_confidence(daily: Dict[str, Any], models: List[str] = None) -> Dict[str, Any]:
        """
        Computes deterministic forecast confidence scores per hazard (heat, rain, drought, wind)
        and composite confidence based on model spread across Open-Meteo models (e.g. ECMWF, GFS, ICON).
        Returns HIGH, MEDIUM, or LOW confidence.
        """
        if not models:
            models = ["ecmwf_ifs025", "gfs_seamless", "icon_seamless"]

        # 1. Heat Confidence: spread in max temp (°C) for day 0
        heat_vals = []
        for m in models:
            val = daily.get(f"temperature_2m_max_{m}", [None])[0] if f"temperature_2m_max_{m}" in daily else None
            if val is not None:
                heat_vals.append(float(val))

        if len(heat_vals) >= 2:
            heat_spread = max(heat_vals) - min(heat_vals)
            if heat_spread <= 2.0:
                heat_conf = "HIGH"
            elif heat_spread <= 4.0:
                heat_conf = "MEDIUM"
            else:
                heat_conf = "LOW"
        else:
            heat_spread = 0.0
            heat_conf = "HIGH"

        # 2. Rain Confidence: spread in precipitation sum (mm) for day 0
        rain_vals = []
        for m in models:
            val = daily.get(f"precipitation_sum_{m}", [None])[0] if f"precipitation_sum_{m}" in daily else None
            if val is not None:
                rain_vals.append(float(val))

        if len(rain_vals) >= 2:
            rain_spread = max(rain_vals) - min(rain_vals)
            if rain_spread <= 5.0:
                rain_conf = "HIGH"
            elif rain_spread <= 20.0:
                rain_conf = "MEDIUM"
            else:
                rain_conf = "LOW"
        else:
            rain_spread = 0.0
            rain_conf = "HIGH"

        # 3. Wind Confidence: spread in wind_speed_10m_max (km/h) for day 0
        wind_vals = []
        for m in models:
            val = daily.get(f"wind_speed_10m_max_{m}", [None])[0] if f"wind_speed_10m_max_{m}" in daily else None
            if val is not None:
                wind_vals.append(float(val))

        if len(wind_vals) >= 2:
            wind_spread = max(wind_vals) - min(wind_vals)
            if wind_spread <= 8.0:
                wind_conf = "HIGH"
            elif wind_spread <= 18.0:
                wind_conf = "MEDIUM"
            else:
                wind_conf = "LOW"
        else:
            wind_spread = 0.0
            wind_conf = "HIGH"

        # 4. Drought Confidence: derived from rain & heat model consistency
        if rain_conf == "LOW" or heat_conf == "LOW":
            drought_conf = "LOW"
        elif rain_conf == "MEDIUM" or heat_conf == "MEDIUM":
            drought_conf = "MEDIUM"
        else:
            drought_conf = "HIGH"

        # 5. Composite Confidence: overall forecast confidence
        if rain_conf == "LOW" or heat_conf == "LOW":
            composite_conf = "LOW"
        elif any(c == "MEDIUM" for c in (rain_conf, heat_conf, wind_conf, drought_conf)):
            composite_conf = "MEDIUM"
        else:
            composite_conf = "HIGH"

        return {
            "heat": heat_conf,
            "rain": rain_conf,
            "drought": drought_conf,
            "wind": wind_conf,
            "composite": composite_conf,
            "disagree_alert": "Models disagree, check official IMD alert",
            "spread": {
                "heat_c": round(heat_spread, 1),
                "rain_mm": round(rain_spread, 1),
                "wind_kmh": round(wind_spread, 1),
                "models_count": max(len(heat_vals), len(rain_vals), len(wind_vals))
            }
        }

    @staticmethod
    def generate_farm_brief(
        risk_data: Dict[str, Any],
        crop: str = "paddy",
        district: str = "Madurai",
        growth_stage: str = "vegetative"
    ) -> Dict[str, Any]:
        """
        Produces a concise daily farm brief (strictly max 300 characters) in English and Tamil,
        covering the top risk, one concrete action for today, and one thing to avoid.
        """
        severity_rank = {"CRITICAL": 4, "HIGH": 3, "MODERATE": 2, "LOW": 1}
        hazards = [
            ("rain", risk_data.get("rain_risk", "LOW"), "Rain", "கனமழை"),
            ("wind", risk_data.get("wind_risk", "LOW"), "Wind", "காற்று"),
            ("heat", risk_data.get("heat_risk", "LOW"), "Heat", "வெப்பம்"),
            ("drought", risk_data.get("drought_risk", "LOW"), "Drought", "வறட்சி"),
        ]
        sorted_hazards = sorted(hazards, key=lambda h: severity_rank.get(h[1], 1), reverse=True)
        top_h = sorted_hazards[0]

        top_h_level = top_h[1]
        top_h_name_en = top_h[2]
        top_h_name_ta = top_h[3]

        if top_h_level in ("HIGH", "CRITICAL"):
            top_risk_en = f"High {top_h_name_en} Hazard"
            top_risk_ta = f"அதிக {top_h_name_ta} இடர்"
        elif top_h_level == "MODERATE":
            top_risk_en = f"Moderate {top_h_name_en} Risk"
            top_risk_ta = f"மிதமான {top_h_name_ta} இடர்"
        else:
            top_risk_en = "Low Risk / Favorable"
            top_risk_ta = "குறைந்த இடர் / சாதகமானது"

        spray = risk_data.get("spray_window", {}).get("status", "SAFE")
        if top_h[0] == "rain" and top_h_level in ("HIGH", "CRITICAL"):
            action_en = "Clear bund outlets and open field drainage."
            action_ta = "வயல் வரப்பு வடிகால்களை உடனடியாக திறந்துவிடவும்."
            avoid_en = "Fertilizer top-dressing and field irrigation."
            avoid_ta = "மேல்உரம் இடுவதையும் பாசனம் செய்வதையும்."
        elif top_h[0] == "wind" and top_h_level in ("HIGH", "CRITICAL"):
            action_en = f"Secure {crop} plants and tie protective support."
            action_ta = f"{crop} பயிர்களுக்கு முட்டுக் கொடுத்து பாதுகாக்கவும்."
            avoid_en = "Leaving farm equipment or shade netting loose."
            avoid_ta = "நிழல்வலை மற்றும் கருவிகளை பாதுகாக்காமல் விடுவதை."
        elif top_h[0] == "heat" and top_h_level in ("HIGH", "CRITICAL"):
            action_en = "Provide light evening irrigation to cool soil."
            action_ta = "மண் சூடு தணிய மாலை வேளையில் நீர் பாய்ச்சவும்."
            avoid_en = "Flood irrigation during peak noon heat."
            avoid_ta = "நண்பகல் வெயிலில் பாசனம் செய்வதை."
        elif top_h[0] == "drought" and top_h_level in ("HIGH", "CRITICAL"):
            action_en = "Use drip or alternate furrow water saving."
            action_ta = "சொட்டுநீர் அல்லது மாற்று வரிசை பாசனம் செய்யவும்."
            avoid_en = "Over-irrigating and weed water competition."
            avoid_ta = "அதிகப்படியான நீர் விரயம் செய்வதை."
        elif top_h[1] == "MODERATE" and top_h[0] == "rain":
            action_en = "Strengthen bunds to harvest upcoming rain."
            action_ta = "மழைநீரை சேமிக்க வயல் வரப்புகளை பலப்படுத்தவும்."
            avoid_en = "Heavy fertilizer top-dressing before rain."
            avoid_ta = "மழைக்கு முன் அதிக உரம் இடுவதை."
        else:
            action_en = f"Check {crop} leaf color and soil moisture depth."
            action_ta = f"{crop} பயிர் பசுமையையும் ஈரப்பதத்தையும் சரிபார்க்கவும்."
            if spray == "UNSAFE":
                avoid_en = "Foliar spraying due to wind or rain conditions."
                avoid_ta = "வானிலை சரியில்லாததால் இலைவழி தெளிப்பை."
            else:
                avoid_en = "Water stagnation and excessive fertilizer use."
                avoid_ta = "வயலில் நீர் தேங்குவதையும் அதிக உரத்தையும்."

        crop_disp = crop.capitalize()
        brief_en = (
            f"[{district} {crop_disp} Brief]\n"
            f"⚠️ Top Risk: {top_risk_en}\n"
            f"✅ Today: {action_en}\n"
            f"❌ Avoid: {avoid_en}\n"
            f"Official IMD warnings take priority."
        )
        if len(brief_en) > 300:
            brief_en = brief_en[:297] + "..."

        brief_ta = (
            f"[{district} {crop_disp} சுருக்கம்]\n"
            f"⚠️ இடர்: {top_risk_ta}\n"
            f"✅ இன்று: {action_ta}\n"
            f"❌ தவிர்க்க: {avoid_ta}\n"
            f"IMD எச்சரிக்கைக்கு முன்னுரிமை."
        )
        if len(brief_ta) > 300:
            brief_ta = brief_ta[:297] + "..."

        return {
            "top_risk": top_risk_en,
            "top_risk_ta": top_risk_ta,
            "action_today_en": action_en,
            "action_today_ta": action_ta,
            "avoid_today_en": avoid_en,
            "avoid_today_ta": avoid_ta,
            "brief_en": brief_en,
            "brief_ta": brief_ta,
            "char_count_en": len(brief_en),
            "char_count_ta": len(brief_ta)
        }

    @staticmethod
    def _build_proactive_checklist(
        crop: str,
        stage: str,
        heat_risk: RiskLevel,
        rain_risk: RiskLevel,
        wind_risk: RiskLevel,
        drought_risk: RiskLevel
    ) -> Dict[str, List[Dict[str, str]]]:
        """
        Builds proactive actions grouped by next 6h / 24h / 48h.
        Tailored to crop, stage, and computed hazard levels.
        """
        next_6h = []
        next_24h = []
        next_48h = []

        # Heavy Rain Actions
        if rain_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            next_6h.append({
                "action": "Immediate field trenching: Clear all main drainage channels and field bund outlets.",
                "action_ta": "உடனடி வடிகால் மேலாண்மை: வயல் வரப்பு வடிகால்களை தூர்வாரி தேங்குநீரை வடிக்க வழியமைக்கவும்."
            })
            next_24h.append({
                "action": "Postpone all fertilizer top-dressing and irrigation until rainfall subsides.",
                "action_ta": "மழை குறையும் வரை மேல்உரம் இடுவதையும் பாசனம் செய்வதையும் முற்றிலும் தவிர்க்கவும்."
            })
            next_48h.append({
                "action": "Inspect nursery and root zones for waterlogging; pump out stagnant water.",
                "action_ta": "நாற்றங்கால் மற்றும் வேர் பகுதிகளில் நீர் தேங்காமல் உடனுக்குடன் வெளியேற்றவும்."
            })
        elif rain_risk == RiskLevel.MODERATE:
            next_6h.append({
                "action": "Check bund integrity to harvest anticipated rainwater efficiently.",
                "action_ta": "எதிர்பார்க்கப்படும் மழைநீரை சேமிக்க வயல் வரப்புகளை பலப்படுத்தவும்."
            })
            next_24h.append({
                "action": "Withhold scheduled irrigation to utilize rainwater.",
                "action_ta": "மழை வாய்ப்புள்ளதால் திட்டமிட்ட பாசனத்தை தற்காலிகமாக தள்ளிவைக்கவும்."
            })

        # Wind / Cyclone Actions (crucial for banana / sugarcane)
        if wind_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            if crop == "banana":
                next_6h.append({
                    "action": "Urgent banana staking: Provide bamboo or casuarina propping support to prevent toppling.",
                    "action_ta": "அவசர வாழை முட்டு: பலத்த காற்றினால் மரம் சாயாமல் இருக்க சவுக்கு அல்லது மூங்கில் முட்டுக் கொடுக்கவும்."
                })
            elif crop == "sugarcane":
                next_6h.append({
                    "action": "Trash-twisting in sugarcane: Tie adjacent cane clumps together to prevent lodging.",
                    "action_ta": "கரும்பு சோகை கட்டுதல்: கரும்புகள் காற்றில் சாயாமல் இருக்க அடுத்தடுத்த தூர்களை சேர்த்து கட்டவும்."
                })
            else:
                next_6h.append({
                    "action": "Secure farm equipment and shade netting against strong gusts.",
                    "action_ta": "பண்ணை உபகரணங்கள் மற்றும் நிழல்வலைகளை காற்றுக்கு சேதமடையாமல் பாதுகாக்கவும்."
                })
        elif wind_risk == RiskLevel.MODERATE and crop == "banana":
            next_24h.append({
                "action": "Inspect bunch-bearing banana trees and check support ties.",
                "action_ta": "தார் தாங்கிய வாழை மரங்களின் முட்டு கம்புகளை சரிபார்த்து உறுதியாக கட்டவும்."
            })

        # Heat Actions
        if heat_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            next_6h.append({
                "action": "Schedule light evening irrigation to reduce soil canopy temperature.",
                "action_ta": "மண் மற்றும் பயிர் சூட்டை தணிக்க மாலை நேரங்களில் மிதமான பாசனம் செய்யவும்."
            })
            next_24h.append({
                "action": "Apply straw or crop residue mulch around root zone to conserve soil moisture.",
                "action_ta": "ஈரப்பதத்தை காக்க பயிர் வேர்ப்பகுதியில் வைக்கோல் அல்லது காய்ந்த சருகுகளால் மூடாக்கு இடவும்."
            })
            next_48h.append({
                "action": "Monitor crop canopy for wilting symptoms during peak noon hours.",
                "action_ta": "நண்பகல் வேளையில் பயிர்கள் வாடுகிறதா என்பதை கள ஆய்வு செய்து கண்காணிக்கவும்."
            })

        # Drought Actions
        if drought_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            next_24h.append({
                "action": "Adopt alternate furrow irrigation or drip scheduling to optimize scarce water.",
                "action_ta": "தண்ணீர் பற்றாக்குறையை சமாளிக்க மாற்று வரிசை பாசனம் அல்லது சொட்டுநீர் பாசனத்தை கையாளவும்."
            })
            next_48h.append({
                "action": "Remove field weeds immediately to minimize water competition.",
                "action_ta": "பயிர் நீர்த் தேவையை பாதுகாக்க வயலில் உள்ள களைகளை உடனடியாக அகற்றவும்."
            })

        # Default normal farming practices if low risk
        if not next_6h:
            next_6h.append({
                "action": "Routine morning field scouting: Inspect crop leaf color and soil moisture depth.",
                "action_ta": "காலை நேர கள ஆய்வு: பயிர் இலைகளின் பசுமை மற்றும் மண் ஈரப்பதத்தை சரிபார்க்கவும்."
            })
        if not next_24h:
            next_24h.append({
                "action": "Carry out planned weeding or shallow intercultivation during dry weather.",
                "action_ta": "சாதகமான வறண்ட வானிலையை பயன்படுத்தி களையெடுப்பு மற்றும் உழவு பணிகளை மேற்கொள்ளவும்."
            })
        if not next_48h:
            next_48h.append({
                "action": "Check upcoming 7-day rainfall outlook before scheduling major fertilizer application.",
                "action_ta": "அடுத்த கட்ட உர மேலாண்மைக்கு முன் 7 நாள் வானிலை முன்னறிவிப்பை கவனிக்கவும்."
            })

        return {
            "next_6h": next_6h,
            "next_24h": next_24h,
            "next_48h": next_48h
        }

    @staticmethod
    def load_public_safety_advice() -> Dict[str, Any]:
        """Loads weather-based public safety advice from backend/data/public_safety_advice.json."""
        path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/public_safety_advice.json"))
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    @staticmethod
    def load_help_places(district: str = "Madurai") -> List[Dict[str, Any]]:
        """Loads nearby help places from backend/data/help_places.json."""
        path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/help_places.json"))
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("places", [])
        return []

    @staticmethod
    def build_public_safety_checklist(
        heat_risk: RiskLevel,
        rain_risk: RiskLevel,
        wind_risk: RiskLevel,
        drought_risk: RiskLevel,
        groups: Optional[List[str]] = None
    ) -> Dict[str, List[Dict[str, str]]]:
        """
        Builds personalized weather-based public safety actions for next 6h / 24h / 48h
        filtered by user groups (elderly, children, outdoor_worker, everyone).
        Strictly no medical dosages or diagnoses.
        """
        if not groups:
            groups = ["everyone"]
        normalized_groups = set(g.lower().replace(" ", "_") for g in groups)
        is_all = "everyone" in normalized_groups

        advice_db = RiskEngine.load_public_safety_advice()
        next_6h = []
        next_24h = []
        next_48h = []

        active_hazards = []
        if rain_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            active_hazards.append("rain")
        if wind_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            active_hazards.append("wind")
        if heat_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            active_hazards.append("heat")
        if not active_hazards:
            if rain_risk == RiskLevel.MODERATE:
                active_hazards.append("rain")
            if wind_risk == RiskLevel.MODERATE:
                active_hazards.append("wind")
            if heat_risk == RiskLevel.MODERATE:
                active_hazards.append("heat")
        if not active_hazards:
            active_hazards = ["heat", "rain"]

        for hazard in active_hazards:
            hazard_data = advice_db.get(hazard, {})
            for timeframe, target_list in [("next_6h", next_6h), ("next_24h", next_24h), ("next_48h", next_48h)]:
                actions = hazard_data.get(timeframe, [])
                for item in actions:
                    grp = item.get("group", "everyone").lower()
                    if is_all or grp in normalized_groups or grp == "everyone":
                        if not any(x["action"] == item["action_en"] for x in target_list):
                            target_list.append({
                                "action": item["action_en"],
                                "action_ta": item["action_ta"],
                                "group": grp,
                                "hazard": hazard
                            })

        if not next_6h:
            next_6h.append({
                "action": "Check official IMD local weather updates and keep family drinking water ready.",
                "action_ta": "அதிகாரப்பூர்வ IMD வானிலை அறிவிப்புகளை கவனித்து, பாதுகாப்பான குடிநீரை தயாராக வைக்கவும்.",
                "group": "everyone",
                "hazard": "general"
            })
        if not next_24h:
            next_24h.append({
                "action": "Inspect residential drainage around the house and recharge essential mobile devices.",
                "action_ta": "வீட்டைச் சுற்றியுள்ள வடிகால்களை சரிபார்த்து, செல்போன்களை முழுமையாக சார்ஜ் செய்யவும்.",
                "group": "everyone",
                "hazard": "general"
            })
        if not next_48h:
            next_48h.append({
                "action": "Keep emergency numbers (112, 1077) accessible on quick dial.",
                "action_ta": "அவசர உதவி எண்களை (112, 1077) கைவசம் வைத்திருக்கவும்.",
                "group": "everyone",
                "hazard": "general"
            })

        return {
            "next_6h": next_6h,
            "next_24h": next_24h,
            "next_48h": next_48h
        }

    @staticmethod
    def generate_public_safety_brief(
        risk_data: Dict[str, Any],
        district: str = "Madurai",
        groups: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Produces a concise public safety brief (strictly max 300 characters) in English and Tamil,
        covering the top public risk, one key action today, and one thing to avoid.
        """
        if not groups:
            groups = ["everyone"]

        severity_rank = {"CRITICAL": 4, "HIGH": 3, "MODERATE": 2, "LOW": 1}
        hazards = [
            ("rain", risk_data.get("rain_risk", "LOW"), "Heavy Rain & Waterlogging", "கனமழை மற்றும் வெள்ள அபாயம்"),
            ("wind", risk_data.get("wind_risk", "LOW"), "Strong Wind Gusts", "பலத்த காற்று மற்றும் சூறாவளி"),
            ("heat", risk_data.get("heat_risk", "LOW"), "Elevated Heat Stress", "அதிக வெப்ப அலை"),
            ("drought", risk_data.get("drought_risk", "LOW"), "Dry Weather", "வறண்ட வானிலை")
        ]
        sorted_hazards = sorted(hazards, key=lambda h: severity_rank.get(h[1], 1), reverse=True)
        top_h = sorted_hazards[0]
        top_h_level = top_h[1]
        top_risk_en = f"{top_h[2]} ({top_h_level})"
        top_risk_ta = f"{top_h[3]} ({top_h_level})"

        if top_h[0] == "rain" and top_h_level in ("HIGH", "CRITICAL", "MODERATE"):
            action_en = "Avoid flooded subways; keep mobiles charged."
            action_ta = "நீர் தேங்கிய தரைப்பாலங்களை தவிர்க்கவும்; போன்களை சார்ஜ் செய்யவும்."
            avoid_en = "Wading in floodwater or touching electric poles."
            avoid_ta = "தேங்கிய மழைநீரில் இறங்குவது, மின்கம்பங்களை தொடுவது."
        elif top_h[0] == "wind" and top_h_level in ("HIGH", "CRITICAL", "MODERATE"):
            action_en = "Stay inside sturdy rooms; latch windows tight."
            action_ta = "பாதுகாப்பான அறையில் இருக்கவும்; ஜன்னல்களை பூட்டவும்."
            avoid_en = "Standing under aged trees or loose tin roofs."
            avoid_ta = "மரங்கள் மற்றும் தகர கூரைகள் கீழ் நிற்பதை."
        elif top_h[0] == "heat" and top_h_level in ("HIGH", "CRITICAL", "MODERATE"):
            action_en = "Drink plenty of water; stay in shaded areas."
            action_ta = "அடிக்கடி தண்ணீர் குடிக்கவும்; நிழலில் இருக்கவும்."
            avoid_en = "Direct noon sun exposure (11am to 3:30pm)."
            avoid_ta = "நண்பகல் வெயிலில் (11 - 3:30) வெளியே செல்வதை."
        else:
            action_en = "Stay hydrated and follow local weather news."
            action_ta = "போதுமான குடிநீர் அருந்தவும்; வானிலை செய்திகளை கவனிக்கவும்."
            avoid_en = "Unprepared outdoor travel during sudden rains."
            avoid_ta = "திடீர் மழை நேரத்தில் முன்னேற்பாடின்றி வெளியே செல்வதை."

        brief_en = (
            f"[{district} Safety Brief]\n"
            f"⚠️ Top Risk: {top_risk_en}\n"
            f"✅ Today: {action_en}\n"
            f"❌ Avoid: {avoid_en}\n"
            f"Official IMD warnings take priority."
        )
        if len(brief_en) > 300:
            brief_en = brief_en[:297] + "..."

        brief_ta = (
            f"[{district} பாதுகாப்பு சுருக்கம்]\n"
            f"⚠️ இடர்: {top_risk_ta}\n"
            f"✅ இன்று: {action_ta}\n"
            f"❌ தவிர்க்க: {avoid_ta}\n"
            f"IMD எச்சரிக்கைக்கு முன்னுரிமை."
        )
        if len(brief_ta) > 300:
            brief_ta = brief_ta[:297] + "..."

        return {
            "top_risk": top_risk_en,
            "top_risk_ta": top_risk_ta,
            "action_today_en": action_en,
            "action_today_ta": action_ta,
            "avoid_today_en": avoid_en,
            "avoid_today_ta": avoid_ta,
            "brief_en": brief_en,
            "brief_ta": brief_ta,
            "char_count_en": len(brief_en),
            "char_count_ta": len(brief_ta)
        }
