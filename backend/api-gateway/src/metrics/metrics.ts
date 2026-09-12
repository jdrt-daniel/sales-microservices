import { Counter, Histogram } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Peticiones HTTP por método, ruta y estado (api-gateway)',
  labelNames: ['method', 'path', 'status'],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos (api-gateway)',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export function recordHttpRequest(
  labels: { method: string; path: string; status: string },
  seconds: number,
): void {
  httpRequestsTotal.inc(labels);
  httpRequestDurationSeconds.observe(labels, seconds);
}