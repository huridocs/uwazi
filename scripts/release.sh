#!/bin/bash

# server=${1}
# ssh_user=${2}
gh_token=${3}

release_version="$(yarn version | grep version: | cut -d" " -f4)"
previous_tag="$(git describe --tags "$(git rev-list --tags --max-count=10)" | grep -v "\-rc" | head -n1)"
release_notes="$(git log --oneline "$previous_tag".. | grep -v Merge | grep "(.*)" | cut -d" " -f2- |  awk '{print "* " $0}')"

tar -czf uwazi.tgz ./prod

GITHUB_TOKEN="$gh_token" gh release create "$release_version"\
  --title "$release_version"\
  --notes "## What's changed\n\n$release_notes\n\n**Full Changelog**: https://github.com/huridocs/uwazi/compare/$previous_tag...$release_version"\
  --target production\
  uwazi.tgz

# scp uwazi_pre_release.tgz "$ssh_user"@"$server":/home/"$ssh_user"/uwazi-operations/release_builds/uwazi_pre_release.tgz
