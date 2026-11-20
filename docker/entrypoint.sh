#!/bin/sh
set -e

# Single runtime image entrypoint. Role selection order:
#   1. UWAZI_ROLE env var (e.g. "queue-worker")
#   2. first CLI argument (e.g. `docker run <image> queue-worker`)
#   3. "backend" (default)
#
# Any other first argument (migrations, CLI, ad-hoc node command) is passed
# through to exec directly. The resolved role is written to /tmp/uwazi-role so
# the healthcheck can act on it even when the role came from a CLI argument.

ROLE_FILE=/tmp/uwazi-role

resolve_role() {
  if [ -n "${UWAZI_ROLE:-}" ]; then
    echo "$UWAZI_ROLE"
  elif [ -f "$ROLE_FILE" ]; then
    cat "$ROLE_FILE"
  else
    echo "backend"
  fi
}

healthcheck() {
  role="$(resolve_role)"
  case "$role" in
    queue-worker|worker)
      # No HTTP endpoint; liveness = the role process (PID 1) is still alive.
      exec node -e "try { process.kill(1, 0) } catch { process.exit(1) }"
      ;;
    *)
      exec node -e "fetch('http://127.0.0.1:3000/api/version').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
      ;;
  esac
}

if [ "$#" -gt 0 ] && [ "$1" = "healthcheck" ]; then
  healthcheck
fi

role="${UWAZI_ROLE:-${1:-backend}}"
echo "$role" > "$ROLE_FILE" 2>/dev/null || true

case "$role" in
  backend|server)     exec node --no-experimental-fetch server.js ;;
  queue-worker|queue) exec node --no-experimental-fetch app/queueWorker.js ;;
  worker)             exec node --no-experimental-fetch app/worker.js ;;
  *)                  exec "$@" ;;
esac
