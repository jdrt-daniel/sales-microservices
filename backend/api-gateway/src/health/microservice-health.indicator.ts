import { Injectable } from '@nestjs/common';
import { HttpHealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicroserviceHealthIndicator {
  constructor(
    private readonly http: HttpHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  async isHealthy(key: string, url: string): Promise<HealthIndicatorResult> {
    return this.http.pingCheck(key, `${url}/health`, { timeout: 3000 });
  }

  getServiceUrl(service: string): string {
    return (
      this.config.get<string>(`MS_${service}_URL`) ??
      `http://localhost:${service === 'USERS' ? '3001' : service === 'PRODUCTS' ? '3002' : '3003'}`
    );
  }
}