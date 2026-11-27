#!/usr/bin/env bash
set -euo pipefail

# server=${1}
# ssh_user=${2}
gh_token=${3}

release_version="$(node -p "require('./package.json').version")"
previous_tag="$(git tag -l | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n1)"
release_notes="$(git log --oneline "$previous_tag".. | grep -v Merge | grep "(.*)" | cut -d" " -f2- | awk '{print "* " $0}')"

repo="${GITHUB_REPOSITORY:-huridocs/uwazi}"

cat > pre_release_notes.txt <<EOF
## What's changed

$release_notes

**Full Changelog**: https://github.com/$repo/compare/$previous_tag...$release_version

## Docker image

- \`ghcr.io/$repo:$release_version\`
EOF

GITHUB_TOKEN="$gh_token" gh release create "$release_version" \
  --title "$release_version" \
  --notes-file pre_release_notes.txt \
  --prerelease \
  --target production
