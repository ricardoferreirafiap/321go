import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Prisma models use BigInt IDs; serialize them safely in JSON responses.
const bigIntPrototype = BigInt.prototype as unknown as { toJSON?: () => string };
if (!bigIntPrototype.toJSON) {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value() {
      return this.toString();
    },
    writable: true,
    configurable: true,
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Permite salvar orçamentos com anexos em base64 sem estourar o parser padrão (~100kb).
  app.useBodyParser('json', { limit: '25mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '25mb' });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error('Falha ao iniciar backend:', error);
  process.exit(1);
});
