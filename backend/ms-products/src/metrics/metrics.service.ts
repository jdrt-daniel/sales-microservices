import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, register } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  onModuleInit(): void {
    collectDefaultMetrics({ register });
  }

  getMetrics(): Promise<string> {
    return register.metrics();
  }
}