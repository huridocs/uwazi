#!/bin/bash

set -o pipefail

UWAZI_ENDPOINT="http://localhost:3000/api/version"
LOG_DIR=".github/logs"
START_UWAZI_LOG="$LOG_DIR/start-uwazi-logs.txt"
HEALTH_CHECK_LOG="$LOG_DIR/health-check-logs.txt"

mkdir -p "$LOG_DIR"

> "$START_UWAZI_LOG"
> "$HEALTH_CHECK_LOG"

# Change to prod directory where the production build is
cd prod

echo "Starting Uwazi from $(pwd)"
echo "Contents of prod directory:"
ls -la

yarn run-production > "../$START_UWAZI_LOG" 2>&1 &
sleep 3
cd ..

uwazi_pid=$(pgrep -f "server.js")

echo "⏳ Waiting for Uwazi to start..."
echo "⏳ uwazi pid: $uwazi_pid"
echo

# Check if process is still running
if ! kill -0 $uwazi_pid 2>/dev/null; then
  echo "❌ Uwazi process died immediately after starting"
  echo "📁 Startup logs:"
  cat "$START_UWAZI_LOG"
  exit 1
fi
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