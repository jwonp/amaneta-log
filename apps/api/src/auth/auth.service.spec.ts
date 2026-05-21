import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '../../generated/prisma/client.cjs';
import type { PrismaTransactionClient } from '../prisma/prisma.type';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const PASSWORD_FIELD = 'password' as const;
  const testPassword = 'secure-password-123';

  const createService = () => {
    const transactionClient = {
      refreshToken: {
        update: jest.fn(),
      },
    } as unknown as PrismaTransactionClient;
    const prisma = {
      userAuth: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(
        async (
          callback: (tx: PrismaTransactionClient) => Promise<unknown>,
        ): Promise<unknown> => await callback(transactionClient),
      ),
    };
    const userService = {
      saveUser: jest.fn(),
    };
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          PASSWORD_HASH_PEPPER: 'pepper',
          JWT_REFRESH_SECRET: 'refresh-secret',
        };

        return values[key] ?? key;
      }),
      get: jest.fn(),
    };
    const jwt = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
      decode: jest.fn(),
    };
    const service = new AuthService(
      prisma as never,
      userService as never,
      config as never,
      jwt as never,
    );

    return {
      service,
      prisma,
      userService,
      jwt,
    };
  };

  it.each([UserStatus.INACTIVE, UserStatus.BLOCKED, UserStatus.DELETED])(
    'blocks login for %s users',
    async (status) => {
      const { service, prisma } = createService();
      prisma.userAuth.findUnique.mockResolvedValue({
        username: 'user',
        [PASSWORD_FIELD]: 'stubbed-password-hash',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'user',
        name: 'user',
        email: '',
        profileImage: null,
        role: 'USER',
        status,
        provider: 'CREDENTIALS',
        createdAt: new Date('2026-05-18T00:00:00.000Z'),
      });
      jest
        .spyOn(service as never, 'verifyPassword')
        .mockResolvedValue(true as never);

      await expect(service.login('user', testPassword)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    },
  );

  it.each([UserStatus.INACTIVE, UserStatus.BLOCKED, UserStatus.DELETED])(
    'blocks refresh for %s users',
    async (status) => {
      const { service, prisma, jwt } = createService();
      const refreshToken = 'refresh-token';

      jwt.verifyAsync.mockResolvedValue({
        username: 'user',
        provider: 'CREDENTIALS',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'user',
        provider: 'CREDENTIALS',
        role: 'USER',
        status,
      });

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    },
  );

  it('normalizes username consistently during signup', async () => {
    const { service, prisma, userService } = createService();
    const saveUserAuthSpy = jest.spyOn(service, 'saveUserAuth');
    jest
      .spyOn(service as never, 'hashPassword')
      .mockResolvedValue('stubbed-password-hash' as never);
    saveUserAuthSpy.mockResolvedValue({
      id: 1,
      username: 'alice',
      createdAt: new Date('2026-05-18T00:00:00.000Z'),
    });
    userService.saveUser.mockResolvedValue({
      username: 'alice',
      name: 'alice',
      email: '',
      profileImage: null,
      role: 'USER',
      createdAt: new Date('2026-05-18T00:00:00.000Z'),
    });
    prisma.$transaction.mockImplementation(
      async (
        callback: (tx: PrismaTransactionClient) => Promise<unknown>,
      ): Promise<unknown> => await callback({} as PrismaTransactionClient),
    );

    const response = await service.signup('  alice  ', testPassword);

    expect(saveUserAuthSpy).toHaveBeenCalledWith(
      {
        username: 'alice',
        [PASSWORD_FIELD]: 'stubbed-password-hash',
      },
      expect.anything(),
    );
    expect(userService.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'alice',
        name: 'alice',
      }),
      expect.anything(),
    );
    expect(response.username).toBe('alice');
    expect(response.name).toBe('alice');
  });

  it('rejects usernames with unsupported characters during signup', async () => {
    const { service } = createService();

    await expect(
      service.signup('bad username!', testPassword),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
