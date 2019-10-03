#!/usr/bin/env bash
set -euox pipefail

docker build -t uwazi-devshell -f Dockerfile-devshell .

docker run --rm -it --hostname uwazi-dev uwazi-devshell \
#  --mount=type=bind,source=$PWD,destination=/home/uwazi,z
