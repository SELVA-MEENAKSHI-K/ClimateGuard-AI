"""
backend/agent/models.py

Pydantic structured output models for ClimateGuard AI risk assessment and agent trace.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RiskAssessmentSchema(BaseModel):
    """
    Pydantic structured output schema for deterministic risk validation.
    The LLM outputs strictly against this schema.
    """
    district: str = Field(description="Selected Tamil Nadu district")
    crop: str = Field(description="Target agricultural crop")
    growth_stage: str = Field(description="Current crop growth stage")
    composite_risk: str = Field(description="Overall hazard rating (LOW, MODERATE, HIGH, CRITICAL)")
    heat_risk: str = Field(description="Heat hazard level")
    rain_risk: str = Field(description="Rainfall hazard level per IMD classes")
    drought_risk: str = Field(description="Drought / moisture deficit hazard level")
    wind_risk: str = Field(description="Wind / lodging hazard level")
    spray_status: str = Field(description="Weather-based spray window (SAFE, CAUTION, UNSAFE)")
    immediate_action_en: str = Field(description="Priority actionable recommendation in English")
    immediate_action_ta: str = Field(description="Priority actionable recommendation in Tamil")
    confidence: Dict[str, Any] = Field(default_factory=dict, description="Deterministic confidence score per hazard (heat, rain, drought, wind, composite)")
    farm_brief_en: Optional[str] = Field(None, description="Daily farm brief in English (max 300 chars)")
    farm_brief_ta: Optional[str] = Field(None, description="Daily farm brief in Tamil (max 300 chars)")


class ToolCallTrace(BaseModel):
    name: str
    status: str = "SUCCESS"
    duration_ms: int = 0
    args: Dict[str, Any] = Field(default_factory=dict)
    output: Any = None


class AgentTrace(BaseModel):
    orchestrator: str = "ClimateGuardOrchestrator"
    provider: str = "gemini"  # "gemini" | "mock" | "bedrock"
    mode: str = "strands_gemini"  # "strands_gemini" | "mock_mode" | "mock_fallback"
    is_mock: bool = False
    reason: Optional[str] = None
    error: Optional[str] = None
    farmer_profile: Dict[str, str] = Field(default_factory=dict)
    tool_calls: List[ToolCallTrace] = Field(default_factory=list)
    structured_output: Optional[RiskAssessmentSchema] = None
