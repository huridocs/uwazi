# Uwazi CI runner image: Node + poppler-utils + mongosh
# Base on Debian Bookworm and install official MongoDB mongosh
FROM node:20-bookworm AS ci

# Install poppler-utils and dependencies
RUN apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       gnupg \
       poppler-utils \
       socat \
       xvfb \
       libgtk-3-0 \
       libgbm1 \
       libnss3 \
       libxss1 \
       libasound2 \
       libxtst6 \
       xauth \
       libx11-xcb1 \
       libxcomposite1 \
       libxrandr2 \
       libxi6 \
       libatk1.0-0 \
       libatk-bridge2.0-0 \
       libcairo2 \
       libcups2 \
       libdrm2 \
       libxdamage1 \
       libxshmfence1 \
       libpango-1.0-0 \
       libpangocairo-1.0-0 \
       fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome Stable
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
    && chmod a+r /etc/apt/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install mongosh and database tools (mongorestore, etc.) from the official MongoDB apt repository for Debian 12 (bookworm)
RUN curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" > /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends mongodb-mongosh mongodb-database-tools \
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

# MongoDB 7 single-node replica set image (build target: mongo7-rs)
FROM mongo:7.0 AS mongo7-rs
EXPOSE 27017
CMD ["mongod", "--replSet", "uwazi_replica_set", "--bind_ip_all"]
