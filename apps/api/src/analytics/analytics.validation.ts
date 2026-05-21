import { BadRequestException } from '@nestjs/common';
import {
  AnalyticsEventType,
  AnalyticsPageType,
  DeviceCategory,
} from '../../generated/prisma/client.cjs';
import type {
  AnalyticsDashboardRangeQuery,
  TrackAnalyticsEventRequest,
} from './analytics.dto.type';

const MAX_STRING_LENGTH = 255;

const trimOptional = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, MAX_STRING_LENGTH) : null;
};

const requireShortString = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  if (trimmed.length > MAX_STRING_LENGTH) {
    throw new BadRequestException(`${fieldName} is too long`);
  }

  return trimmed;
};

const parseOptionalInteger = (value: unknown, fieldName: string) => {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException(`${fieldName} must be an integer`);
  }

  return value;
};

const parseOptionalEnum = <T extends Record<string, string>>(
  enumType: T,
  value: unknown,
  fieldName: string,
) => {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'string' || !(value in enumType)) {
    throw new BadRequestException(`${fieldName} is invalid`);
  }

  return value as T[keyof T];
};

export const parseTrackAnalyticsEventRequest = (
  input: unknown,
): TrackAnalyticsEventRequest => {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('request body is required');
  }

  const body = input as Record<string, unknown>;
  const durationMs = parseOptionalInteger(body.durationMs, 'durationMs');
  const scrollPercent = parseOptionalInteger(
    body.scrollPercent,
    'scrollPercent',
  );

  if (durationMs != null && durationMs < 0) {
    throw new BadRequestException(
      'durationMs must be greater than or equal to 0',
    );
  }

  if (scrollPercent != null && (scrollPercent < 0 || scrollPercent > 100)) {
    throw new BadRequestException('scrollPercent must be between 0 and 100');
  }

  return {
    visitorId: requireShortString(body.visitorId, 'visitorId'),
    sessionId: requireShortString(body.sessionId, 'sessionId'),
    eventType: requireShortString(
      parseOptionalEnum(AnalyticsEventType, body.eventType, 'eventType'),
      'eventType',
    ) as AnalyticsEventType,
    pageType: requireShortString(
      parseOptionalEnum(AnalyticsPageType, body.pageType, 'pageType'),
      'pageType',
    ) as AnalyticsPageType,
    pagePath: requireShortString(body.pagePath, 'pagePath'),
    postId: parseOptionalInteger(body.postId, 'postId'),
    referrerHost: trimOptional(body.referrerHost as string | null | undefined),
    utmSource: trimOptional(body.utmSource as string | null | undefined),
    utmMedium: trimOptional(body.utmMedium as string | null | undefined),
    utmCampaign: trimOptional(body.utmCampaign as string | null | undefined),
    deviceCategory: parseOptionalEnum(
      DeviceCategory,
      body.deviceCategory,
      'deviceCategory',
    ),
    timezone: trimOptional(body.timezone as string | null | undefined),
    durationMs,
    scrollPercent,
    dedupeKey: trimOptional(body.dedupeKey as string | null | undefined),
  };
};

const parseDateBoundary = (
  value: string | undefined,
  fallback: Date,
  boundary: 'start' | 'end',
) => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(
      `invalid ${boundary === 'start' ? 'from' : 'to'} date`,
    );
  }

  return date;
};

export const parseAnalyticsDashboardRangeQuery = (
  query: AnalyticsDashboardRangeQuery,
) => {
  const now = new Date();
  const defaultTo = new Date(now);
  const defaultFrom = new Date(now);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 6);
  defaultFrom.setUTCHours(0, 0, 0, 0);
  defaultTo.setUTCHours(23, 59, 59, 999);

  const from = parseDateBoundary(query.from, defaultFrom, 'start');
  const to = parseDateBoundary(query.to, defaultTo, 'end');

  if (from > to) {
    throw new BadRequestException('from must be before to');
  }

  const limitRaw = query.limit ? Number.parseInt(query.limit, 10) : 5;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 20)
    : 5;

  return {
    from,
    to,
    timezone: query.timezone?.trim() || 'UTC',
    limit,
    comparePrevious: query.comparePrevious !== 'false',
  };
};
