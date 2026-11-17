# Tiny CI-only MinIO service image.
#
# minio/minio's default CMD is just `minio`, which prints help and exits.
# GitHub Actions service containers cannot override the container command,
# so the server command is baked into this dedicated wrapper image used
# only as a CI service.
FROM minio/minio:latest

CMD ["minio", "server", "/data", "--console-address", ":9001"]
