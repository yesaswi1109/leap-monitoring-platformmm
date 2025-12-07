#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/start_ngrok.sh <NGROK_AUTH_TOKEN>
# This script downloads the ngrok binary (linux-amd64), sets the auth token
# (if supplied), and starts a tunnel to localhost:3000. It prints the public URL.

NGROK_TOKEN=${1:-${NGROK_AUTH_TOKEN:-}}
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NGROK_BIN="$ROOT_DIR/.ngrok/ngrok"

mkdir -p "$ROOT_DIR/.ngrok"

if [ ! -x "$NGROK_BIN" ]; then
  echo "Downloading ngrok..."
  TMPZIP="/tmp/ngrok.zip"
  wget -q -O "$TMPZIP" "https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip"
  unzip -o "$TMPZIP" -d "$ROOT_DIR/.ngrok" >/dev/null
  chmod +x "$NGROK_BIN"
fi

if [ -n "$NGROK_TOKEN" ]; then
  echo "Configuring ngrok auth token"
  "$NGROK_BIN" authtoken "$NGROK_TOKEN" || true
fi

echo "Starting ngrok tunnel to http://localhost:3000"
"$NGROK_BIN" http 3000 --log=stdout > "$ROOT_DIR/.ngrok/ngrok.log" 2>&1 &
NGROK_PID=$!
sleep 2

echo "Waiting for tunnel to become available..."
for i in $(seq 1 10); do
  sleep 1
  if curl -sS http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
    break
  fi
done

API_RESP=$(curl -sS http://127.0.0.1:4040/api/tunnels || true)
PUBLIC_URL=$(echo "$API_RESP" | grep -oE 'https://[a-z0-9.-]+' | head -n1 || true)

echo "ngrok PID: $NGROK_PID"
if [ -n "$PUBLIC_URL" ]; then
  echo "Public URL: $PUBLIC_URL"
  echo "Tunnel logs: $ROOT_DIR/.ngrok/ngrok.log"
else
  echo "Couldn't determine public URL. Check $ROOT_DIR/.ngrok/ngrok.log"
fi
