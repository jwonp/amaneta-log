import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const port = Number.parseInt(config.getOrThrow<string>('API_PORT'), 10);
  const origin = config.getOrThrow<string>('NEXT_PUBLIC_APP_URL');
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: false,
      frameguard: { action: 'deny' },
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  app.enableCors({
    origin,
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
