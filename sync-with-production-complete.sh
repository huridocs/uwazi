#!/bin/bash

set -euo pipefail

echo "🚀 Complete Production Sync with ESM Migration Preservation"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Step 1: Pre-sync checks
print_step "1. Pre-sync checks"
print_status "Checking current git status..."

if ! git status --porcelain | grep -q .; then
    print_success "Working directory is clean"
else
    print_warning "Uncommitted changes detected:"
    git status --porcelain
    echo ""
    read -p "Do you want to commit these changes first? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "WIP: ESM migration progress before production sync"
        print_success "Changes committed"
    else
        print_error "Please commit or stash changes before syncing"
        exit 1
    fi
fi

# Step 2: Create backup
print_step "2. Creating backup branch"
BACKUP_BRANCH="esm-backup-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BACKUP_BRANCH"
git checkout cjs-esm
print_success "Backup created: $BACKUP_BRANCH"

# Step 3: Fetch production
print_step "3. Fetching production changes"
print_status "Fetching latest production changes..."
git fetch origin production
print_success "Production changes fetched"

# Step 4: Analyze changes
print_step "4. Analyzing production changes"
PRODUCTION_CHANGES=$(git log --oneline cjs-esm..origin/production 2>/dev/null || echo "")
if [ -z "$PRODUCTION_CHANGES" ]; then
    print_success "No new changes in production"
    exit 0
fi

echo "📋 Production changes to merge:"
echo "$PRODUCTION_CHANGES"
echo ""

# Step 5: Attempt merge
print_step "5. Attempting merge with production"
print_status "Attempting to merge with production..."
if git merge origin/production --no-commit; then
    print_success "Merge successful - no conflicts!"
    git commit -m "Merge production with ESM migration"
    print_success "Production sync completed successfully!"
    exit 0
fi

# Step 6: Handle conflicts
print_step "6. Handling merge conflicts"
print_warning "Merge conflicts detected. Analyzing conflicts..."

# Get conflicted files
CONFLICT_FILES=$(git diff --name-only --diff-filter=U)
echo "📋 Files with conflicts:"
echo "$CONFLICT_FILES"
echo ""

# Categorize conflicts
ESM_CONFLICTS=()
PRODUCTION_CONFLICTS=()

while IFS= read -r file; do
    if [[ "$file" =~ (package\.json|tsconfig\.json|webpack|babel|eslint) ]]; then
        ESM_CONFLICTS+=("$file")
    else
        PRODUCTION_CONFLICTS+=("$file")
    fi
done <<< "$CONFLICT_FILES"

echo "📊 Conflict Analysis:"
echo "🔧 ESM-related conflicts: ${#ESM_CONFLICTS[@]}"
echo "📦 Production conflicts: ${#PRODUCTION_CONFLICTS[@]}"
echo ""

# Step 7: Auto-resolve ESM conflicts
if [ ${#ESM_CONFLICTS[@]} -gt 0 ]; then
    print_step "7. Auto-resolving ESM conflicts"
    print_status "Auto-resolving ESM conflicts..."
    echo "🔧 ESM-related conflicts:"
    for file in "${ESM_CONFLICTS[@]}"; do
        echo "  - $file"
    done
    echo ""
    
    # Run our conflict resolution script
    if [ -f "resolve-esm-conflicts.js" ]; then
        node resolve-esm-conflicts.js
        print_success "ESM conflicts auto-resolved"
    else
        print_warning "ESM conflict resolution script not found"
    fi
fi

# Step 8: Handle production conflicts
if [ ${#PRODUCTION_CONFLICTS[@]} -gt 0 ]; then
    print_step "8. Handling production conflicts"
    print_warning "Manual resolution needed for production conflicts:"
    for file in "${PRODUCTION_CONFLICTS[@]}"; do
        echo "  - $file"
    done
    echo ""
    
    print_status "Opening conflict files for manual resolution..."
    for file in "${PRODUCTION_CONFLICTS[@]}"; do
        if [ -f "$file" ]; then
            echo "📝 Please resolve conflicts in: $file"
            # You can add your preferred editor here
            # code "$file"  # VS Code
            # vim "$file"   # Vim
            # nano "$file"  # Nano
        fi
    done
fi

# Step 9: Re-apply ESM conversions
print_step "9. Re-applying ESM conversions"
print_status "Checking if ESM conversions need to be re-applied..."
if [ -f "reapply-esm-conversions.js" ]; then
    echo "🔄 Re-applying ESM conversions to new files..."
    node reapply-esm-conversions.js
    print_success "ESM conversions re-applied"
else
    print_warning "ESM re-application script not found"
fi

# Step 10: Final steps
print_step "10. Final steps"
echo ""
print_status "Conflict resolution steps:"
echo "1. Review and resolve any remaining conflicts"
echo "2. Run: git add <resolved-files>"
echo "3. Run: git commit -m 'Resolve conflicts with ESM migration'"
echo "4. Test the application: FEATURE_FLAG_PARAGRAPH_EXTRACTION=true EXTERNAL_SERVICES=true yarn hot"
echo "5. Continue with ESM migration"
echo ""

# Step 11: Create checkpoint
print_step "11. Creating checkpoint"
read -p "Do you want to create a checkpoint branch? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    CHECKPOINT_BRANCH="esm-checkpoint-$(date +%Y%m%d-%H%M%S)"
    git checkout -b "$CHECKPOINT_BRANCH"
    print_success "Checkpoint created: $CHECKPOINT_BRANCH"
    git checkout cjs-esm
fi

print_success "Production sync process completed!"
print_status "Summary:"
echo "  - Backup branch: $BACKUP_BRANCH"
echo "  - ESM conflicts: ${#ESM_CONFLICTS[@]}"
echo "  - Production conflicts: ${#PRODUCTION_CONFLICTS[@]}"
echo "  - Next: Resolve conflicts and test application"
