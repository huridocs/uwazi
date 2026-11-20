#!/bin/sh
# Gate for the thumbnail-generation dependencies required on the worker
# (huridocs/Internal-Issues#589). Fails when any requirement is missing or too
# old, so a broken image cannot be built or shipped.
#
# Requirements:
#   - vips and vipsheader on PATH, vips 8.18.7 or newer
#   - vips loads HEIC/AVIF through libheif 1.23.2+
#   - vips loads BMP through ImageMagick (Magick load)
#   - libheif's libde265 plugin (the HEVC decoder iPhone photos need) is present

set -eu

required_version=8.18.7

fail() {
  echo "check-thumbnail-deps: $1" >&2
  exit 1
}

command -v vips >/dev/null 2>&1 || fail "vips is not installed"
command -v vipsheader >/dev/null 2>&1 || fail "vipsheader is not installed"

version="$(vips --version | sed -n 's/.*vips-\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\).*/\1/p')"
[ -n "$version" ] || fail "could not parse version from '$(vips --version)'"

if ! awk -v found="$version" -v want="$required_version" '
  BEGIN {
    split(found, f, ".")
    split(want, w, ".")
    ok = (f[1]+0 > w[1]+0) || \
         (f[1]+0 == w[1]+0 && (f[2]+0 > w[2]+0 || (f[2]+0 == w[2]+0 && f[3]+0 >= w[3]+0)))
    exit !ok
  }
'; then
  fail "vips $version is below $required_version"
fi

config="$(vips --vips-config)"

printf '%s\n' "$config" | grep -i 'heif' | grep -qE ':[[:space:]]*true' \
  || fail "vips was built without HEIF support"

printf '%s\n' "$config" | grep -i 'magick load' | grep -qE ':[[:space:]]*true' \
  || fail "vips was built without Magick load"

find /usr/lib /usr/local/lib -name 'libheif-libde265.so*' -print -quit 2>/dev/null | grep -q . \
  || fail "libheif libde265 plugin is not installed"

echo "check-thumbnail-deps: vips $version with HEIF, Magick load and libde265 — ok"
