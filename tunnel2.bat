@echo off
title Spark MCP Tunnel
:loop
cd /d C:\Antigravity IDE\HitecApp\Safety
echo Starting localtunnel on port 8000...
npx localtunnel --port 8000
echo Tunnel ended. Reconnecting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop