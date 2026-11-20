# Uwazi images: CI test runner and runtime (backend default, configurable role)
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


# Minimal runtime image. The entrypoint selects the role: backend (default),
# queue worker, or legacy worker — all from this single image.
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


# Single runtime image. Default role is the backend API server; pass
# "queue-worker" (or "legacy-worker") as the first command argument to run a worker,
# or pass any other command (migrations, CLI) to override entirely.
FROM runtime AS backend

COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/uwazi-entrypoint

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["uwazi-entrypoint", "healthcheck"]

ENTRYPOINT ["uwazi-entrypoint"]
CMD ["backend"]
