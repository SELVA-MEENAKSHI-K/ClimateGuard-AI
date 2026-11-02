import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Explicitly load backend/.env
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH, override=True)
else:
    load_dotenv(override=True)


class Settings(BaseModel):
    app_name: str = "ClimateGuard AI"
    environment: str = os.getenv("ENVIRONMENT", "development")
    mock_mode: bool = os.getenv("MOCK_MODE", "false").lower() in ("true", "1", "yes")
    port: int = int(os.getenv("PORT", 8000))
    aws_region: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    default_district: str = "Madurai"
    model_provider: str = os.getenv("MODEL_PROVIDER", "google").lower()
    google_api_key: str = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    gemini_model_id: str = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash")


settings = Settings()
