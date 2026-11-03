"""
backend/agent/plan.py

Pydantic structured output schemas for ClimateGuard AI.
Matches the structure expected by the strands-ship kit measure tool:
- Answer: language, risk (from deterministic code), answer, steps[], escalation, citations[]
- Critique: ok, problems[]
"""
from __future__ import annotations

from typing import Literal, List
from pydantic import BaseModel, Field


class Answer(BaseModel):
    language: Literal["en", "ta"] = Field(
        description="Language the user wrote in: 'en' for English, 'ta' for Tamil script"
    )
    risk: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(
        description="Deterministic climate risk level strictly verified from assess_risk tool"
    )
    answer: str = Field(
        description="The actionable answer in the user's language (Tamil script for 'ta', English for 'en')"
    )
    steps: list[str] = Field(
        default_factory=list,
        description="Concrete, practical next steps the farmer should take in their language"
    )
    escalation: str = Field(
        description="Emergency advice or official IMD priority escalation contact in the user's language"
    )
    citations: list[str] = Field(
        default_factory=list,
        description="Guidance IDs (e.g. G-TNAU-DRAIN-01) returned by crop_advice that support this plan"
    )


class Critique(BaseModel):
    ok: bool = Field(
        description="True only if the plan breaks none of the agronomic or safety rules"
    )
    problems: list[str] = Field(
        default_factory=list,
        description="Each rule or constraint the plan breaks, one concise line each"
    )
