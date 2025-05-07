set -o pipefail

UWAZI_ENDPOINT="http://localhost:3000"
LOG_DIR=".github/logs"
START_UWAZI_LOG="$LOG_DIR/start-uwazi-logs.txt"
HEALTH_CHECK_LOG="$LOG_DIR/health-check-logs.txt"

mkdir -p "$LOG_DIR"

> "$START_UWAZI_LOG"
> "$HEALTH_CHECK_LOG"

yarn run-production > "$START_UWAZI_LOG" 2>&1 &
uwazi_pid=$! 

echo "⏳ Waiting for Uwazi to start..."
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

echo "✅ Uwazi is up!"
exit 0