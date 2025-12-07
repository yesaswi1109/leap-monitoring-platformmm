#!/usr/bin/env bash
set -euo pipefail

# Simple script to start the demo (builds and runs Docker Compose)
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR/leap-monitoring-platform"

echo "Starting demo services (this will build images if necessary)..."
docker-compose -f docker-compose-simple.yml up -d --build

echo "Waiting a few seconds for services to start..."
sleep 6

echo "Services status:"
docker-compose -f docker-compose-simple.yml ps

echo "Frontend: http://localhost:3000/"
echo "Backend metrics: http://localhost:8080/api/v1/metrics"

echo "To make the Codespaces URL public: open the Ports view in Codespaces and make port 3000 public."
