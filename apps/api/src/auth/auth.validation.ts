import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type {
  LoginRequest,
  RefreshTokenRequest,
  SignupRequest,
} from './auth.dto.type';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 64;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const REFRESH_TOKEN_MAX_LENGTH = 4096;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export const validateAuthCredentials = (params: {
  username: unknown;
  password: unknown;
}) => {
  if (typeof params.username !== 'string' || typeof params.password !== 'string') {
    throw new BadRequestException('username and password are required');
  }

  const username = params.username.trim();

  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    throw new BadRequestException(
      `username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`,
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new BadRequestException(
      'username may only contain letters, numbers, dot, underscore, or hyphen',
    );
  }

  if (
    params.password.length < PASSWORD_MIN_LENGTH ||
    params.password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new BadRequestException(
      `password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
    );
  }

  return {
    username,
    password: params.password,
  };
};

export const validateRefreshTokenInput = (refreshToken: unknown) => {
  if (typeof refreshToken !== 'string') {
    throw new BadRequestException('refresh token is required');
  }

  const normalized = refreshToken.trim();

  if (!normalized) {
    throw new BadRequestException('refresh token is required');
  }

  if (normalized.length > REFRESH_TOKEN_MAX_LENGTH) {
    throw new BadRequestException('refresh token is too long');
  }

  return normalized;
};

const asRecord = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('invalid request body');
  }

  return value as Record<string, unknown>;
};

@Injectable()
export class ParseSignupRequestPipe
  implements PipeTransform<unknown, SignupRequest>
{
  transform(value: unknown): SignupRequest {
    const record = asRecord(value);

    return validateAuthCredentials({
      username: record.username,
      password: record.password,
    });
  }
}

@Injectable()
export class ParseLoginRequestPipe implements PipeTransform<unknown, LoginRequest> {
  transform(value: unknown): LoginRequest {
    const record = asRecord(value);

    return validateAuthCredentials({
      username: record.username,
      password: record.password,
    });
  }
}

@Injectable()
export class ParseRefreshTokenRequestPipe
  implements PipeTransform<unknown, RefreshTokenRequest>
{
  transform(value: unknown): RefreshTokenRequest {
    const record = asRecord(value);

    return {
      refreshToken: validateRefreshTokenInput(record.refreshToken),
    };
  }
}
