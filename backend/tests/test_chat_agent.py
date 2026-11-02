"""
Test script for verifying /api/chat endpoint and Strands agent trace.
"""

import httpx
import json

CHAT_URL = "http://127.0.0.1:8000/api/chat"


def test_chat():
    payload = {
        "query": "Is it safe to spray foliar nutrients on paddy in Madurai today?",
        "district": "Madurai",
        "crop": "paddy",
        "growth_stage": "vegetative",
        "session_id": "test_session_1"
    }

    with httpx.Client(timeout=15.0) as client:
        resp = client.post(CHAT_URL, json=payload)
        assert resp.status_code == 200, f"Error {resp.status_code}: {resp.text}"
        data = resp.json()

        print("[OK] /api/chat returned status 200")
        print("\n=== Agent Response ===")
        safe_response = data["response"].encode("ascii", errors="replace").decode("ascii")
        print(safe_response)

        print("\n=== Agent Execution Trace ===")
        trace = data["trace"]
        print(f"Orchestrator: {trace['orchestrator']}")
        print(f"Mode: {trace['mode']}")
        print(f"Farmer Profile: {trace['farmer_profile']}")
        print("\nTool Calls Executed:")
        for tool in trace["tool_calls"]:
            print(f"  - @{tool['name']} [{tool['status']}] ({tool['duration_ms']}ms)")
            print(f"    args: {tool['args']}")

        assert len(trace["tool_calls"]) >= 3, "Expected at least 3 tool calls in trace"
        assert trace["structured_output"] is not None, "Expected Pydantic structured output"
        print(f"\n[OK] Pydantic Structured Output Validated: {trace['structured_output']['composite_risk']}")
        print("\nALL STEP 3 STRANDS AGENTS + CHAT TESTS PASSED!")


if __name__ == "__main__":
    test_chat()
