#!/bin/bash

server=${1}
ssh_user=${2}
gh_token=${3}

release_version="$(yarn version | grep version: | cut -d" " -f4)"

tar -czf uwazi.tgz ./prod

GITHUB_TOKEN="$gh_token" gh release create "$release_version"\
  --title "$release_version"\
  --notes "Release notes"\
  --target production\
  uwazi.tgz

# scp uwazi_pre_release.tgz "$ssh_user"@"$server":/home/"$ssh_user"/uwazi-operations/release_builds/uwazi_pre_release.tgz
