"""
backend/services/weather_service.py

Async weather service client for Open-Meteo APIs (free, no API key required).
Provides live forecasts and historical climate archive data.
"""

import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


class WeatherService:
    MODELS = ["ecmwf_ifs025", "gfs_seamless", "icon_seamless"]

    @staticmethod
    async def get_forecast(latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetches current weather, 7-day daily forecast, 48h hourly outlook,
        and multi-model forecasts (ECMWF, GFS, ICON) from Open-Meteo API.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration",
            "models": f"best_match,{','.join(WeatherService.MODELS)}",
            "timezone": "Asia/Kolkata"
        }

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(OPEN_METEO_FORECAST_URL, params=params)
                resp.raise_for_status()
                data = resp.json()

                # Open-Meteo appends _{model} when multi-models are requested.
                # Map _best_match back to standard non-prefixed keys for compatibility.
                for section in ("daily", "hourly"):
                    if section in data and isinstance(data[section], dict):
                        for k, v in list(data[section].items()):
                            if k.endswith("_best_match"):
                                norm_key = k[:-11]
                                data[section][norm_key] = v

                data["models_used"] = WeatherService.MODELS
                return data
        except Exception as e:
            # Fallback realistic weather data with multi-model spread in case of temporary offline state
            now = datetime.now()
            days = [(now + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
            return {
                "latitude": latitude,
                "longitude": longitude,
                "timezone": "Asia/Kolkata",
                "models_used": WeatherService.MODELS,
                "current": {
                    "time": now.isoformat(),
                    "temperature_2m": 31.5,
                    "relative_humidity_2m": 75,
                    "apparent_temperature": 35.0,
                    "precipitation": 0.0,
                    "wind_speed_10m": 12.0
                },
                "daily": {
                    "time": days,
                    "temperature_2m_max": [33.0, 32.5, 33.2, 31.8, 30.5, 31.2, 32.0],
                    "temperature_2m_max_ecmwf_ifs025": [32.8, 32.3, 33.0, 31.5, 30.2, 31.0, 31.8],
                    "temperature_2m_max_gfs_seamless": [33.2, 32.7, 33.5, 32.0, 30.8, 31.5, 32.2],
                    "temperature_2m_max_icon_seamless": [33.0, 32.5, 33.1, 31.9, 30.5, 31.2, 32.0],
                    "temperature_2m_min": [24.0, 23.8, 24.1, 23.5, 23.0, 23.2, 23.8],
                    "precipitation_sum": [1.0, 2.5, 0.2, 8.4, 15.0, 3.2, 0.5],
                    "precipitation_sum_ecmwf_ifs025": [0.8, 2.2, 0.0, 8.0, 14.5, 3.0, 0.4],
                    "precipitation_sum_gfs_seamless": [1.2, 2.8, 0.5, 9.0, 16.0, 3.5, 0.8],
                    "precipitation_sum_icon_seamless": [1.0, 2.5, 0.2, 8.2, 14.8, 3.1, 0.5],
                    "precipitation_probability_max": [25, 40, 20, 65, 80, 45, 20],
                    "wind_speed_10m_max": [14.0, 12.5, 11.0, 18.0, 20.0, 13.0, 11.5],
                    "wind_speed_10m_max_ecmwf_ifs025": [13.5, 12.0, 10.5, 17.5, 19.5, 12.5, 11.0],
                    "wind_speed_10m_max_gfs_seamless": [14.5, 13.0, 11.5, 18.5, 20.5, 13.5, 12.0],
                    "wind_speed_10m_max_icon_seamless": [14.0, 12.5, 11.0, 18.0, 20.0, 13.0, 11.5],
                    "et0_fao_evapotranspiration": [4.2, 4.0, 4.3, 3.8, 3.5, 3.9, 4.1]
                },
                "hourly": {
                    "time": [(now + timedelta(hours=i)).isoformat() for i in range(24)],
                    "temperature_2m": [30.0 + (i % 4) for i in range(24)],
                    "relative_humidity_2m": [70 + (i % 15) for i in range(24)],
                    "precipitation_probability": [20 + (i * 2 % 50) for i in range(24)],
                    "wind_speed_10m": [10.0 + (i % 6) for i in range(24)]
                },
                "_fallback": True,
                "_error": str(e)
            }

    @staticmethod
    def get_forecast_sync(latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Synchronous weather fetcher for Strands tools to avoid nested loop deadlocks.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration",
            "timezone": "Asia/Kolkata"
        }
        try:
            resp = httpx.get(OPEN_METEO_FORECAST_URL, params=params, timeout=2.0)
            resp.raise_for_status()
            data = resp.json()
            data["models_used"] = WeatherService.MODELS
            return data
        except Exception as e:
            now = datetime.now()
            days = [(now + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
            return {
                "latitude": latitude,
                "longitude": longitude,
                "timezone": "Asia/Kolkata",
                "models_used": WeatherService.MODELS,
                "current": {
                    "time": now.isoformat(),
                    "temperature_2m": 31.5,
                    "relative_humidity_2m": 75,
                    "apparent_temperature": 35.0,
                    "precipitation": 0.0,
                    "wind_speed_10m": 12.0
                },
                "daily": {
                    "time": days,
                    "temperature_2m_max": [33.0, 32.5, 33.2, 31.8, 30.5, 31.2, 32.0],
                    "temperature_2m_min": [24.0, 23.8, 24.1, 23.5, 23.0, 23.2, 23.8],
                    "precipitation_sum": [1.0, 2.5, 0.2, 8.4, 15.0, 3.2, 0.5],
                    "precipitation_probability_max": [25, 40, 20, 65, 80, 45, 20],
                    "wind_speed_10m_max": [14.0, 12.5, 11.0, 18.0, 20.0, 13.0, 11.5],
                    "et0_fao_evapotranspiration": [4.2, 4.0, 4.3, 3.8, 3.5, 3.9, 4.1]
                },
                "_fallback": True,
                "_error": str(e)
            }

    @staticmethod
    async def get_historical_archive(
        latitude: float,
        longitude: float,
        start_date: str = "2024-10-24",
        end_date: str = "2024-10-28"
    ) -> Dict[str, Any]:
        """
        Fetches ground-truth historical climate observations from Open-Meteo Archive.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
            "timezone": "Asia/Kolkata"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(OPEN_METEO_ARCHIVE_URL, params=params)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            return {
                "latitude": latitude,
                "longitude": longitude,
                "daily": {
                    "time": ["2024-10-24", "2024-10-25", "2024-10-26", "2024-10-27", "2024-10-28"],
                    "temperature_2m_max": [32.1, 29.5, 27.2, 28.6, 31.0],
                    "temperature_2m_min": [24.0, 23.2, 22.1, 22.8, 23.5],
                    "precipitation_sum": [2.4, 18.2, 118.4, 26.5, 4.1],
                    "wind_speed_10m_max": [12.6, 22.4, 42.1, 18.0, 14.2]
                },
                "_fallback": True,
                "_error": str(e)
            }
