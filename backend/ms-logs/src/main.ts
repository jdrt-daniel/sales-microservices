import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { httpMetricsMiddleware } from './common/http-metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(httpMetricsMiddleware);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: config.get<string>('KAFKA_CLIENT_ID', 'ms-logs'),
        brokers: [config.get<string>('KAFKA_BROKER', 'localhost:9094')],
      },
      consumer: {
        groupId: config.get<string>('KAFKA_CONSUMER_GROUP', 'ms-logs-consumer'),
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  await app.startAllMicroservices();

  const port = config.get<string>('PORT', '3004');
  await app.listen(port);
  console.log(`[ms-logs] HTTP en http://localhost:${port}`);
  console.log('[ms-logs] Consumiendo tópico gateway.access.logs');
}
bootstrap();