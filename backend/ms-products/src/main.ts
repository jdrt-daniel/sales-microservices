import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { httpMetricsMiddleware } from './common/http-metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(httpMetricsMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Servidor gRPC embebido, además del HTTP normal (app híbrida)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'products',
      protoPath: join(process.cwd(), 'proto/products.proto'),
      url: process.env.GRPC_URL ?? '0.0.0.0:5002',
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`[ms-products] HTTP en http://localhost:${port}`);
  console.log(`[ms-products] gRPC en ${process.env.GRPC_URL ?? '0.0.0.0:5002'}`);
}
bootstrap();
