# Uwazi images: CI test runner, backend and queue worker
# Single source of truth for dockerized Uwazi builds.

FROM node:22.23.2-bookworm-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

# Common build tooling shared by deps -> ci and deps -> builder.
# python3/make/g++ are required for node-gyp native modules.
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       git \
       python3 \
       make \
       g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app


FROM base AS deps

# Install dependencies first to cache this layer independently of source changes.
COPY package.json yarn.lock .yarnrc.yml ./
COPY patches ./patches

RUN yarn install --immutable


# Unit-test image: source + dev dependencies + client tooling only.
# Stateful services (Mongo, Elasticsearch, Redis, Postgres, MinIO) run as
# GitHub Actions service containers, not inside this image.
FROM deps AS ci

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       gnupg \
       poppler-utils \
       socat \
    && rm -rf /var/lib/apt/lists/*

# mongosh client only, used to initialize the Mongo replica set on the mongo service.
RUN curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    && echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" > /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update -qq \
    && apt-get install -y --no-install-recommends \
       mongodb-mongosh \
    && rm -rf /var/lib/apt/lists/*

# Full ICU data for consistent Intl/Luxon locale formatting in tests.
RUN npm install -g full-icu \
    && npm cache clean --force
ENV NODE_ICU_DATA=/usr/local/lib/node_modules/full-icu

# Copy source after dependencies so code changes don't invalidate the deps layer.
COPY . .


# Production build: compiled backend/frontend + production-only node_modules in /app/prod.
FROM deps AS builder

COPY . .

# build.sh expects ./prod to already exist before it runs `rm -rf ./prod/*`.
RUN mkdir -p prod

RUN yarn production-build


# Minimal runtime shared by backend and queue-worker.
FROM node:22.23.2-bookworm-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production

# poppler-utils provides pdftotext, required by Uwazi PDF processing.
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Full ICU data for consistent Intl/Luxon locale formatting in production.
RUN npm install -g full-icu \
    && npm cache clean --force
ENV NODE_ICU_DATA=/usr/local/lib/node_modules/full-icu

RUN groupadd -r uwazi \
    && useradd -r -g uwazi -m -s /usr/sbin/nologin uwazi

WORKDIR /app

COPY --from=builder --chown=uwazi:uwazi /app/prod /app

RUN mkdir -p uploaded_documents temporal_files custom_uploads log \
    && chown -R uwazi:uwazi uploaded_documents temporal_files custom_uploads log

USER uwazi


# Backend API server. No hard-coded ENTRYPOINT so the command/entrypoint can be
# overridden to run the legacy worker, migrations, CLI or a custom entrypoint.
FROM runtime AS backend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/version').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "--no-experimental-fetch", "server.js"]


# Standalone queue worker.
FROM runtime AS queue-worker

CMD ["node", "--no-experimental-fetch", "app/queueWorker.js"]
