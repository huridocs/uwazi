# Tiny CI-only MinIO service image.
#
# MinIO removed its public images from Docker Hub (Sept 2026), Quay anonymous
# pulls now fail, and the current AIStor binary on dl.min.io requires a
# license (running unlicensed denies all S3 operations). So we build the server
# from the last open-source AGPL release binary still published on GitHub.
#
# GitHub Actions service containers cannot override the container command,
# so the server command is baked into this dedicated wrapper image used
# only as a CI service.
FROM debian:bookworm-slim

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
    && rm -rf /var/lib/apt/lists/*

# RELEASE.2025-09-07T16-13-09Z is the last release whose GitHub assets include
# a plain linux-amd64 server binary; later releases ship no assets.
RUN curl -fsSL -o /usr/local/bin/minio \
       https://github.com/minio/minio/releases/download/RELEASE.2025-09-07T16-13-09Z/minio.linux-amd64.RELEASE.2025-09-07T16-13-09Z \
    && chmod +x /usr/local/bin/minio

RUN mkdir -p /data

CMD ["minio", "server", "/data", "--console-address", ":9001"]
