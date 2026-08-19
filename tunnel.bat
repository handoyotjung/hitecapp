@echo off
title Spark MCP Tunnel
:loop
cd C:\Antigravity IDE\HitecApp\Safety
npx localtunnel --port 8000
timeout /t 5 /nobreak >nul
goto loop