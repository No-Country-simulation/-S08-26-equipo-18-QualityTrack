import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
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

  const openApiConfig = new DocumentBuilder()
    .setTitle('QualityTrack API')
    .setDescription('API de trazabilidad de trabajos de QualityTrack.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  // Montadas sobre Express, fuera del router de Nest: el guard global no las alcanza,
  // y la documentación queda abierta por decisión del usuario.
  app.use('/openapi.json', (_req: unknown, res: { json: (body: unknown) => void }) =>
    res.json(openApiDocument),
  );
  app.use('/docs', apiReference({ content: openApiDocument }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
