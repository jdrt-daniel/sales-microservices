import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosError, RawAxiosRequestHeaders } from 'axios';
import { CircuitBreakerService } from './circuit-breaker.service';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  private getMicroserviceUrl(service: string): string {
    const url = this.config.get<string>(`MS_${service}_URL`);
    if (!url) {
      throw new NotFoundException(`Microservicio ${service} no configurado`);
    }
    return url;
  }

  private getRetryConfig(service: string): {
    maxRetries: number;
    baseDelayMs: number;
  } {
    return {
      maxRetries: Number(
        this.config.get<string>(
          `RETRY_MAX_${service}`,
          this.config.get<string>('RETRY_MAX', '3'),
        ),
      ),
      baseDelayMs: Number(
        this.config.get<string>(
          `RETRY_BASE_DELAY_${service}`,
          this.config.get<string>('RETRY_BASE_DELAY', '1000'),
        ),
      ),
    };
  }

  private getTimeout(service: string): number {
    return Number(
      this.config.get<string>(
        `TIMEOUT_${service}`,
        this.config.get<string>('TIMEOUT', '5000'),
      ),
    );
  }

  private isRetriable(error: AxiosError): boolean {
    if (!error.response) return true; // Sin respuesta → error de red/timeout
    return [503, 504].includes(error.response.status);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private sanitizeHeaders(headers: RawAxiosRequestHeaders): RawAxiosRequestHeaders {
    const sanitized = { ...headers };
    delete sanitized.host;
    delete sanitized['content-length'];
    delete sanitized['transfer-encoding'];
    delete sanitized.connection;
    delete sanitized['keep-alive'];
    delete sanitized.te;
    delete sanitized.trailer;
    delete sanitized.upgrade;
    delete sanitized['expect'];
    delete sanitized['proxy-authorization'];
    delete sanitized['proxy-authenticate'];
    return sanitized;
  }

  async forward(
    service: string,
    path: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const baseUrl = this.getMicroserviceUrl(service);
    const url = `${baseUrl}${path}`;
    const breaker = this.circuitBreaker.getBreaker(service);
    const { maxRetries, baseDelayMs } = this.getRetryConfig(service);
    const timeout = this.getTimeout(service);

    const headers = this.sanitizeHeaders({ ...req.headers });
    if (req.user) {
      headers['x-user-id'] = (req.user as any).userId;
      headers['x-user-email'] = (req.user as any).email;
    }

    const { state: preState } = this.circuitBreaker.getStatus(service);
    if (preState === 'open' || preState === 'half-open') {
      this.logger.warn(
        `[${service}] Circuito ${preState} — request rechazado sin intentar (fail fast)`,
      );
      res
        .status(502)
        .json({ message: `Servicio ${service} no disponible en este momento` });
      return;
    }

    try {
      const response = (await breaker.fire(async () => {
        let lastError: AxiosError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          if (attempt > 0) {
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            this.logger.warn(
              `[${service}] Retry ${attempt}/${maxRetries} en ${delay}ms → ${url}`,
            );
            await this.sleep(delay);
          }

          try {
            return await firstValueFrom(
              this.httpService.request({
                method: req.method as any,
                url,
                data: req.body,
                params: req.query,
                headers,
                timeout,
              }),
            );
          } catch (error) {
            lastError = error as AxiosError;
            const lastAttempt = attempt === maxRetries;
            if (!this.isRetriable(lastError) || lastAttempt) {
              throw lastError;
            }
          }
        }
        throw lastError!;
      })) as import('axios').AxiosResponse;

      res.status(response.status).json(response.data);
    } catch (error) {
      const status = error.response?.status || 500;
      const { state } = this.circuitBreaker.getStatus(service);

      if (state === 'open' || state === 'half-open') {
        this.logger.error(
          `[${service}] Circuito ${state} — request rechazado inmediatamente`,
        );
        res.status(502).json({ message: `Servicio ${service} no disponible en este momento` });
        return;
      }

      if (!error.response && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')) {
        this.logger.error(
          `[${service}] No se pudo conectar a ${url}: ${error.message}`,
        );
        res
          .status(502)
          .json({ message: `Servicio ${service} no disponible`, service });
        return;
      }

      const message = error.response?.data || {
        message: 'Error interno del gateway',
      };
      this.logger.error(
        `Proxy error: ${req.method} ${url} → ${status}: ${JSON.stringify(message)}`,
      );

      res.status(status).json(message);
    }
  }
}