#!/usr/bin/env bash
set -euo pipefail
shopt -s inherit_errexit

export NODE_ENV=production

SCRIPTPATH="$(
	cd "$(dirname "$0")" >/dev/null 2>&1
	pwd -P
)"
cd "$SCRIPTPATH"/../

echo "🚀 Starting optimized build process..."

# Clean production directory
rm -rf ./prod/*
mkdir -p ./prod/{dist,app/{api,shared},database,scripts,log,uploaded_documents,temporal_files,custom_uploads}

# Track build times
START_TIME=$(date +%s)

echo "📁 Step 1: Copying static assets..."
STATIC_START=$(date +%s)
cp -r public ./prod/
cp -R ./contents ./prod/contents
STATIC_TIME=$(($(date +%s) - STATIC_START))
echo "  ✅ Static assets copied in ${STATIC_TIME}s"

echo "⚙️  Step 2: Compiling backend API and shared code..."
APP_START=$(date +%s)
yarn babel -D -d prod/app --extensions .js,.jsx,.ts,.tsx --ignore ./**/specs/* app
APP_TIME=$(($(date +%s) - APP_START))
echo "  ✅ Backend API and shared code compiled in ${APP_TIME}s"

echo "🎨 Step 3: Building frontend assets..."
FRONTEND_START=$(date +%s)
rm -rf node_modules/.cache/webpack
# Use BABEL_ENV=webpack to avoid babel-plugin-ignore-scss which removes CSS imports
BABEL_ENV=webpack yarn webpack --config ./webpack.production.config.js --progress=profile --color "$@"
FRONTEND_TIME=$(($(date +%s) - FRONTEND_START))
echo "  ✅ Frontend assets built in ${FRONTEND_TIME}s"

echo "🔍 Step 3.5: Verifying build..."
MAIN_CSS_BYTES=$(find ./prod/dist -name 'main.*.css' -exec wc -c {} + 2>/dev/null | awk '{print $1}')
if [ -z "$MAIN_CSS_BYTES" ] || [ "$MAIN_CSS_BYTES" -lt 100000 ]; then
	echo "❌ main.css is missing or too small ($((MAIN_CSS_BYTES / 1024))KB). CSS bundling may be broken."
	exit 1
fi
echo "  ✅ main.css size check passed ($((MAIN_CSS_BYTES / 1024))KB)"

echo "🗄️  Step 4: Compiling database & scripts..."
DB_START=$(date +%s)
yarn babel -D -d prod/database --extensions .js,.ts,.tsx database
yarn babel -D -d prod/scripts --extensions .js,.ts,.tsx scripts
yarn babel -D -d prod/ message.js
DB_TIME=$(($(date +%s) - DB_START))
echo "  ✅ Database & scripts compiled in ${DB_TIME}s"

echo "🔧 Step 4.5: Fixing FontAwesome imports for ESM (removing .js to use export map)..."
FIX_START=$(date +%s)
find prod/app -name "library.js" -type f -exec sed -i "s|'@fortawesome/\([^/]*\)/\([^']*\)\.js'|'@fortawesome/\1/\2'|g" {} \;
FIX_TIME=$(($(date +%s) - FIX_START))
echo "  ✅ FontAwesome imports fixed in ${FIX_TIME}s"

echo "📦 Step 5: Installing production dependencies..."
DEPS_START=$(date +%s)
cp package.json prod/
cp yarn.lock prod/
cp .yarnrc.yml prod/
(cd prod && yarn install --immutable) || {
	echo "❌ yarn install failed. Production dependencies may be incomplete."
	exit 1
}
echo "🔧 Step 5.5: Adding exports to FontAwesome packages for ESM..."
EXPORTS_START=$(date +%s)
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
EXPORTS_TIME=$(($(date +%s) - EXPORTS_START))
echo "  ✅ FontAwesome exports added in ${EXPORTS_TIME}s"
(cd prod && yarn workspaces focus -A --production) || {
	(cd prod && npm prune --omit=dev --legacy-peer-deps) || exit 1
}
DEPS_TIME=$(($(date +%s) - DEPS_START))
echo "  ✅ Production dependencies installed in ${DEPS_TIME}s"

echo "🖥️  Step 6: Copying server files..."
SERVER_FILES_START=$(date +%s)
cp ./server.js ./prod/server.js
cp ./package.json ./prod/package.json
sed -i 's|prod/server\.js|./server.js|' ./prod/package.json
SERVER_FILES_TIME=$(($(date +%s) - SERVER_FILES_START))
echo " ✅ Server files copied in ${SERVER_FILES_TIME}s"

TOTAL_TIME=$(($(date +%s) - START_TIME))

echo ""
echo "✅ Build completed successfully!"
echo "📊 Build timing summary:"
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
