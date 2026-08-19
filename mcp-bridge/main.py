import os
from fastmcp import FastMCP

mcp = FastMCP("go")

@mcp.tool()
def execute_cody_directive(directive: str) -> str:
    """Dispatches a directive directly to Cody (Claude Code CLI) on the workspace."""
    return f"Directive received for Cody: {directive}"

@mcp.tool()
def get_control_plane_status() -> str:
    """Returns the operational status of the universal control plane."""
    return "Universal Control Plane Active - Region: asia-southeast2 (Jakarta)"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting Universal FastMCP Bridge on port {port} (Streamable HTTP)...")
    mcp.run(transport="http", host="0.0.0.0", port=port)