#!/usr/bin/env bash
set -euo pipefail

# Start mock API and Next.js production server for quick demo
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting mock API..."
if pgrep -f "mock-api/server.js" >/dev/null; then
  echo "mock API already running"
else
  (cd "$ROOT_DIR" && node mock-api/server.js) &
  sleep 1
fi

echo "Building Next.js dashboard (if needed) and starting..."
cd "$ROOT_DIR/nextjs-dashboard"
if [ ! -d node_modules ]; then
  npm ci --legacy-peer-deps
fi
npm run build

export NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8080/api/v1}
export PORT=${PORT:-3000}

nohup sh -c "NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL PORT=$PORT npm run start" > /tmp/next.log 2>&1 &
echo "Next.js started — logs: /tmp/next.log"

echo "Dashboard: http://localhost:${PORT}"
echo "Mock API: http://localhost:8080/api/v1"
