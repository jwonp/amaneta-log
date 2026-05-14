import { UserProvider, UserRole } from '@/generated/prisma/client.cjs';
import { Request } from 'express';

export interface AccessTokenPayload {
  sub: string;
  username: string;
  provider: UserProvider;
  role: UserRole;
}

export type JwtUserPayload = {
  sub: string;
  username: string;
  provider: UserProvider;
  role: UserRole;
  iat?: number;
  exp?: number;
};

export type AuthenticatedRequest = Request & {
  user: JwtUserPayload;
};
