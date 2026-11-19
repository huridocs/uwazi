#!/usr/bin/env bash
set -euo pipefail
shopt -s inherit_errexit

export NODE_ENV=production

SCRIPTPATH="$(
	cd "$(dirname "$0")" >/dev/null 2>&1
	pwd -P
)"
cd "$SCRIPTPATH"/../

# Extra args (e.g. --analyze) are forwarded to the webpack step.
BUILD_ARGS=("$@")

echo "🚀 Starting optimized build process..."

# Clean production directory
rm -rf ./prod/*
mkdir -p ./prod/{dist,app/{api,shared},database,scripts,log,uploaded_documents,temporal_files,custom_uploads}

START_TIME=$(date +%s)

# ---------------------------------------------------------------------------
# Parallel runner: steps 1-5 write to disjoint prod/ subtrees and share no
# files, so they run concurrently. Each logs to its own file and records its
# wall time + exit code in a TSV so we can report per-step results (and abort)
# once all of them finish.
# ---------------------------------------------------------------------------
LOGDIR=$(mktemp -d)
TIMINGS="$LOGDIR/timings.tsv"
PIDS=()

spawn() {
	local label="$1" fn="$2"
	shift 2
	local args=("$@")
	local idx=${#PIDS[@]}
	(
		local start end rc
		start=$(date +%s)
		"$fn" "${args[@]}" > "$LOGDIR/step${idx}.log" 2>&1
		rc=$?
		end=$(date +%s)
		printf '%s\t%s\t%s\t%s\n' "$idx" "$label" "$rc" "$((end - start))" >> "$TIMINGS"
		exit "$rc"
	) &
	PIDS+=("$!")
}

step_static() {
	cp -r public ./prod/
	cp -R ./contents ./prod/contents
}

step_app() {
	# Quote the --ignore glob so babel (not bash) expands **; pair it with
	# --no-copy-ignored so specs are neither compiled nor copied to prod/app.
	# The unquoted form only ignored a single file (bash glob expansion).
	yarn babel -D --no-copy-ignored -d prod/app --extensions .js,.jsx,.ts,.tsx --ignore './**/specs/*' app
}

step_frontend() {
	# Use BABEL_ENV=webpack to avoid babel-plugin-ignore-scss which removes CSS imports.
	BABEL_ENV=webpack yarn webpack --config ./webpack.production.config.js --progress=profile --color "$@"
}

step_db() {
	yarn babel -D -d prod/database --extensions .js,.ts,.tsx database &&
		yarn babel -D -d prod/scripts --extensions .js,.ts,.tsx scripts &&
		yarn babel -D --no-copy-ignored -d prod/apps --extensions .js,.ts,.tsx --ignore "./**/specs/*,./apps/cli/testing/*" apps &&
		chmod +x prod/apps/cli/bin/uwazi.js &&
		yarn babel -D --no-copy-ignored -d prod/packages --extensions .js,.ts,.tsx --ignore "./**/specs/*" packages &&
		yarn babel -D -d prod/ message.js
}

step_deps() {
	cp package.json prod/
	cp yarn.lock prod/
	cp .yarnrc.yml prod/
	if ! (cd prod && yarn install --immutable); then
		echo "❌ yarn install failed. Production dependencies may be incomplete."
		exit 1
	fi

	python3 <<'PYTHON_SCRIPT'
import json
import os

# Add exports to free-solid-svg-icons (doesn't have it)
solid_path = "prod/node_modules/@fortawesome/free-solid-svg-icons/package.json"
if os.path.exists(solid_path):
    with open(solid_path) as f:
        pkg = json.load(f)
    if 'exports' not in pkg:
        pkg['exports'] = {
            ".": {
                "types": "./index.d.ts",
                "import": "./index.js",
                "require": "./index.js",
                "default": "./index.js"
            },
            "./*": "./*.js"
        }
        with open(solid_path, 'w') as f:
            json.dump(pkg, f, indent=2)
        print("  ✅ Added exports to @fortawesome/free-solid-svg-icons")

# Copy exports from root to prod for free-regular-svg-icons
regular_root = "node_modules/@fortawesome/free-regular-svg-icons/package.json"
regular_prod = "prod/node_modules/@fortawesome/free-regular-svg-icons/package.json"
if os.path.exists(regular_root) and os.path.exists(regular_prod):
    with open(regular_root) as f:
        root_pkg = json.load(f)
    with open(regular_prod) as f:
        prod_pkg = json.load(f)
    if 'exports' in root_pkg and ('exports' not in prod_pkg or prod_pkg.get('exports') != root_pkg.get('exports')):
        prod_pkg['exports'] = root_pkg['exports']
        with open(regular_prod, 'w') as f:
            json.dump(prod_pkg, f, indent=2)
        print("  ✅ Added exports to @fortawesome/free-regular-svg-icons")
PYTHON_SCRIPT

	if ! (cd prod && yarn workspaces focus -A --production); then
		(cd prod && npm prune --omit=dev --legacy-peer-deps) || exit 1
	fi
}

echo "⚙️  Steps 1-5 are independent; running them in parallel..."
spawn "Static assets" step_static
spawn "App code" step_app
spawn "Frontend assets" step_frontend "${BUILD_ARGS[@]}"
spawn "Database & scripts" step_db
spawn "Production deps" step_deps

# Wait for all background steps. Failures are collected from the timings file
# so that a failing job does not abort the others mid-run.
for pid in "${PIDS[@]}"; do
	wait "$pid" || true
done

echo "  📊 Parallel step results:"
sort -n "$TIMINGS" | while IFS=$'\t' read -r idx label rc secs; do
	if [ "$rc" = "0" ]; then
		printf '    ✅ %-22s %ss\n' "$label" "$secs"
	else
		printf '    ❌ %-22s FAILED (log: %s/step%s.log)\n' "$label" "$LOGDIR" "$idx"
	fi
done

if ! awk -F'\t' '$3 != 0 { exit 1 }' "$TIMINGS"; then
	echo ""
	echo "❌ One or more build steps failed. Last 80 lines of each step log:"
	for f in "$LOGDIR"/step*.log; do
		echo ""
		echo "════════ $f ════════"
		tail -n 80 "$f"
	done
	exit 1
fi

echo "🔍 Step 3.5: Verifying build..."
MAIN_CSS_BYTES=$(find ./prod/dist -name 'main.*.css' -exec wc -c {} + 2>/dev/null | awk '{print $1}')
if [ -z "$MAIN_CSS_BYTES" ] || [ "$MAIN_CSS_BYTES" -lt 100000 ]; then
	echo "❌ main.css is missing or too small ($((MAIN_CSS_BYTES / 1024))KB). CSS bundling may be broken."
	exit 1
fi
echo "  ✅ main.css size check passed ($((MAIN_CSS_BYTES / 1024))KB)"

echo "🔧 Step 4.5: Fixing FontAwesome imports for ESM (removing .js to use export map)..."
FIX_START=$(date +%s)
find prod/app -name "library.js" -type f -exec sed -i "s|'@fortawesome/\([^/]*\)/\([^']*\)\.js'|'@fortawesome/\1/\2'|g" {} \;
FIX_TIME=$(($(date +%s) - FIX_START))
echo "  ✅ FontAwesome imports fixed in ${FIX_TIME}s"

echo "🖥️  Step 6: Copying server files..."
SERVER_FILES_START=$(date +%s)
cp ./server.js ./prod/server.js
cp ./package.json ./prod/package.json
sed -i 's|prod/server\.js|./server.js|' ./prod/package.json
SERVER_FILES_TIME=$(($(date +%s) - SERVER_FILES_START))
echo " ✅ Server files copied in ${SERVER_FILES_TIME}s"

TOTAL_TIME=$(($(date +%s) - START_TIME))

# Per-step durations recorded by the parallel runner.
STATIC_TIME=$(awk -F'\t' '$2=="Static assets"{print $4}' "$TIMINGS")
APP_TIME=$(awk -F'\t' '$2=="App code"{print $4}' "$TIMINGS")
FRONTEND_TIME=$(awk -F'\t' '$2=="Frontend assets"{print $4}' "$TIMINGS")
DB_TIME=$(awk -F'\t' '$2=="Database & scripts"{print $4}' "$TIMINGS")
DEPS_TIME=$(awk -F'\t' '$2=="Production deps"{print $4}' "$TIMINGS")

rm -rf "$LOGDIR"

echo ""
echo "✅ Build completed successfully!"
echo "📊 Build timing summary (steps 1-5 run in parallel):"
echo "  - Static assets: ${STATIC_TIME}s"
echo "  - App code: ${APP_TIME}s"
echo "  - Frontend assets: ${FRONTEND_TIME}s"
echo "  - Database & scripts: ${DB_TIME}s"
echo "  - Production deps: ${DEPS_TIME}s"
echo "  - Total time: ${TOTAL_TIME}s"
echo ""
echo "📊 Build output summary:"
echo "  - Static assets: $(du -sh prod/public prod/contents 2>/dev/null | awk '{sum+=$1} END {print sum "KB"}')"
echo "  - Frontend: $(du -sh prod/dist 2>/dev/null | cut -f1)"
echo "  - App code: $(du -sh prod/app 2>/dev/null | cut -f1)"
echo "  - Database: $(du -sh prod/database 2>/dev/null | cut -f1)"
echo "  - Scripts: $(du -sh prod/scripts 2>/dev/null | cut -f1)"
echo "  - Dependencies: $(du -sh prod/node_modules 2>/dev/null | cut -f1)"
