@echo off
title Spark MCP Tunnel
echo === FastMCP Bridge Tunnel Starting ===
echo.
echo Port forwarding localhost:8000 to public HTTPS tunnel...
echo.
echo Using localtunnel --port 8000
echo.
npx localtunnel --port 8000
echo.
echo Tunnel terminated. Press any key to close...
pause >nul