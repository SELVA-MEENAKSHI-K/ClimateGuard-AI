"""
backend/scripts/invoke_agentcore.py

Invokes the deployed Amazon Bedrock AgentCore runtime for ClimateGuard AI.
Uses boto3 bedrock-agentcore client to send payloads to the deployed runtime.

Usage:
    export AGENTCORE_ARN="arn:aws:bedrock-agentcore:us-east-1:123456789012:agent-runtime/..."
    python invoke_agentcore.py "Will it rain tomorrow in Madurai?"
    python invoke_agentcore.py "நாளைக்கு மழை வருமா?" --district Thanjavur
"""
import argparse
import json
import os
import sys
import uuid
import boto3


def main():
    parser = argparse.ArgumentParser(
        description="Invoke deployed ClimateGuard AI Bedrock AgentCore runtime"
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        default="Will it rain tomorrow in Madurai?",
        help="Farmer prompt in Tamil or English (default: 'Will it rain tomorrow in Madurai?')",
    )
    parser.add_argument("--district", default="Madurai", help="Tamil Nadu district name (default: Madurai)")
    parser.add_argument("--crop", default="paddy", help="Crop type (default: paddy)")
    parser.add_argument("--growth-stage", default="vegetative", help="Crop growth stage (default: vegetative)")
    parser.add_argument("--user-type", default="farmer", help="User role (default: farmer)")
    parser.add_argument("--arn", default=None, help="AgentCore ARN (overrides AGENTCORE_ARN env var)")
    parser.add_argument("--region", default=None, help="AWS Region (default: us-east-1)")

    args = parser.parse_args()

    arn = args.arn or os.environ.get("AGENTCORE_ARN")
    if not arn:
        print("Error: Missing AGENTCORE_ARN environment variable or --arn argument.", file=sys.stderr)
        print("Set it before running: export AGENTCORE_ARN='arn:aws:bedrock-agentcore:...'", file=sys.stderr)
        sys.exit(1)

    region = args.region or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    session_id = str(uuid.uuid4())

    client = boto3.client("bedrock-agentcore", region_name=region)

    payload = {
        "prompt": args.prompt,
        "district": args.district,
        "crop": args.crop,
        "growth_stage": args.growth_stage,
        "user_type": args.user_type,
    }

    print("=" * 60)
    print("Bedrock AgentCore Invocation Request")
    print("=" * 60)
    print(f"ARN:        {arn}")
    print(f"Region:     {region}")
    print(f"Session ID: {session_id}")
    print(f"Qualifier:  DEFAULT")
    print(f"Payload:    {json.dumps(payload, ensure_ascii=False)}")
    print("=" * 60)

    try:
        response = client.invoke_agent_runtime(
            agentRuntimeArn=arn,
            runtimeSessionId=session_id,
            qualifier="DEFAULT",
            contentType="application/json",
            accept="application/json",
            payload=json.dumps(payload).encode("utf-8"),
        )

        body = response.get("response")
        if hasattr(body, "read"):
            raw_text = body.read().decode("utf-8")
        elif isinstance(body, (bytes, bytearray)):
            raw_text = body.decode("utf-8")
        elif isinstance(body, str):
            raw_text = body
        else:
            raw_text = json.dumps(body)

        try:
            parsed = json.loads(raw_text)
            print("\nResponse (JSON):")
            print(json.dumps(parsed, indent=2, ensure_ascii=False))
            if isinstance(parsed, dict) and "response" in parsed:
                print("\nAgent Answer:")
                print(parsed["response"])
        except Exception:
            print("\nResponse:")
            print(raw_text)

    except Exception as e:
        print(f"Invocation failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
