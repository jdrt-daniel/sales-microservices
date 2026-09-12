import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MicroserviceHealthIndicator } from './microservice-health.indicator';

@Module({
  imports: [TerminusModule, ConfigModule],
  controllers: [HealthController],
  providers: [MicroserviceHealthIndicator],
  exports: [MicroserviceHealthIndicator],
})
export class HealthModule {}
