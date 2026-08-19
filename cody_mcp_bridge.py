import subprocess
import os
import sys
import re
from fastmcp import FastMCP

# Initialize FastMCP Server for Spark Orchestration
mcp = FastMCP("Cody-AntiGravity-Bridge")

WORKSPACE_DIR = r"C:\Antigravity IDE\HitecApp\Safety"

# ══════════════════════════════════════════════════════════════════════
# BRIDGE SECURITY GATE (STOPGAP LAYER)
# Hard blocklist preventing autonomous deployments or remote git pushes
# ══════════════════════════════════════════════════════════════════════
RESTRICTED_PATTERNS = [
    r"\bgit\s+push\b",
    r"\bfirebase\s+deploy\b",
    r"\bdeploy\s+--only\b",
    r"\bgcloud\b.*\bdeploy\b",
    r"\bwrangler\b.*\bdeploy\b",
    r"\brm\s+-rf\b",
    r"\bdelete\b.*\bfirestore\b",
    r"\bdrop\b.*\btable\b"
]

def assert_security_gate(content: str, context_label: str = "Directive"):
    """Validates that incoming text contains zero prohibited deployment/destructive operations."""
    lowered = content.lower()
    for pattern in RESTRICTED_PATTERNS:
        if re.search(pattern, lowered):
            error_msg = (
                f"[BRIDGE SECURITY BLOCK]: {context_label} rejected. Matched restricted pattern '{pattern}'. "
                f"Deployments, remote pushes, and destructive operations are strictly prohibited "
                f"at the bridge level and require explicit human approval via the IDE terminal."
            )
            print(error_msg, file=sys.stderr)
            raise PermissionError(error_msg)

@mcp.tool()
def execute_cody_directive(directive: str) -> str:
    """Dispatches an autonomous directive directly to Cody (Claude Code CLI) in the workspace."""
    try:
        assert_security_gate(directive, context_label="Cody Directive")
        cmd = f'claude-zen -p "{directive}" --print --dangerously-skip-permissions'
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=WORKSPACE_DIR,
            capture_output=True,
            text=True,
            timeout=180
        )
        return result.stdout or result.stderr or "Task completed with no output."
    except PermissionError as pe:
        return str(pe)
    except Exception as e:
        return f"Error executing Cody directive: {str(e)}"

@mcp.tool()
def run_workspace_command(command: str) -> str:
    """Executes a terminal/build/test/git command directly in the HitecApp-Safety workspace."""
    try:
        assert_security_gate(command, context_label="Workspace Command")
        result = subprocess.run(
            command,
            shell=True,
            cwd=WORKSPACE_DIR,
            capture_output=True,
            text=True,
            timeout=120
        )
        return result.stdout or result.stderr or "Command executed successfully."
    except PermissionError as pe:
        return str(pe)
    except Exception as e:
        return f"Error running workspace command: {str(e)}"

@mcp.tool()
def run_graphify_extraction() -> str:
    """Runs Graphify AST extraction to build the codebase knowledge graph."""
    try:
        result = subprocess.run(
            "graphify .",
            shell=True,
            cwd=WORKSPACE_DIR,
            capture_output=True,
            text=True,
            timeout=180
        )
        return result.stdout or result.stderr or "Graphify extraction completed."
    except Exception as e:
        return f"Error running Graphify: {str(e)}"

@mcp.tool()
def get_workspace_status() -> str:
    """Returns the current Git status and workspace health."""
    try:
        result = subprocess.run(
            "git status -s",
            shell=True,
            cwd=WORKSPACE_DIR,
            capture_output=True,
            text=True,
            timeout=30
        )
        return f"Git Status:\n{result.stdout or 'Clean working tree'}"
    except Exception as e:
        return f"Error reading status: {str(e)}"

if __name__ == "__main__":
    print(f"Starting FastMCP Server for HitecApp-Safety on port 8000 (SSE)...")
    mcp.run(transport="sse", port=8000)