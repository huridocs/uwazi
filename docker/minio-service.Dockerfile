# Tiny CI-only MinIO service image.
#
# MinIO removed its public images from Docker Hub (Sept 2026) and Quay pulls
# now fail anonymously, so we build the server from the official release
# binary instead of FROM a public registry image.
#
# GitHub Actions service containers cannot override the container command,
# so the server command is baked into this dedicated wrapper image used
# only as a CI service.
#
# To bump MinIO, update the pinned RELEASE below. Listings at:
#   https://dl.min.io/aistor/minio/release/linux-amd64/
FROM debian:bookworm-slim

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL -o /usr/local/bin/minio \
       https://dl.min.io/aistor/minio/release/linux-amd64/minio.RELEASE.2026-09-19T17-05-25Z \
    && chmod +x /usr/local/bin/minio

RUN mkdir -p /data

CMD ["minio", "server", "/data", "--console-address", ":9001"]
