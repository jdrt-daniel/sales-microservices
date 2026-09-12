import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { recordHttpRequest } from '../metrics/metrics';

const ACCESS_LOG_TOPIC = 'gateway.access.logs';

// Rutas que no se registran en la BD ni en métricas (swagger, health y scrape)
const SKIP_PATHS = ['/docs', '/docs-json', '/health', '/metrics'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly kafka: KafkaProducerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(method, url, start, context, req, false, undefined),
        error: (err) => this.log(method, url, start, context, req, true, err),
      }),
    );
  }

  private log(
    method: string,
    url: string,
    start: number,
    context: ExecutionContext,
    req: Request,
    errored: boolean,
    err: unknown,
  ) {
    const skip = SKIP_PATHS.some((p) => url.startsWith(p));
    if (skip) return;

    const durationMs = Date.now() - start;
    const res = context.switchToHttp().getResponse<Response>();
    // Status real: en excepciones se toma del HttpException; si no, el ya fijado.
    const statusCode = errored
      ? err instanceof HttpException
        ? err.getStatus()
        : 500
      : res.statusCode;
    const routePath = (req as any).route?.path ?? (req as any).path;

    this.logger.log(`${method} ${url} ${durationMs}ms status:${statusCode} user:${(req as any).user?.userId || 'anonymous'}`);

    // Métricas Prometheus (mismo conteo que el log, con ruta del route para cardinalidad controlada)
    recordHttpRequest(
      { method, path: routePath, status: String(statusCode) },
      durationMs / 1000,
    );

    // Emisión asíncrona (no bloquea el request; si Kafka falla se loguea interno).
    void this.kafka.emit(
      ACCESS_LOG_TOPIC,
      (req as any).user?.userId ?? 'anonymous',
      {
        timestamp: new Date().toISOString(),
        method,
        path: (req as any).originalUrl || url,
        statusCode,
        durationMs,
        userId: (req as any).user?.userId ?? null,
        email: (req as any).user?.email ?? null,
        ip: (req as any).ip ?? null,
        userAgent: (req as any).headers?.['user-agent'] ?? null,
      },
    );
  }
}