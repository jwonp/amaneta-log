import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { Server } from 'node:http';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppThrottlerGuard } from '../security/app-throttler.guard';

describe('AuthController security', () => {
  const testPassword = 'secure-password-123';

  let app: INestApplication;
  let httpServer: Server;
  const authService = {
    signup: jest.fn().mockResolvedValue({ username: 'alice' }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      accessTokenExpiresAt: new Date().toISOString(),
      user: {
        username: 'alice',
      },
    }),
    refresh: jest.fn().mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh',
      accessTokenExpiresAt: new Date().toISOString(),
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
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: APP_GUARD,
          useClass: AppThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 400 for invalid usernames', async () => {
    await request(httpServer)
      .post('/auth/signup')
      .send({
        username: 'x',
        password: testPassword,
      })
      .expect(400);

    expect(authService.signup).not.toHaveBeenCalled();
  });

  it('rate-limits repeated login attempts by ip and username', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(httpServer)
        .post('/auth/login')
        .send({
          username: 'alice',
          password: testPassword,
        })
        .expect(200);
    }

    await request(httpServer)
      .post('/auth/login')
      .send({
        username: 'alice',
        password: testPassword,
      })
      .expect(429);
  });
});
