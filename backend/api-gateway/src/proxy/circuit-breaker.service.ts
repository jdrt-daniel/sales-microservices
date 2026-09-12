import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker = require('opossum');

interface BreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  volumeThreshold: number;
}

@Injectable()
export class CircuitBreakerService implements OnModuleDestroy {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(private readonly config: ConfigService) {}

  private getOptions(service: string): BreakerOptions {
    return {
      timeout: Number(
        this.config.get<string>(
          `CB_TIMEOUT_${service}`,
          this.config.get<string>('CB_TIMEOUT', '5000'),
        ),
      ),
      errorThresholdPercentage: Number(
        this.config.get<string>(
          `CB_ERROR_THRESHOLD_${service}`,
          this.config.get<string>('CB_ERROR_THRESHOLD', '50'),
        ),
      ),
      resetTimeout: Number(
        this.config.get<string>(
          `CB_RESET_TIMEOUT_${service}`,
          this.config.get<string>('CB_RESET_TIMEOUT', '30000'),
        ),
      ),
      volumeThreshold: 5,
    };
  }

  getBreaker(service: string): CircuitBreaker {
    let breaker = this.breakers.get(service);
    if (breaker) return breaker;

    const options = this.getOptions(service);

    breaker = new CircuitBreaker(
      async (request: () => Promise<any>) => {
        return request();
      },
      {
        timeout: options.timeout,
        errorThresholdPercentage: options.errorThresholdPercentage,
        resetTimeout: options.resetTimeout,
        volumeThreshold: options.volumeThreshold,
        name: `cb-${service}`,
        errorFilter: (err: any) =>
          !err.response || [503, 504].includes(err.response?.status),
      },
    );

    breaker.on('open', () =>
      this.logger.warn(`[${service}] Circuito ABIERTO — fail fast activo`),
    );
    breaker.on('halfOpen', () =>
      this.logger.log(`[${service}] Circuito half-open — probando recuperación`),
    );
    breaker.on('close', () =>
      this.logger.log(`[${service}] Circuito cerrado — servicio recuperado`),
    );
    breaker.on('fallback', () =>
      this.logger.warn(`[${service}] Fallback ejecutado`),
    );

    this.breakers.set(service, breaker);
    return breaker;
  }

  getStatus(service: string): { state: string; stats: any } {
    const breaker = this.breakers.get(service);
    if (!breaker) {
      return { state: 'unknown', stats: null };
    }
    const stats = breaker.stats;
    return {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: {
        failures: stats.failures,
        successes: stats.successes,
        rejects: stats.rejects,
        timeouts: stats.timeouts,
      },
    };
  }

  onModuleDestroy(): void {
    for (const breaker of this.breakers.values()) {
      breaker.shutdown();
    }
    this.breakers.clear();
  }
}