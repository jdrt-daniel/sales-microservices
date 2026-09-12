import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLog } from './entities/request-log.entity';
import { AccessLogPayload } from './dto/access-log.dto';
import {
  logsReceivedTotal,
  logsPersistedTotal,
  logsLokiPushFailuresTotal,
} from '../metrics/business-metrics';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    @InjectRepository(RequestLog)
    private readonly repo: Repository<RequestLog>,
    private readonly config: ConfigService,
  ) {}

  async save(payload: AccessLogPayload): Promise<void> {
    logsReceivedTotal.inc();

    // Push a Loki en paralelo (no bloquea la persistencia).
    void this.pushToLoki(payload);

    try {
      const entry = this.repo.create({
        timestamp: payload.timestamp
          ? new Date(payload.timestamp)
          : new Date(),
        method: payload.method,
        path: payload.path,
        statusCode: payload.statusCode,
        durationMs: payload.durationMs,
        userId: payload.userId ?? null,
        email: payload.email ?? null,
        ip: payload.ip ?? null,
        userAgent: payload.userAgent ?? null,
      });
      await this.repo.save(entry);
      logsPersistedTotal.inc();
    } catch (err) {
      this.logger.error(`No se pudo persistir el log: ${err.message}`);
    }
  }

  private async pushToLoki(payload: AccessLogPayload): Promise<void> {
    try {
      const baseUrl = this.config.get<string>('LOKI_URL', 'http://localhost:3100');
      // Loki requiere el timestamp como string de nanosegundos; ms*1e6
      // desborda el entero seguro de JS, por eso se usa BigInt.
      const nanoTs = (
        BigInt(new Date(payload.timestamp ?? Date.now()).getTime()) * 1000000n
      ).toString();
      const stream = {
        streams: [
          {
            stream: {
              service: 'gateway',
              app: 'ecommerce',
              level: payload.statusCode >= 500 ? 'error' : 'info',
            },
            values: [[nanoTs, JSON.stringify(payload)]],
          },
        ],
      };

      const res = await fetch(`${baseUrl}/loki/api/v1/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stream),
      });

      if (!res.ok) {
        logsLokiPushFailuresTotal.inc();
        this.logger.warn(`Loki respondió ${res.status}`);
      }
    } catch (err) {
      logsLokiPushFailuresTotal.inc();
      this.logger.warn(`No se pudo enviar el log a Loki: ${err.message}`);
    }
  }

  findAll(limit = 50, offset = 0): Promise<RequestLog[]> {
    return this.repo.find({
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}