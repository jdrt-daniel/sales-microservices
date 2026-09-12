export interface AccessLogPayload {
  timestamp?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}