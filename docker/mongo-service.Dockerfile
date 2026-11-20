# Tiny CI-only MongoDB service image.
#
# mongo:7.0's default CMD is just `mongod` (no replica set). Uwazi's tests
# require a replica set, and GitHub Actions service containers cannot override
# the container command, so the mongod args are baked into this dedicated
# wrapper image used only as a CI service.
FROM mongo:7.0

CMD ["mongod", "--replSet", "uwazi_replica_set", "--bind_ip_all"]
