"""
backend/agentcore_main.py

Amazon Bedrock AgentCore runtime entrypoint for ClimateGuard AI.
Renamed to main.py upon deployment on Bedrock AgentCore.
Runs a Starlette ASGI microservice at port 8080.
Endpoints:
  - POST /invocations
  - GET  /ping
  - WS   /ws

Default model provider: Bedrock (region: us-east-1).
"""
import os
import sys
from pathlib import Path

# Enforce Bedrock provider and default AWS region for AgentCore
os.environ.setdefault("MODEL_PROVIDER", "bedrock")
os.environ.setdefault("AWS_REGION", "us-east-1")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

# Ensure backend and parent directories are in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PARENT_DIR = CURRENT_DIR.parent
for p in (str(CURRENT_DIR), str(PARENT_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from bedrock_agentcore.runtime import BedrockAgentCoreApp

try:
    from backend.agent.orchestrator import orchestrator
    from backend.agent.tools import has_tamil
except (ModuleNotFoundError, ImportError):
    from agent.orchestrator import orchestrator
    from agent.tools import has_tamil

app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload, context=None):
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a JSON object")

    prompt = payload.get("prompt")
    if not prompt:
        raise ValueError("Missing required field: prompt")

    profile = {
        "district": payload.get("district", "Madurai"),
        "crop": payload.get("crop", "paddy"),
        "growth_stage": payload.get("growth_stage", "vegetative"),
        "user_type": payload.get("user_type", "farmer"),
    }

    # language: payload.get("language") or detect Tamil script
    language = payload.get("language")
    if not language:
        language = "ta" if has_tamil(prompt) else "en"

    # Call the same run() used by /api/chat, with MODEL_PROVIDER=bedrock
    response_text, trace, is_live_call = orchestrator.run(
        query=prompt,
        session_id=payload.get("session_id", "agentcore_session"),
        district=profile["district"],
        crop=profile["crop"],
        growth_stage=profile["growth_stage"],
        language=language,
    )

    risk = "LOW"
    if trace and trace.structured_output:
        risk = getattr(trace.structured_output, "composite_risk", "LOW")

    tool_trace = []
    if trace and trace.tool_calls:
        for t in trace.tool_calls:
            if hasattr(t, "model_dump"):
                tool_trace.append(t.model_dump())
            elif hasattr(t, "dict"):
                tool_trace.append(t.dict())
            elif isinstance(t, dict):
                tool_trace.append(t)

    return {
        "response": response_text,
        "risk": risk,
        "language": language,
        "tool_trace": tool_trace,
        "provider": "bedrock-agentcore",
    }


if __name__ == "__main__":
    app.run()
