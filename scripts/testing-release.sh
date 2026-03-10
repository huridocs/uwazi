#!/bin/bash

# server=${1}
# ssh_user=${2}
gh_token=${3}

release_version="$(yarn version | grep version: | cut -d" " -f4 | cut -d"-" -f1)-testing$(date +%s)"
# previous_tag="$(git tag -l --sort=committerdate | grep "\-rc" | tail -n1)"
# release_notes="$(git log --oneline "$previous_tag".. | grep -v Merge | grep "(.*)" | cut -d" " -f2- |  awk '{print "* " $0}')"

# echo -e "## What's changed\n\n$release_notes\n\n**Full Changelog**: https://github.com/huridocs/uwazi/compare/$previous_tag...$release_version" > release_notes.txt


new_version=$release_version sed -i -r 's/(.*)("version")(:\s+)(.*)/echo "\1\\"\2\\"\3\\"$new_version\\","/ge' ./prod/package.json
tar -czf uwazi_testing_release.tgz ./prod

  # --notes-file release_notes.txt\

GITHUB_TOKEN="$gh_token" gh release create "$release_version"\
  --title "Testing $release_version"\
  --prerelease\
  --target testing\
  uwazi_testing_release.tgz

# scp uwazi_pre_release.tgz "$ssh_user"@"$server":/home/"$ssh_user"/uwazi-operations/release_builds/uwazi_pre_release.tgz
