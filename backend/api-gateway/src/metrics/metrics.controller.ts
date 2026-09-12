import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';
import { MetricsService } from './metrics.service';
import { Public } from '../common/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', register.contentType)
  index(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}