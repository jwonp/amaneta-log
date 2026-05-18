import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const port = Number.parseInt(config.getOrThrow<string>('API_PORT'), 10);
  const origin = config.getOrThrow<string>('NEXT_PUBLIC_APP_URL');

  app.enableCors({
    origin,
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
