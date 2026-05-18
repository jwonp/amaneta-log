import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  User,
  UserAuth,
  UserProvider,
  UserRole,
  UserStatus,
} from '../../generated/prisma/client.cjs';
import { UserService } from '../user/user.service';
import { PrismaTransactionClient } from '../prisma/prisma.type';
import { SaveUserResponse } from '../user/user.dto.type';
import type { AccessTokenPayload, RefreshTokenPayload } from './auth.type';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { AuthTokenResponse, LoginResponse } from './auth.dto.type';

const scrypt = promisify(scryptCallback);
const PASSWORD_HASH_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;
const REFRESH_TOKEN_HASH_ALGORITHM = 'sha256';
type DecodedJwtPayload = {
  exp?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly user: UserService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async signup(username: string, password: string): Promise<SaveUserResponse> {
    const normalizedUsername = username?.trim();

    if (!normalizedUsername || !password) {
      throw new BadRequestException('username and password are required');
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      );
    }

    const passwordHash = await this.hashPassword(password);

    const hashedUserAuthPayload: Pick<UserAuth, 'username' | 'password'> = {
      username: normalizedUsername,
      password: passwordHash,
    };

    const userPayload: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      name: normalizedUsername,
      username: normalizedUsername,
      provider: 'CREDENTIALS',
      email: '',
      profileImage: null,
      role: 'USER',
      status: 'ACTIVE',
    };

    const user = await this.prisma.$transaction(async (tx) => {
      await this.saveUserAuth(hashedUserAuthPayload, tx);

      const user = await this.user.saveUser(userPayload, tx);

      return user;
    });

    const saveUserReponse: SaveUserResponse = {
      username: user.username,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      createdAt: user.createdAt,
    };

    return saveUserReponse;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const normalizedUsername = username?.trim();

    if (!normalizedUsername || !password) {
      throw new BadRequestException('username and password are required');
    }

    const userAuth = await this.prisma.userAuth.findUnique({
      where: {
        username: normalizedUsername,
      },
    });

    if (!userAuth) {
      throw new BadRequestException('invalid username or password');
    }

    const isValidPassword = await this.verifyPassword(
      password,
      userAuth.password,
    );

    if (!isValidPassword) {
      throw new BadRequestException('invalid username or password');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        username_provider: {
          username: normalizedUsername,
          provider: 'CREDENTIALS',
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        status: true,
        provider: true,
        createdAt: true,
      },
    });

    this.assertActiveAuthUser(user);

    const tokens = await this.issueTokens({
      userId: user.id,
      username: user.username,
      provider: user.provider,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    if (!refreshToken?.trim()) {
      throw new BadRequestException('refresh token is required');
    }

    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new BadRequestException('invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        username_provider: {
          username: payload.username,
          provider: payload.provider,
        },
      },
      select: {
        id: true,
        username: true,
        provider: true,
        role: true,
        status: true,
      },
    });

    this.assertActiveRefreshUser(user);

    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();
    const storedRefreshToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash: refreshTokenHash,
      },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (
      !storedRefreshToken ||
      storedRefreshToken.userId !== user.id ||
      storedRefreshToken.revokedAt !== null ||
      storedRefreshToken.expiresAt <= now
    ) {
      throw new BadRequestException('refresh token is not active');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: {
          id: storedRefreshToken.id,
        },
        data: {
          revokedAt: now,
        },
      });

      return await this.issueTokens(
        {
          userId: user.id,
          username: user.username,
          provider: user.provider,
          role: user.role,
        },
        tx,
      );
    });
  }

  public async saveUserAuth(
    hashedUserAuthPayload: Pick<UserAuth, 'username' | 'password'>,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? this.prisma;

    try {
      const userAuth = await client.userAuth.create({
        data: hashedUserAuthPayload,
      });

      return {
        id: userAuth.id,
        username: userAuth.username,
        createdAt: userAuth.createdAt,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('username is already taken');
      }

      throw error;
    }
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const pepper = this.config.getOrThrow<string>('PASSWORD_HASH_PEPPER');
    const derivedKey = (await scrypt(
      `${password}${pepper}`,
      salt,
      PASSWORD_HASH_LENGTH,
    )) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }

  private isUniqueConstraintError(error: unknown) {
    return this.hasErrorCode(error) && error.code === 'P2002';
  }

  private hasErrorCode(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    );
  }
  private async verifyPassword(password: string, storedPassword: string) {
    const [algorithm, salt, storedHash] = storedPassword.split(':');

    if (algorithm !== 'scrypt' || !salt || !storedHash) {
      return false;
    }

    const pepper = this.config.getOrThrow<string>('PASSWORD_HASH_PEPPER');

    const derivedKey = (await scrypt(
      `${password}${pepper}`,
      salt,
      PASSWORD_HASH_LENGTH,
    )) as Buffer;

    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (storedHashBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedHashBuffer, derivedKey);
  }

  private async issueTokens(
    params: {
      userId: number;
      username: string;
      provider: UserProvider;
      role: UserRole;
    },
    tx?: PrismaTransactionClient,
  ): Promise<AuthTokenResponse> {
    const client = tx ?? this.prisma;
    const accessPayload: AccessTokenPayload = {
      sub: `${params.username}:${params.provider}`,
      username: params.username,
      provider: params.provider,
      role: params.role,
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: `${params.username}:${params.provider}`,
      username: params.username,
      provider: params.provider,
    };
    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '1h';
    const refreshExpiresIn =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const accessTokenSignOptions: JwtSignOptions = {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
    };
    const refreshTokenSignOptions: JwtSignOptions = {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, accessTokenSignOptions),
      this.jwt.signAsync(refreshPayload, refreshTokenSignOptions),
    ]);

    const decodedAccessToken = this.decodeJwt(accessToken);

    if (!decodedAccessToken?.exp) {
      throw new BadRequestException('failed to issue access token');
    }

    const decodedRefreshToken = this.decodeJwt(refreshToken);

    if (!decodedRefreshToken?.exp) {
      throw new BadRequestException('failed to issue refresh token');
    }

    await client.refreshToken.deleteMany({
      where: {
        userId: params.userId,
      },
    });

    await client.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(
        decodedAccessToken.exp * 1000,
      ).toISOString(),
    };
  }

  private hashRefreshToken(refreshToken: string) {
    const pepper =
      this.config.get<string>('JWT_REFRESH_HASH_PEPPER') ??
      this.config.getOrThrow<string>('PASSWORD_HASH_PEPPER');

    return createHash(REFRESH_TOKEN_HASH_ALGORITHM)
      .update(`${refreshToken}${pepper}`)
      .digest('hex');
  }

  private decodeJwt(token: string): DecodedJwtPayload | null {
    const decoded: unknown = this.jwt.decode(token);

    if (!decoded || typeof decoded !== 'object') {
      return null;
    }

    return decoded as DecodedJwtPayload;
  }

  private assertActiveAuthUser(
    user: Pick<
      User,
      | 'id'
      | 'username'
      | 'name'
      | 'email'
      | 'profileImage'
      | 'role'
      | 'status'
      | 'provider'
      | 'createdAt'
    > | null,
  ): asserts user is Pick<
    User,
    | 'id'
    | 'username'
    | 'name'
    | 'email'
    | 'profileImage'
    | 'role'
    | 'status'
    | 'provider'
    | 'createdAt'
  > {
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('invalid username or password');
    }
  }

  private assertActiveRefreshUser(
    user: Pick<User, 'id' | 'username' | 'provider' | 'role' | 'status'> | null,
  ): asserts user is Pick<
    User,
    'id' | 'username' | 'provider' | 'role' | 'status'
  > {
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('invalid refresh token');
    }
  }
}
