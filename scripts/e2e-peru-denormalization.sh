#!/usr/bin/env bash
#
# Peru relationship-denormalization e2e test (production-dataset scenario).
#
# Verifies that renaming the country "Peru" propagates to every entity that
# references it, as a SINGLE hop (not a recursive graph traversal):
#   Peru updated -> DenormalizeEntitiesHandler(kind=relationships)
#                -> DenormalizeEntitiesChunkHandler x ceil(refs/100)
#                -> done (no re-dispatch from the job's own writes).
#
# Prerequisites:
#   - The dataset is already loaded in MongoDB (Peru + referencing entities).
#   - Uwazi API is running on http://localhost:3000 WITHOUT a queue worker
#     (e.g. CLUSTER_MODE=true). This script runs `yarn dev-queue` itself and
#     parses its JSON log.
#   - MongoDB, Redis, Elasticsearch, Postgres are up.
#
# Environment overrides:
#   BASE_URL          (default http://localhost:3000)
#   DATABASE_NAME     (default uwazi_development)
#   SHARED_DB         (default uwazi_shared_db)
#   TEST_USER         (default autotest)  - created if missing
#   TEST_PASSWORD     (default testPass123!)
#   NEW_ES / NEW_EN / NEW_PT  (default "Perú Test" / "Peru Test" / "Peru Test")
#
# Usage:
#   ./scripts/e2e-peru-denormalization.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$REPO_ROOT"

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_URL="${BASE_URL:-http://localhost:3000}"
DB_NAME="${DATABASE_NAME:-uwazi_development}"
SHARED_DB="${SHARED_DB:-uwazi_shared_db}"
TEST_USER="${TEST_USER:-autotest}"
TEST_PASSWORD="${TEST_PASSWORD:-testPass123!}"
NEW_ES="${NEW_ES:-Perú Test}"
NEW_EN="${NEW_EN:-Peru Test}"
NEW_PT="${NEW_PT:-Peru Test}"

COOKIE_JAR="$(mktemp /tmp/uwazi-peru-cookies.XXXXXX)"
WORKER_LOG="${WORKER_LOG_PATH:-/tmp/uwazi-peru-worker.log}"

stop_worker() {
  pkill -INT -f 'queueWorker\.ts' 2>/dev/null || true
  sleep 1
}
trap 'stop_worker; rm -f "$COOKIE_JAR"' EXIT

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

step() { echo -e "\n${CYAN}▶ $1${NC}"; }
pass() { echo -e "${GREEN}✅ $1${NC}"; }
fail() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}
require() { command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"; }

# api <METHOD> <PATH> [JSON_BODY] -> prints response body
api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(
    -s -m 30 -b "$COOKIE_JAR" -c "$COOKIE_JAR"
    -H 'X-Requested-With: XMLHttpRequest'
    -H 'Content-Type: application/json'
    -X "$method" "$BASE_URL$path"
  )
  if [ -n "$body" ]; then args+=(-d "$body"); fi
  curl "${args[@]}"
}

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
require curl
require jq
require node
require mongosh

# Ensure no queue worker is already running (we run our own to capture output).
if pgrep -f 'queueWorker\.ts' >/dev/null 2>&1; then
  fail "a queue worker (queueWorker.ts) is already running — stop it first"
fi

echo "BASE_URL=$BASE_URL  DB=$DB_NAME  sharedDB=$SHARED_DB"

# ---------------------------------------------------------------------------
# 1. Discover Peru + referencing entities
# ---------------------------------------------------------------------------
step "Discover Peru and referencing entities"
PERU_INFO="$(mongosh --quiet "$DB_NAME" --eval '
const tpl = db.templates.findOne({ name: "País" });
if (!tpl) { print("NO_TEMPLATE"); quit(0); }
const peruEs = db.entities.findOne({ template: tpl._id, language: "es", title: "Perú" });
if (!peruEs) { print("NO_PERU"); quit(0); }
const docs = db.entities.find({ sharedId: peruEs.sharedId }).toArray();
const relPropsSet = new Set();
db.templates.find().forEach(t => (t.properties || []).forEach(p => {
  if (p.type === "relationship") relPropsSet.add(p.name);
}));
const relProps = [...relPropsSet];
const or = relProps.map(p => ({ ["metadata." + p + ".value"]: peruEs.sharedId }));
const refCount = db.entities.distinct("sharedId", { language: "es", $or: or }).length;
print(JSON.stringify({
  sharedId: peruEs.sharedId,
  template: tpl._id.toString(),
  relProps,
  refCount,
  docs: docs.map(d => ({ lang: d.language, id: d._id.toString(), title: d.title })),
}));
')"

[ "$PERU_INFO" != "NO_TEMPLATE" ] || fail "template 'País' not found"
[ "$PERU_INFO" != "NO_PERU" ] || fail "Peru (title 'Perú' in País template) not found"

PERU_SID="$(printf '%s' "$PERU_INFO" | jq -r '.sharedId')"
TPL_ID="$(printf '%s' "$PERU_INFO" | jq -r '.template')"
RELPROPS="$(printf '%s' "$PERU_INFO" | jq -c '.relProps')"
REF_COUNT="$(printf '%s' "$PERU_INFO" | jq -r '.refCount')"

ID_BY_LANG() { printf '%s' "$PERU_INFO" | jq -r ".docs[] | select(.lang==\"$1\") | .id"; }
ES_ID="$(ID_BY_LANG es)"
EN_ID="$(ID_BY_LANG en)"
PT_ID="$(ID_BY_LANG pt)"

[ -n "$ES_ID" ] && [ -n "$EN_ID" ] && [ -n "$PT_ID" ] || fail "Peru must have es/en/pt documents"

CHUNKS_PER_LANG=$(( (REF_COUNT + 99) / 100 ))
EXPECTED_HANDLERS=3
EXPECTED_CHUNKS=$(( 3 * CHUNKS_PER_LANG ))

echo "  Peru sharedId=$PERU_SID  template=$TPL_ID"
echo "  relationship props: $(printf '%s' "$RELPROPS" | jq -r 'join(", ")')"
echo "  referencing sharedIds (es): $REF_COUNT"
echo "  expected: $EXPECTED_HANDLERS handlers, $EXPECTED_CHUNKS chunk jobs ($CHUNKS_PER_LANG per language)"

# ---------------------------------------------------------------------------
# 2. Ensure a test admin user exists (so we can log in)
# ---------------------------------------------------------------------------
step "Ensure test user '$TEST_USER'"
EXISTS="$(mongosh --quiet "$DB_NAME" --eval "db.users.countDocuments({ username: '$TEST_USER' })" | tail -1)"
if [ "$EXISTS" = "0" ]; then
  HASH="$(node -e 'console.log(require("bcryptjs").hashSync(process.argv[1], 10))' "$TEST_PASSWORD")"
  mongosh --quiet "$DB_NAME" >/dev/null <<EOF
db.users.updateOne(
  { username: "$TEST_USER" },
  { \$set: {
      password: "$HASH",
      role: "admin",
      email: "$TEST_USER@uwazi.local",
      accountLocked: false,
      failedLogins: 0,
      using2fa: false,
      secret: null
  } },
  { upsert: true }
);
EOF
  pass "created user '$TEST_USER'"
else
  pass "user '$TEST_USER' already exists"
fi

# ---------------------------------------------------------------------------
# 3. Login
# ---------------------------------------------------------------------------
step "Log in"
LOGIN_RESP="$(api POST /api/login "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASSWORD\"}")"
printf '%s' "$LOGIN_RESP" | jq -e '.success == true' >/dev/null || fail "login failed: $LOGIN_RESP"
pass "logged in as '$TEST_USER'"

# ---------------------------------------------------------------------------
# 4. Rename Peru (es/en/pt) — dispatches 3 DenormalizeEntitiesHandler jobs
# ---------------------------------------------------------------------------
step "Rename Peru"
for spec in "es:$ES_ID:$NEW_ES" "en:$EN_ID:$NEW_EN" "pt:$PT_ID:$NEW_PT"; do
  lang="${spec%%:*}"; rest="${spec#*:}"; id="${rest%%:*}"; title="${rest#*:}"
  BODY="$(jq -nc --arg id "$id" --arg sid "$PERU_SID" --arg tpl "$TPL_ID" --arg title "$title" --arg lang "$lang" \
    '{_id:$id, sharedId:$sid, title:$title, template:$tpl, language:$lang}')"
  RESP="$(api POST /api/entities "$BODY")"
  printf '%s' "$RESP" | jq -e 'has("error") | not' >/dev/null || fail "rename failed for language $lang: $RESP"
  echo "  renamed $lang -> '$title'"
done
pass "renamed es/en/pt"

# ---------------------------------------------------------------------------
# 5. Inspect the enqueued jobs (before processing)
# ---------------------------------------------------------------------------
step "Inspect enqueued DenormalizeEntitiesHandler jobs"
ENQ_COUNT="$(mongosh --quiet "$SHARED_DB" --eval 'db.jobs.countDocuments({ name: "DenormalizeEntitiesHandler" })' | tail -1)"
[ "$ENQ_COUNT" = "$EXPECTED_HANDLERS" ] || fail "expected $EXPECTED_HANDLERS enqueued handlers, found $ENQ_COUNT"

BAD_PARAMS="$(mongosh --quiet "$SHARED_DB" --eval '
const jobs = db.jobs.find({ name: "DenormalizeEntitiesHandler" }, { params: 1 }).toArray();
print(jobs.filter(j => j.params.kind !== "relationships" || JSON.stringify(j.params.sharedIds) !== JSON.stringify(["'"$PERU_SID"'"])).length);
' | tail -1)"
[ "$BAD_PARAMS" = "0" ] || fail "some handler jobs have wrong params (kind/sharedIds)"
echo "  $ENQ_COUNT handlers enqueued, all with kind=relationships & sharedIds=[$PERU_SID]"
pass "dispatch params correct"

# ---------------------------------------------------------------------------
# 6. Run the queue worker and capture its output
# ---------------------------------------------------------------------------
step "Run yarn dev-queue (capturing output)"
yarn dev-queue > "$WORKER_LOG" 2>&1 &
echo "  worker log: $WORKER_LOG"

# wait for worker to be ready
for _ in $(seq 1 30); do
  grep -q '"message":"Queue worker started"' "$WORKER_LOG" && break
  sleep 1
done
grep -q '"message":"Queue worker started"' "$WORKER_LOG" || fail "queue worker did not start (see $WORKER_LOG)"
pass "queue worker started"

# ---------------------------------------------------------------------------
# 7. Wait for the queue to drain
# ---------------------------------------------------------------------------
step "Wait for queue to drain"
DRAINED=0
for _ in $(seq 1 150); do
  REMAIN="$(mongosh --quiet "$SHARED_DB" --eval 'db.jobs.countDocuments({ name: { $nin: ["CleanupExpiredPasswordRecoveriesJob","CleanupExpiredCaptchasJob"] } })' 2>/dev/null | tail -1 || true)"
  if [ "$REMAIN" = "0" ]; then
    sleep 3
    REMAIN2="$(mongosh --quiet "$SHARED_DB" --eval 'db.jobs.countDocuments({ name: { $nin: ["CleanupExpiredPasswordRecoveriesJob","CleanupExpiredCaptchasJob"] } })' 2>/dev/null | tail -1 || true)"
    if [ "$REMAIN2" = "0" ]; then DRAINED=1; break; fi
  fi
  sleep 2
done
[ "$DRAINED" = "1" ] || fail "queue did not drain in time"

# ---------------------------------------------------------------------------
# 8. Stop the worker
# ---------------------------------------------------------------------------
step "Stop the worker"
stop_worker
sleep 2
pass "queue drained and worker stopped"

# ---------------------------------------------------------------------------
# 9. Parse the jobs that were executed
# ---------------------------------------------------------------------------
step "Jobs executed (from worker log)"
HANDLERS="$(grep '"message":"Processing job"' "$WORKER_LOG" | jq -r '.job.name' 2>/dev/null | grep -c '^DenormalizeEntitiesHandler$' || true)"
CHUNKS="$(grep '"message":"Processing job"' "$WORKER_LOG" | jq -r '.job.name' 2>/dev/null | grep -c '^DenormalizeEntitiesChunkHandler$' || true)"
LISTENERS="$(grep '"message":"Processing job"' "$WORKER_LOG" | jq -r '.job.name' 2>/dev/null | grep -c 'EntityUpdatedEvent' || true)"
FAILED_JOBS="$(mongosh --quiet "$SHARED_DB" --eval 'db.jobs.countDocuments({ failed: true })' | tail -1)"

echo "  DenormalizeEntitiesHandler:      $HANDLERS  (expected $EXPECTED_HANDLERS)"
echo "  DenormalizeEntitiesChunkHandler: $CHUNKS  (expected $EXPECTED_CHUNKS)"
echo "  EntityUpdatedEvent listeners:    $LISTENERS"
echo "  failed jobs:                     $FAILED_JOBS"

[ "$HANDLERS" = "$EXPECTED_HANDLERS" ] || fail "expected $EXPECTED_HANDLERS handlers (single hop), got $HANDLERS — retrigger detected?"
[ "$CHUNKS" = "$EXPECTED_CHUNKS" ] || fail "expected $EXPECTED_CHUNKS chunk jobs, got $CHUNKS"
[ "$FAILED_JOBS" = "0" ] || fail "$FAILED_JOBS failed job(s)"
pass "single-hop job shape confirmed (no graph retrigger)"

# ---------------------------------------------------------------------------
# 10. Verify denormalized labels
# ---------------------------------------------------------------------------
step "Verify denormalized labels"
LABEL_JS="$(mktemp /tmp/uwazi-label.XXXXXX.js)"
cat > "$LABEL_JS" <<EOF
const peruSid = "$PERU_SID";
const relProps = $RELPROPS;
const or = relProps.map(p => ({ ["metadata." + p + ".value"]: peruSid }));
const expected = { es: "$NEW_ES", en: "$NEW_EN", pt: "$NEW_PT" };
const out = {};
Object.keys(expected).forEach(lang => {
  let wrong = 0;
  relProps.forEach(p => {
    wrong += db.entities.countDocuments({ language: lang, ["metadata." + p + ".value"]: peruSid, ["metadata." + p + ".label"]: { \$ne: expected[lang] } });
  });
  out[lang] = wrong;
});
print(JSON.stringify(out));
EOF
LABEL_CHECK="$(mongosh --quiet "$DB_NAME" "$LABEL_JS")"
rm -f "$LABEL_JS"
echo "  wrong labels per language: $LABEL_CHECK"
WRONG_TOTAL="$(printf '%s' "$LABEL_CHECK" | jq '[.[]] | add')"
[ "$WRONG_TOTAL" = "0" ] || fail "found $WRONG_TOTAL documents with a stale label: $LABEL_CHECK"
pass "all referencing labels are correct"

echo -e "\n${GREEN}Peru denormalization e2e passed (single hop).${NC}"
