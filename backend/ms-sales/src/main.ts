import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  // ms-sales no expone gRPC propio: solo consume el de ms-products y ms-users.
  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`[ms-sales] HTTP en http://localhost:${port}`);
}
bootstrap();
