import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

const registry = new Registry();

const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  registers: [registry],

  // Whenever changing the labels, be sure to really think about the cardinality of the metrics.
  // High cardinality can lead to performance issues in Prometheus and Client-server.
  // Methods [10] * Status Codes [10] * Endpoints [application dependent, needs to be normalized!]
  labelNames: ['method', 'status_code', 'route', 'env', 'port'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  registers: [registry],
  labelNames: ['method', 'route', 'env', 'port'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const collectNodeProcessMetrics = () => collectDefaultMetrics({ register: registry });

export { registry, httpRequestCounter, httpRequestDuration, collectNodeProcessMetrics };
