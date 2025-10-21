#!/bin/bash

set -o pipefail

UWAZI_ENDPOINT="http://localhost:3000/api/version"
LOG_DIR=".github/logs"
START_UWAZI_LOG="$LOG_DIR/start-uwazi-logs.txt"
HEALTH_CHECK_LOG="$LOG_DIR/health-check-logs.txt"

mkdir -p "$LOG_DIR"

> "$START_UWAZI_LOG"
> "$HEALTH_CHECK_LOG"

yarn run-production-e2e > "$START_UWAZI_LOG" 2>&1 &
sleep 2  

uwazi_pid=$(pgrep -f "server.js")

echo "⏳ Waiting for Uwazi to start..."
echo "⏳ uwazi pid: $uwazi_pid"
echo

timeout 60s bash -c "
  until curl --silent --fail --show-error '$UWAZI_ENDPOINT' 2>>'$HEALTH_CHECK_LOG'; do
    sleep 1
  done
" || {
  echo "❌ Health check failed. Check the logs below:"
  echo

  echo "📁 Startup logs:"
  cat "$START_UWAZI_LOG"
  echo
  
  echo "📁 Health-check logs:"
  cat "$HEALTH_CHECK_LOG"

  kill $uwazi_pid
  exit 1
}

echo
echo "✅ Uwazi is up!"
exit 0
