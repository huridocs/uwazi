#!/usr/bin/env bash
set -euo pipefail

# Check for required dependencies
check_dependency() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: $1 is not installed. Please install it first."
        exit 1
    fi
}

# Check if gh is logged in
check_gh_auth() {
    if ! gh auth status >/dev/null 2>&1; then
        echo "Error: gh is not logged in. Please run 'gh auth login' first."
        exit 1
    fi
}

# Check all required dependencies
echo "Checking required dependencies..."
check_dependency "gh"
check_dependency "node"
check_dependency "npm"
check_gh_auth
echo "All dependencies are installed and configured."

# Get the directory where the script is located and go up one level
uwazi_path="$(dirname "$(realpath "$0")")/.."

echo "Squashing PR to production and deleting PR branch..."
cd "$uwazi_path" || exit

gh pr merge --squash --delete-branch
echo "Bump version production..."
git checkout production
git pull origin production
npm --no-git-tag-version version patch
git add package.json
git commit -m"Bump version"
git push origin production

echo "Back merging to staging..."
git checkout staging
git pull origin staging
current_staging_version=$(node -p "require('./package.json').version")
git merge origin/production || true

numberOfConflicts=$(git diff --name-only --diff-filter=U --relative | wc -l)
packageJsonConflict=$(git diff --name-only --diff-filter=U --relative | grep "package.json")

if [ "$numberOfConflicts" -eq 1 ] && [ "$packageJsonConflict" ]
then
    echo "correct"
    git merge --abort
    git merge -X ours origin/production
    version=$current_staging_version sed -i -r 's/(.*)("version")(:\s+)(.*)/echo "\1\\"\2\\"\3\\"$version\\","/ge' package.json
    sed -r -i 's/(.*)("version")(:\s+)(.*-rc)([0-9]+)/echo "\1\\"\2\\"\3\\"\4$((\5+1))\\""/ge' package.json | head
    grep version package.json
    git add package.json
    git commit -m"Merge back from production and Bump rc version"
    git push origin staging
else
    echo "there is something unexpected With the staging back merge"
    exit 1
fi

echo "Back merging to development..."
git checkout development
git pull origin development
git merge origin/staging

numberOfConflicts=$(git diff --name-only --diff-filter=U --relative | wc -l)

if [ "$numberOfConflicts" -eq 0 ]
then
    echo "correct"
    git push origin development
    gh run watch $(gh run list --branch staging --json databaseId,name,startedAt --jq '[.[] | select(.name == "Deploy staging")] | first | .databaseId')
    gh run watch $(gh run list --branch production --json databaseId,name,startedAt --jq '[.[] | select(.name == "Deploy production")] | first | .databaseId')
else
    echo "there is something unexpected With the development back merge"
    exit 1
fi
