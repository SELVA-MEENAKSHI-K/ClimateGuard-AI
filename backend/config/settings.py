import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

# Explicitly load backend/.env if present (local development fallback)
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH, override=True)
else:
    load_dotenv(override=True)


class Settings(BaseModel):
    app_name: str = "ClimateGuard AI"
    environment: str = os.getenv("ENVIRONMENT", "production" if os.getenv("RENDER") or os.getenv("VERCEL") else "development")
    mock_mode: bool = os.getenv("MOCK_MODE", "false").lower() in ("true", "1", "yes")
    port: int = int(os.getenv("PORT", 8000))
    aws_region: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    default_district: str = os.getenv("DEFAULT_DISTRICT", "Madurai")
    model_provider: str = os.getenv("MODEL_PROVIDER", "google").lower()
    google_api_key: str = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    gemini_model_id: str = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash")
    cors_origins_raw: str = os.getenv("CORS_ORIGINS", "*")

    @property
    def cors_origins(self) -> List[str]:
        raw = self.cors_origins_raw.strip()
        if not raw or raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


settings = Settings()
