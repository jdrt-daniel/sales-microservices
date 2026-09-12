import { Counter, Histogram } from 'prom-client';
import { NextFunction, Request, Response } from 'express';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Peticiones HTTP por método, ruta y estado',
  labelNames: ['method', 'path', 'status'],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/metrics') return next();
  const start = process.hrtime();
  res.on('finish', () => {
    const path = req.route?.path ?? req.path;
    const labels = { method: req.method, path, status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    const diff = process.hrtime(start);
    httpRequestDurationSeconds.observe(labels, diff[0] + diff[1] / 1e9);
  });
  next();
}