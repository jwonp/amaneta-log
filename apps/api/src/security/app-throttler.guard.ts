import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type RequestLike = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
  originalUrl?: string;
  route?: {
    path?: string;
  };
};

const normalizeTrackerValue = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized ? normalized.slice(0, 128) : fallback;
};

const getClientIp = (request: RequestLike) => {
  const forwardedFor = request.headers?.['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;

  if (typeof forwardedValue === 'string' && forwardedValue.trim()) {
    return forwardedValue.split(',')[0]?.trim() || request.ip || 'unknown';
  }

  return request.ip || 'unknown';
};

export const buildThrottlerTracker = (request: RequestLike) => {
  const clientIp = getClientIp(request);
  const path = request.originalUrl || request.route?.path || '';

  if (path.includes('/auth/login') || path.includes('/auth/signup')) {
    return `${clientIp}:user:${normalizeTrackerValue(
      request.body?.username,
      'anonymous',
    )}`;
  }

  if (path.includes('/analytics/events')) {
    return `${clientIp}:analytics:${normalizeTrackerValue(
      request.body?.visitorId ?? request.body?.sessionId,
      'anonymous',
    )}`;
  }

  return clientIp;
};

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>) {
    return buildThrottlerTracker(req as RequestLike);
  }
}
