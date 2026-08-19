import time
from pyngrok import ngrok

# Open HTTP tunnel on port 8000
tunnel = ngrok.connect(8000)
public_url = tunnel.public_url.replace("http://", "https://")
sse_url = f"{public_url}/sse"

print("\n" + "="*60)
print("🔗 GEMINI SPARK MCP APP LINK:")
print(f"👉 {sse_url}")
print("="*60 + "\n")

print("Tunnel is running in the background. Do not close.")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    ngrok.disconnect(public_url)