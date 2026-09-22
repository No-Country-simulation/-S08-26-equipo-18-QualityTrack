import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    app.enableShutdownHooks();

  // Sin credenciales: la sesión viaja en la cabecera Authorization, no en cookies.
  app.enableCors({ origin: parseCorsOrigins(process.env.CORS_ORIGINS) });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
