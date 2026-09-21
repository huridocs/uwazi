#!/usr/bin/env bash
#
# Relationship denormalization — end-to-end test (reproduces the manual API test).
#
# Prerequisites (all running):
#   - Uwazi on http://localhost:3000 (`yarn hot` runs the API *and* the in-process
#     queue worker, which this test depends on to process the denormalization job).
#   - MongoDB, Redis, Elasticsearch and Postgres.
#
# What it does:
#   1. Resets the dev database with `yarn blank-state --force`.
#   2. Creates a dedicated admin user in MongoDB (so we can log in).
#   3. Logs in via POST /api/login.
#   4. Creates a `related` relationship type (blank-state has none).
#   5. Creates target + referencer templates (plain relationship, then an
#      inherited relationship).
#   6. Creates entities, updates the referenced entity and asserts that the
#      denormalized label / inherited value propagated asynchronously.
#
# Environment overrides:
#   BASE_URL         (default http://localhost:3000)
#   DATABASE_NAME    (default uwazi_development)
#   TEST_USER        (default autotest)
#   TEST_PASSWORD    (default testPass123!)
#   SKIP_CLEANUP=1   skip `yarn blank-state --force` (assumes an already-clean DB)
#
# Usage:
#   ./scripts/e2e-relationship-denormalization.sh
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
TEST_USER="${TEST_USER:-autotest}"
TEST_PASSWORD="${TEST_PASSWORD:-testPass123!}"

COOKIE_JAR="$(mktemp /tmp/uwazi-cookies.XXXXXX)"
trap 'rm -f "$COOKIE_JAR"' EXIT

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

require() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
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

# poll_json <desc> <path> <jq_filter> <expected> [attempts] [delay_seconds]
poll_json() {
  local desc="$1" path="$2" filter="$3" expected="$4" attempts="${5:-40}" delay="${6:-0.5}"
  local got
  for _ in $(seq 1 "$attempts"); do
    got="$(curl -s -m 10 -b "$COOKIE_JAR" -H 'X-Requested-With: XMLHttpRequest' \
      "$BASE_URL$path" | jq -r "$filter" 2>/dev/null || true)"
    if [ "$got" = "$expected" ]; then
      pass "$desc"
      return 0
    fi
    sleep "$delay"
  done
  echo -e "${RED}   last value: '$got' (expected '$expected')${NC}"
  fail "$desc"
}

# jq_id <json> -> ._id (fails if missing/null)
jq_id() {
  local id
  id="$(printf '%s' "$1" | jq -r '._id // empty')"
  [ -n "$id" ] || fail "expected an _id in response: $1"
  printf '%s' "$id"
}

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
require curl
require jq
require node
require mongosh

echo "BASE_URL=$BASE_URL  DB=$DB_NAME  user=$TEST_USER"

# ---------------------------------------------------------------------------
# 1. Cleanup
# ---------------------------------------------------------------------------
step "Reset database (blank-state)"
if [ "${SKIP_CLEANUP:-0}" = "1" ]; then
  echo "⏭  SKIP_CLEANUP=1 — skipping blank-state (DB is assumed clean)"
else
  if ! yarn blank-state --force > /tmp/uwazi-blank-state.log 2>&1; then
    tail -40 /tmp/uwazi-blank-state.log
    fail "blank-state failed"
  fi
  pass "blank-state --force completed"
fi

# ---------------------------------------------------------------------------
# 2. Create test user
# ---------------------------------------------------------------------------
step "Create test user '$TEST_USER'"
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

# ---------------------------------------------------------------------------
# 3. Login
# ---------------------------------------------------------------------------
step "Log in"
LOGIN_RESP="$(api POST /api/login "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASSWORD\"}")"
if ! printf '%s' "$LOGIN_RESP" | jq -e '.success == true' >/dev/null; then
  fail "login failed: $LOGIN_RESP"
fi
pass "logged in as '$TEST_USER'"

# ---------------------------------------------------------------------------
# 4. Relationship type
# ---------------------------------------------------------------------------
step "Create relationship type 'related'"
REL_TYPE_ID="$(api GET /api/relationtypes | jq -r '.rows[]? | select(.name=="related") | ._id' | head -1)"
if [ -z "$REL_TYPE_ID" ]; then
  REL_TYPE_ID="$(api POST /api/relationtypes '{"name":"related"}' | jq -r '._id // empty')"
fi
[ -n "$REL_TYPE_ID" ] || fail "could not create/find relationship type 'related'"
pass "relationship type id=$REL_TYPE_ID"

COMMON_PROPS='[{"name":"title","label":"Title","type":"text","isCommonProperty":true},{"name":"creationDate","label":"Date added","type":"date","isCommonProperty":true},{"name":"editDate","label":"Date modified","type":"date","isCommonProperty":true}]'

# ---------------------------------------------------------------------------
# 5. Templates
# ---------------------------------------------------------------------------
step "Create target template"
TARGET_TPL="$(api POST /api/templates \
  "$(jq -nc --argjson cp "$COMMON_PROPS" '{name:"Target Template", commonProperties:$cp, properties:[]}')")"
TARGET_TPL_ID="$(jq_id "$TARGET_TPL")"
pass "target template id=$TARGET_TPL_ID"

step "Create referencer template (relationship -> target)"
REF_TPL="$(api POST /api/templates \
  "$(jq -nc --argjson cp "$COMMON_PROPS" --arg target "$TARGET_TPL_ID" --arg rt "$REL_TYPE_ID" \
    '{name:"Referencer Template", commonProperties:$cp, properties:[{label:"Related", type:"relationship", content:$target, relationType:$rt}]}')")"
REF_TPL_ID="$(jq_id "$REF_TPL")"
REL_PROP_NAME="$(printf '%s' "$REF_TPL" | jq -r '.properties[0].name')"
pass "referencer template id=$REF_TPL_ID (property name='$REL_PROP_NAME')"

# ---------------------------------------------------------------------------
# 6. Plain relationship propagation
# ---------------------------------------------------------------------------
step "Create target entity B1"
B1="$(api POST /api/entities \
  "$(jq -nc --arg tpl "$TARGET_TPL_ID" '{title:"Original Title B1", template:$tpl, metadata:{}, language:"en"}')")"
B1_ID="$(jq_id "$B1")"
B1_SID="$(printf '%s' "$B1" | jq -r '.sharedId')"
pass "B1 sharedId=$B1_SID"

step "Create referencer entity A1"
A1="$(api POST /api/entities \
  "$(jq -nc --arg tpl "$REF_TPL_ID" --arg sid "$B1_SID" --arg prop "$REL_PROP_NAME" \
    '{title:"Entity A1", template:$tpl, metadata:{($prop):[{value:$sid}]}, language:"en"}')")"
A1_SID="$(printf '%s' "$A1" | jq -r '.sharedId')"
FWD_LABEL="$(printf '%s' "$A1" | jq -r '.metadata.related[0].label // empty')"
[ "$FWD_LABEL" = "Original Title B1" ] || fail "forward fill: expected 'Original Title B1', got '$FWD_LABEL'"
pass "A1 sharedId=$A1_SID — forward fill label='$FWD_LABEL'"

step "Update B1 title -> 'New Title B1'"
api POST /api/entities \
  "$(jq -nc --arg id "$B1_ID" --arg sid "$B1_SID" --arg tpl "$TARGET_TPL_ID" \
    '{_id:$id, sharedId:$sid, title:"New Title B1", template:$tpl, metadata:{}, language:"en"}')" \
  > /dev/null
pass "B1 updated"

step "Assert denormalization propagated to A1 (async)"
poll_json "A1 related label = 'New Title B1'" "/api/entities?sharedId=$A1_SID" \
  '.rows[0].metadata.related[0].label' "New Title B1"

# ---------------------------------------------------------------------------
# 7. Inherited relationship propagation
# ---------------------------------------------------------------------------
step "Create inherit-target template (with a text property)"
INH_TARGET_TPL="$(api POST /api/templates \
  "$(jq -nc --argjson cp "$COMMON_PROPS" \
    '{name:"Inherit Target Template", commonProperties:$cp, properties:[{label:"Description", type:"text"}]}')")"
INH_TARGET_TPL_ID="$(jq_id "$INH_TARGET_TPL")"
DESC_PROP_ID="$(printf '%s' "$INH_TARGET_TPL" | jq -r '.properties[0]._id // empty')"
[ -n "$DESC_PROP_ID" ] || fail "could not read description property id"
pass "inherit-target template id=$INH_TARGET_TPL_ID (description prop id=$DESC_PROP_ID)"

step "Create inherit-referencer template (relationship + inherit)"
INH_REF_TPL="$(api POST /api/templates \
  "$(jq -nc --argjson cp "$COMMON_PROPS" --arg target "$INH_TARGET_TPL_ID" --arg rt "$REL_TYPE_ID" --arg prop "$DESC_PROP_ID" \
    '{name:"Inherit Referencer Template", commonProperties:$cp, properties:[{label:"Related Inherited", type:"relationship", content:$target, relationType:$rt, inherit:{property:$prop, type:"text"}}]}')")"
INH_REF_TPL_ID="$(jq_id "$INH_REF_TPL")"
INH_PROP_NAME="$(printf '%s' "$INH_REF_TPL" | jq -r '.properties[0].name')"
pass "inherit-referencer template id=$INH_REF_TPL_ID (property name='$INH_PROP_NAME')"

step "Create inherit-target entity B2"
B2="$(api POST /api/entities \
  "$(jq -nc --arg tpl "$INH_TARGET_TPL_ID" '{title:"Inherit Target Entity", template:$tpl, metadata:{description:[{value:"Description v1"}]}, language:"en"}')")"
B2_ID="$(jq_id "$B2")"
B2_SID="$(printf '%s' "$B2" | jq -r '.sharedId')"
pass "B2 sharedId=$B2_SID"

step "Create inherit-referencer entity A2"
A2="$(api POST /api/entities \
  "$(jq -nc --arg tpl "$INH_REF_TPL_ID" --arg sid "$B2_SID" --arg prop "$INH_PROP_NAME" \
    '{title:"Inherit Referencer Entity", template:$tpl, metadata:{($prop):[{value:$sid}]}, language:"en"}')")"
A2_SID="$(printf '%s' "$A2" | jq -r '.sharedId')"
FWD_INH="$(printf '%s' "$A2" | jq -r '.metadata.related_inherited[0].inheritedValue[0].value // empty')"
[ "$FWD_INH" = "Description v1" ] || fail "forward fill (inherited): expected 'Description v1', got '$FWD_INH'"
pass "A2 sharedId=$A2_SID — forward inheritedValue='$FWD_INH'"

step "Update B2 description -> 'Description v2'"
api POST /api/entities \
  "$(jq -nc --arg id "$B2_ID" --arg sid "$B2_SID" --arg tpl "$INH_TARGET_TPL_ID" \
    '{_id:$id, sharedId:$sid, title:"Inherit Target Entity", template:$tpl, metadata:{description:[{value:"Description v2"}]}, language:"en"}')" \
  > /dev/null
pass "B2 updated"

step "Assert inherited value propagated to A2 (async)"
poll_json "A2 inheritedValue = 'Description v2'" "/api/entities?sharedId=$A2_SID" \
  '.rows[0].metadata.related_inherited[0].inheritedValue[0].value' "Description v2"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo -e "\n${GREEN}All relationship denormalization e2e checks passed.${NC}"
