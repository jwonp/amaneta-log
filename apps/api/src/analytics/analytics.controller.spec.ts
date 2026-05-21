import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { Server } from 'node:http';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AppThrottlerGuard } from '../security/app-throttler.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('AnalyticsController rate limiting', () => {
  let app: INestApplication;
  let httpServer: Server;
  const analyticsService = {
    trackEvent: jest.fn().mockResolvedValue({
      accepted: true,
      deduped: false,
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60_000,
            limit: 120,
          },
        ]),
      ],
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: analyticsService,
        },
        {
          provide: APP_GUARD,
          useClass: AppThrottlerGuard,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('rate-limits repeated public analytics writes', async () => {
    const payload = {
      visitorId: 'visitor-1',
      sessionId: 'session-1',
      eventType: 'PAGE_VIEW',
      pageType: 'POST_LIST',
      pagePath: '/posts',
    };

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await request(httpServer)
        .post('/analytics/events')
        .send(payload)
        .expect(201);
    }

    await request(httpServer)
      .post('/analytics/events')
      .send(payload)
      .expect(429);
  });
});
