#!/usr/bin/env bash
set -euo pipefail
shopt -s inherit_errexit

export NODE_ENV=production

SCRIPTPATH="$(cd "$(dirname "$0")" >/dev/null 2>&1; pwd -P)"
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
yarn babel -D -d prod/app --extensions .js,.ts,.tsx --ignore ./**/specs/* app
APP_TIME=$(($(date +%s) - APP_START))
echo "  ✅ Backend API and shared code compiled in ${APP_TIME}s"

echo "🎨 Step 3: Building frontend assets..."
FRONTEND_START=$(date +%s)
yarn webpack --config ./webpack.production.config.js --progress=profile --color "$@"
FRONTEND_TIME=$(($(date +%s) - FRONTEND_START))
echo "  ✅ Frontend assets built in ${FRONTEND_TIME}s"

echo "🗄️  Step 4: Compiling database & scripts..."
DB_START=$(date +%s)
yarn babel -D -d prod/database --extensions .js,.ts,.tsx database
yarn babel -D -d prod/scripts --extensions .js,.ts,.tsx scripts
yarn babel -D -d prod/ message.js
DB_TIME=$(($(date +%s) - DB_START))
echo "  ✅ Database & scripts compiled in ${DB_TIME}s"

echo "📦 Step 5: Installing production dependencies..."
DEPS_START=$(date +%s)
yarn install --production=true --modules-folder=./prod/node_modules
DEPS_TIME=$(($(date +%s) - DEPS_START))
echo "  ✅ Production dependencies installed in ${DEPS_TIME}s"

echo "🖥️  Step 6: Copying server files..."
SERVER_FILES_START=$(date +%s)
cp ./prod/app/server.js ./prod/server.js
cp ./package.json ./prod/package.json
SERVER_FILES_TIME=$(($(date +%s) - SERVER_FILES_START))
echo "  ✅ Server files copied in ${SERVER_FILES_TIME}s"

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
