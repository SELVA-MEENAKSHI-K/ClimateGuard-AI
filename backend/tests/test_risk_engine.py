"""
Unit test suite verifying deterministic risk engine and Open-Meteo weather integration.
"""

import sys
import os
import asyncio

# Ensure workspace root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.config.thresholds import (
    RiskLevel,
    calculate_rain_risk,
    calculate_heat_risk,
    calculate_drought_risk,
    calculate_wind_risk,
    evaluate_spray_window,
    calculate_composite_risk
)
from backend.services.risk_engine import RiskEngine
from backend.services.weather_service import WeatherService
from backend.data.locations import get_district_info


def test_deterministic_rain_thresholds():
    print("Testing IMD Rain thresholds...")
    lvl, _ = calculate_rain_risk(5.0)
    assert lvl == RiskLevel.LOW, f"Expected LOW for 5mm, got {lvl}"

    lvl, _ = calculate_rain_risk(35.0)
    assert lvl == RiskLevel.MODERATE, f"Expected MODERATE for 35mm, got {lvl}"

    lvl, _ = calculate_rain_risk(75.0)
    assert lvl == RiskLevel.HIGH, f"Expected HIGH for 75mm (IMD Heavy), got {lvl}"

    lvl, _ = calculate_rain_risk(150.0)
    assert lvl == RiskLevel.CRITICAL, f"Expected CRITICAL for 150mm (IMD Very Heavy), got {lvl}"
    print("[OK] IMD Rain thresholds verified successfully.")


def test_deterministic_heat_thresholds():
    print("Testing Heat heuristics...")
    lvl, _ = calculate_heat_risk(33.0, 35.0)
    assert lvl == RiskLevel.LOW, f"Expected LOW for 33C, got {lvl}"

    lvl, _ = calculate_heat_risk(38.0, 41.0)
    assert lvl == RiskLevel.MODERATE, f"Expected MODERATE for 38C, got {lvl}"

    lvl, _ = calculate_heat_risk(40.5, 43.5)
    assert lvl == RiskLevel.HIGH, f"Expected HIGH for 40.5C, got {lvl}"

    lvl, _ = calculate_heat_risk(43.0, 47.0)
    assert lvl == RiskLevel.CRITICAL, f"Expected CRITICAL for 43C, got {lvl}"
    print("[OK] Heat heuristics verified successfully.")


def test_deterministic_drought_thresholds():
    print("Testing Drought heuristics...")
    lvl, _ = calculate_drought_risk(cumulative_7d_rain=25.0, avg_7d_et0=3.5, consecutive_dry_days=2)
    assert lvl == RiskLevel.LOW

    lvl, _ = calculate_drought_risk(cumulative_7d_rain=1.0, avg_7d_et0=4.8, consecutive_dry_days=9)
    assert lvl == RiskLevel.HIGH
    print("[OK] Drought heuristics verified successfully.")


def test_deterministic_wind_thresholds():
    print("Testing Wind thresholds...")
    lvl, _ = calculate_wind_risk(12.0)
    assert lvl == RiskLevel.LOW

    lvl, _ = calculate_wind_risk(28.0)
    assert lvl == RiskLevel.MODERATE

    lvl, _ = calculate_wind_risk(45.0)
    assert lvl == RiskLevel.HIGH

    lvl, _ = calculate_wind_risk(62.0)
    assert lvl == RiskLevel.CRITICAL
    print("[OK] Wind thresholds verified successfully.")


def test_spray_window_weather_rules():
    print("Testing weather-based spray windows (no chemicals)...")
    res = evaluate_spray_window(current_wind_speed=10.0, rain_probability=20.0, rain_sum=0.0)
    assert res["status"] == "SAFE"

    res = evaluate_spray_window(current_wind_speed=20.0, rain_probability=40.0, rain_sum=0.5)
    assert res["status"] == "CAUTION"

    res = evaluate_spray_window(current_wind_speed=28.0, rain_probability=75.0, rain_sum=10.0)
    assert res["status"] == "UNSAFE"
    print("[OK] Spray windows verified successfully.")


async def test_live_weather_and_risk():
    print("Testing Live Open-Meteo API for Madurai...")
    dist = get_district_info("Madurai")
    weather = await WeatherService.get_forecast(dist["latitude"], dist["longitude"])
    assert "current" in weather
    assert "daily" in weather

    assessment = RiskEngine.assess(weather, crop="paddy", growth_stage="vegetative")
    assert "composite_risk" in assessment
    assert "checklist" in assessment
    assert "next_6h" in assessment["checklist"]
    assert "next_24h" in assessment["checklist"]
    assert "next_48h" in assessment["checklist"]
    assert "spray_window" in assessment

    print(f"[OK] Live assessment for Madurai (paddy): Composite Risk = {assessment['composite_risk']}, Spray = {assessment['spray_window']['status']}")
    print(f"[OK] Next 6h actions count: {len(assessment['checklist']['next_6h'])}")

    # Verify Feature 1: Deterministic Confidence
    assert "confidence" in assessment, "Expected confidence in assessment"
    conf = assessment["confidence"]
    assert "heat" in conf and "rain" in conf and "wind" in conf and "drought" in conf and "composite" in conf
    assert conf["disagree_alert"] == "Models disagree, check official IMD alert"
    print(f"[OK] Confidence calculated: {conf}")

    # Verify Feature 2: Daily Farm Brief
    assert "farm_brief" in assessment, "Expected farm_brief in assessment"
    brief = assessment["farm_brief"]
    assert "brief_en" in brief and "brief_ta" in brief
    assert len(brief["brief_en"]) <= 300, f"brief_en exceeded 300 chars: {len(brief['brief_en'])}"
    assert len(brief["brief_ta"]) <= 300, f"brief_ta exceeded 300 chars: {len(brief['brief_ta'])}"
    assert "Top Risk:" in brief["brief_en"]
    assert "Today:" in brief["brief_en"]
    assert "Avoid:" in brief["brief_en"]
    print(f"[OK] Farm Brief validated (en {len(brief['brief_en'])} chars, ta {len(brief['brief_ta'])} chars):")
    print(brief["brief_en"].encode("ascii", errors="replace").decode("ascii"))


def test_confidence_disagreement_thresholds():
    print("Testing Confidence computation and model disagreement...")
    # Simulated daily data where models disagree on rainfall
    daily_disagree = {
        "temperature_2m_max_ecmwf_ifs025": [32.0],
        "temperature_2m_max_gfs_seamless": [37.5],  # 5.5 C spread -> LOW
        "temperature_2m_max_icon_seamless": [33.0],
        "precipitation_sum_ecmwf_ifs025": [2.0],
        "precipitation_sum_gfs_seamless": [35.0],   # 33 mm spread -> LOW
        "precipitation_sum_icon_seamless": [5.0],
        "wind_speed_10m_max_ecmwf_ifs025": [12.0],
        "wind_speed_10m_max_gfs_seamless": [14.0],
        "wind_speed_10m_max_icon_seamless": [13.0]
    }
    conf = RiskEngine.compute_confidence(daily_disagree)
    assert conf["heat"] == "LOW", f"Expected LOW for 5.5C spread, got {conf['heat']}"
    assert conf["rain"] == "LOW", f"Expected LOW for 33mm spread, got {conf['rain']}"
    assert conf["wind"] == "HIGH", f"Expected HIGH for 2km/h spread, got {conf['wind']}"
    assert conf["composite"] == "LOW", "Expected composite to be LOW when models disagree"
    assert conf["disagree_alert"] == "Models disagree, check official IMD alert"
    print("[OK] Confidence disagreement verified successfully.")


def main():
    test_deterministic_rain_thresholds()
    test_deterministic_heat_thresholds()
    test_deterministic_drought_thresholds()
    test_deterministic_wind_thresholds()
    test_confidence_disagreement_thresholds()
    test_spray_window_weather_rules()
    asyncio.run(test_live_weather_and_risk())
    print("\nALL STEP 2 BACKEND RISK ENGINE & WEATHER TESTS PASSED!")


if __name__ == "__main__":
    main()
