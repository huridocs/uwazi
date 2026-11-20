#!/bin/sh
set -e

# Single runtime image entrypoint. Role selection order:
#   1. first CLI argument (e.g. `docker run <image> queue-worker`)
#   2. "backend" (default)
#
# Any other first argument (migrations, CLI, ad-hoc node command) is passed
# through to exec directly. The resolved role is written to /tmp/uwazi-role so
# the healthcheck can act on it even though the healthcheck runs as a separate
# process without access to the original command line.

ROLE_FILE=/tmp/uwazi-role

resolve_role() {
  if [ -f "$ROLE_FILE" ]; then
    cat "$ROLE_FILE"
  else
    echo "backend"
  fi
}

healthcheck() {
  role="$(resolve_role)"
  case "$role" in
    queue-worker|legacy-worker)
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

role="${1:-backend}"
echo "$role" > "$ROLE_FILE" 2>/dev/null || true

case "$role" in
  backend|server)     exec node --no-experimental-fetch server.js ;;
  queue-worker|queue) exec node --no-experimental-fetch app/queueWorker.js ;;
  legacy-worker)      exec node --no-experimental-fetch app/worker.js ;;
  *)                  exec "$@" ;;
esac
