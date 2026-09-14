"""
MCP Relay Bridge Daemon

Listens to the Cloud Run FastMCP SSE endpoint and automatically dispatches
directives to the local Cody/Claude Code workspace.

This enables Spark (Gemini Spark) to send directives that execute without
manual prompting in Claude Code.

Usage:
    python relay_daemon.py

Environment variables:
    MCP_BRIDGE_ENDPOINT - SSE endpoint URL (default: from project config)
    MCP_BRIDGE_POLL_INTERVAL - seconds between SSE reconnect attempts (default: 30)
    MCP_BRIDGE_WORKSPACE - path to Claude Code workspace (default: cwd)
"""

import os
import sys
import time
import signal
import json
import requests
from typing import Optional

# Add the project path to sys.path if needed
PROJECT_DIR = os.environ.get('MCP_BRIDGE_WORKSPACE', os.getcwd())
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from fastmcp import FastMCP

# Configuration
ENDPOINT_URL = os.environ.get(
    'MCP_BRIDGE_ENDPOINT',
    'https://hitec-mcp-bridge-139227119972.asia-southeast2.run.app/events'
)
POLL_INTERVAL = int(os.environ.get('MCP_BRIDGE_POLL_INTERVAL', '30'))
WORKSPACE_PATH = os.environ.get('MCP_BRIDGE_WORKSPACE', PROJECT_DIR)

print("Starting MCP Relay Bridge Daemon")
print("  Endpoint:", ENDPOINT_URL)
print("  Poll Interval:", POLL_INTERVAL, "s")
print("  Workspace:", WORKSPACE_PATH)
print("-" * 60)


# Initialize FastMCP client for local directive dispatch
mcp = FastMCP("relay-bridge")


@mcp.tool()
def execute_directive(directive: str) -> str:
    """Execute a received directive in the local workspace."""
    print("\nReceived directive:", directive)
    try:
        # Dispatch to Cody (Claude Code CLI) on the workspace
        result = mcp.run_tool(
            "execute_cody_directive",
            directive=directive
        )
        print("  Directive executed:", result)
        return result
    except Exception as e:
        print("  Directive failed:", e)
        return "Error: " + str(e)


@mcp.tool()
def get_status() -> str:
    """Get the operational status of the relay bridge."""
    return "Universal Control Plane Active - Region: asia-southeast2 (Jakarta)\n" \
           "  Endpoint: " + ENDPOINT_URL + "\n" \
           "  Poll Interval: " + str(POLL_INTERVAL) + "s\n" \
           "  Workspace: " + WORKSPACE_PATH + "\n" \
           "  Status: Running"


is_running = True


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    global is_running
    print("\nReceived shutdown signal. Stopping relay bridge...")
    is_running = False


def sse_connection_session():
    """Create an SSE session with the Cloud Run FastMCP endpoint."""
    global is_running
    headers = {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
    }

    while is_running:
        try:
            print("\nConnecting to SSE endpoint:", ENDPOINT_URL)
            response = requests.get(
                ENDPOINT_URL,
                headers=headers,
                stream=True,
                timeout=60
            )

            if response.status_code != 200:
                print("SSE connection failed with status:", response.status_code)
                time.sleep(POLL_INTERVAL)
                continue

            print("SSE connection established. Listening for events...")

            for line in response.iter_lines():
                if not is_running:
                    break

                if line:
                    decoded = line.decode('utf-8').strip()

                    # Parse SSE message format: data: <json>
                    if decoded.startswith('data:'):
                        json_data = decoded[5:].strip()
                        if json_data:
                            try:
                                event = json.loads(json_data)
                                handle_event(event)
                            except json.JSONDecodeError:
                                print("  Failed to parse event JSON:", json_data[:100])

                    # Handle message-type events
                    elif decoded.startswith('event:'):
                        event_type = decoded[6:].strip()
                        print("  Event type:", event_type)

                    # Handle idle/keep-alive
                    else:
                        print("  ", decoded)

            # If we exit the for loop naturally, the connection closed
            if is_running:
                print("SSE connection closed. Reconnecting...")
                time.sleep(POLL_INTERVAL)

        except requests.exceptions.RequestException as e:
            print("Network error:", e)
            time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("\nKeyboard interrupt received")
            is_running = False
        except Exception as e:
            print("Unexpected error:", e)
            time.sleep(POLL_INTERVAL)


def handle_event(event: dict):
    """Handle an incoming MCP event from Spark."""
    event_type = event.get('type', 'unknown')
    data = event.get('data', {})

    print("\nReceived MCP event:", event_type)

    # Extract directive from various possible fields
    directive = data.get('directive') or data.get('command') or data.get('action')

    if directive:
        execute_directive(directive)
    else:
        print("  No directive found in event data:", list(data.keys()))


if __name__ == '__main__':
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("=" * 60)
    print("MCP Relay Bridge Daemon starting...")
    print("=" * 60)

    try:
        sse_connection_session()
    finally:
        print("\nMCP Relay Bridge Daemon stopped.")
        sys.exit(0)