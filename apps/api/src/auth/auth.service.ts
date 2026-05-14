import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { User, UserAuth } from '../../generated/prisma/client.cjs';
import { UserService } from '../user/user.service';
import { PrismaTransactionClient } from '../prisma/prisma.type';
import { SaveUserResponse } from '../user/user.dto.type';
import type { AccessTokenPayload } from './auth.type';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from './auth.dto.type';

const scrypt = promisify(scryptCallback);
const PASSWORD_HASH_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 8;

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
      name: username,
      username: username,
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
    });

    if (!user) {
      throw new BadRequestException('user profile not found');
    }

    const payload: AccessTokenPayload = {
      sub: `${user.username}:${user.provider}`,
      username: user.username,
      provider: user.provider,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
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
}
