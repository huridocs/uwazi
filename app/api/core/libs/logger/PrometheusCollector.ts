import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

const registry = new Registry();

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  registers: [registry],

  // Whenever changing the labels, be sure to really think about the cardinality of the metrics.
  // High cardinality can lead to performance issues in Prometheus and Client-server.
  // Methods [10] * Status Codes [10] * Endpoints [application dependent, needs to be normalized!]
  labelNames: ['method', 'status_code', 'route', 'env'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  registers: [registry],
  labelNames: ['method', 'route', 'env'],

  // 10ms: fast API endpoints (version, health)
  // 50ms-250ms: typical API calls, small queries
  // 500ms-1s: SSR rendering, heavier queries
  // 2.5s-10s: bulk operations, aggregations
  // 30s-60s: exports, large file operations
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
});

const apiVersionInfo = new Gauge({
  name: 'api_version_info',
  help: 'Current API version',
  labelNames: ['version'],
  registers: [registry],
});

const collectNodeProcessMetrics = () => collectDefaultMetrics({ register: registry });

export {
  registry,
  httpRequestTotal,
  httpRequestDuration,
  apiVersionInfo,
  collectNodeProcessMetrics,
};
