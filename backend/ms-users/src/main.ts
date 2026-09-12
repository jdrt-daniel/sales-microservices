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

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: join(process.cwd(), 'proto/users.proto'),
      url: process.env.GRPC_URL ?? '0.0.0.0:5001',
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`[ms-users] HTTP en http://localhost:${port}`);
  console.log(`[ms-users] gRPC en ${process.env.GRPC_URL ?? '0.0.0.0:5001'}`);
}
bootstrap();
