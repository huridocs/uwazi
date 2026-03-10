#!/bin/bash

# server=${1}
# ssh_user=${2}
gh_token=${3}

release_version="$(yarn version | grep version: | cut -d" " -f4)"
previous_tag="$(git tag -l --sort=committerdate | grep -v "\-rc"| grep -v "\-testing" | tail -n1)"
release_notes="$(git log --oneline "$previous_tag".. | grep -v Merge | grep "(.*)" | cut -d" " -f2- |  awk '{print "* " $0}')"

echo -e "## What's changed\n\n$release_notes\n\n**Full Changelog**: https://github.com/huridocs/uwazi/compare/$previous_tag...$release_version" > release_notes.txt

tar -czf uwazi.tgz ./prod

GITHUB_TOKEN="$gh_token" gh release create "$release_version"\
  --title "$release_version"\
  --notes-file release_notes.txt\
  --target production\
  uwazi.tgz

# scp uwazi_pre_release.tgz "$ssh_user"@"$server":/home/"$ssh_user"/uwazi-operations/release_builds/uwazi_pre_release.tgz
