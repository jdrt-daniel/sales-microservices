import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { Public } from '../common/public.decorator';
import { MicroserviceHealthIndicator } from './microservice-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly microserviceHealth: MicroserviceHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        this.microserviceHealth.isHealthy(
          'ms-users',
          this.microserviceHealth.getServiceUrl('USERS'),
        ),
      () =>
        this.microserviceHealth.isHealthy(
          'ms-products',
          this.microserviceHealth.getServiceUrl('PRODUCTS'),
        ),
      () =>
        this.microserviceHealth.isHealthy(
          'ms-sales',
          this.microserviceHealth.getServiceUrl('SALES'),
        ),
    ]);
  }
}
