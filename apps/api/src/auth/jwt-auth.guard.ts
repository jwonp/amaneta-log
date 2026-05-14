// apps/api/src/auth/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtUserPayload, AuthenticatedRequest } from './auth.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('missing access token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtUserPayload>(token);
      (request as AuthenticatedRequest).user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('invalid access token');
    }
  }

  private extractBearerToken(request: Request) {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
