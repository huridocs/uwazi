#!/bin/bash

echo "🧪 Testing Production Sync Process"
echo "================================="

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "cjs-esm" ]; then
    echo "⚠️  Not on cjs-esm branch. Switching..."
    git checkout cjs-esm
fi

# Check git status
echo "Git status:"
git status --short

# Check if there are any uncommitted changes
if ! git status --porcelain | grep -q .; then
    echo "✅ Working directory is clean"
else
    echo "⚠️  Uncommitted changes detected"
    git status --porcelain
fi

# Check what changes are in production
echo "Checking production changes..."
git fetch origin production
PRODUCTION_CHANGES=$(git log --oneline cjs-esm..origin/production 2>/dev/null || echo "")

if [ -z "$PRODUCTION_CHANGES" ]; then
    echo "✅ No new changes in production"
else
    echo "📋 Production changes available:"
    echo "$PRODUCTION_CHANGES"
fi

echo ""
echo "🚀 Ready to run sync! Execute:"
echo "  ./sync-with-production-complete.sh"
