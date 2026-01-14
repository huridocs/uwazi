# Uwazi CI runner image: Node + poppler-utils + mongosh
# Base on Debian Bookworm and install official MongoDB mongosh
FROM node:20-bookworm AS ci

# Install essential utilities (poppler-utils for PDF processing)
RUN apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       gnupg \
       poppler-utils \
       socat \
    && rm -rf /var/lib/apt/lists/*

# Install MongoDB server, mongosh and database tools from the official MongoDB apt repository for Debian 12 (bookworm)
RUN curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" > /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends mongodb-org mongodb-mongosh mongodb-database-tools \
    && rm -rf /var/lib/apt/lists/*

# Add MinIO server binary (pinned release)
RUN curl -fsSL -o /usr/local/bin/minio https://dl.min.io/server/minio/release/linux-amd64/archive/minio.RELEASE.2025-09-07T16-13-09Z \
    && chmod +x /usr/local/bin/minio

# Non-root workspace
WORKDIR /workspace

# Provide full ICU data so Intl/Luxon locale formatting is consistent
RUN npm i -g full-icu
ENV NODE_ICU_DATA=/usr/local/lib/node_modules/full-icu

# Make dotenv available at runtime without installing node_modules in jobs
RUN npm i -g dotenv@16.4.7 \
    && echo "Global node_modules: $(npm root -g)"
ENV NODE_PATH=/usr/local/lib/node_modules

# Install Yarn classic for running installs inside the container
RUN npm i -g yarn@1.22.22 --force \
    && yarn --version

# Create startup script for MongoDB with replica set (available for manual use)
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting MongoDB with replica set..."\n\
\n\
# Create data directory\n\
mkdir -p /tmp/mongodb-data\n\
\n\
# Start MongoDB with replica set\n\
mongod --dbpath /tmp/mongodb-data --replSet uwazi_replica_set --bind_ip_all --port 27017 --fork --logpath /tmp/mongod.log\n\
\n\
# Wait for MongoDB to start\n\
echo "Waiting for MongoDB to start..."\n\
for i in {1..30}; do\n\
  if mongosh --host localhost --port 27017 --quiet --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; then\n\
    echo "MongoDB is up"; break\n\
  fi\n\
  echo "Waiting for MongoDB to start... (attempt $i/30)"\n\
  sleep 2\n\
done\n\
\n\
# Initialize replica set if not already initialized\n\
echo "Initializing replica set..."\n\
mongosh --host localhost --port 27017 --quiet --eval "try { rs.status() } catch(e) { rs.initiate({_id: \"uwazi_replica_set\", members: [{_id: 0, host: \"localhost:27017\"}]}) }"\n\
\n\
# Wait for replica set to be ready\n\
echo "Waiting for replica set to be ready..."\n\
for i in {1..60}; do\n\
  if mongosh --host localhost --port 27017 --quiet --eval "try { rs.status().myState } catch (e) { print(0) }" | tail -n 1 | grep -q "1"; then\n\
    echo "Mongo replica set is PRIMARY and ready"; break\n\
  fi\n\
  echo "Waiting for Mongo replica set... (attempt $i/60)"\n\
  sleep 2\n\
done\n\
\n\
echo "MongoDB replica set setup complete!"' > /usr/local/bin/setup-mongo-replica.sh \
    && chmod +x /usr/local/bin/setup-mongo-replica.sh

