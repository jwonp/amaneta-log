import {
  AnalyticsEventType,
  AnalyticsPageType,
  DeviceCategory,
} from '../../generated/prisma/client.cjs';

export type TrackAnalyticsEventRequest = {
  visitorId: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  pageType: AnalyticsPageType;
  pagePath: string;
  postId?: number | null;
  referrerHost?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  deviceCategory?: DeviceCategory | null;
  timezone?: string | null;
  durationMs?: number | null;
  scrollPercent?: number | null;
  dedupeKey?: string | null;
};

export type TrackAnalyticsEventResponse = {
  accepted: boolean;
  deduped: boolean;
};

export type AnalyticsDashboardRangeQuery = {
  from?: string;
  to?: string;
  timezone?: string;
  limit?: string;
  comparePrevious?: string;
};

export type AnalyticsDashboardOverviewResponse = {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
    bounceRate: number;
    avgActiveMs: number;
    pagesPerSession: number;
  };
  deltas: {
    pageViews: number | null;
    uniqueVisitors: number | null;
    sessions: number | null;
    bounceRate: number | null;
    avgActiveMs: number | null;
    pagesPerSession: number | null;
  };
};

export type AnalyticsDashboardTimeseriesPoint = {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  avgActiveMs: number;
};

export type AnalyticsDashboardTimeseriesResponse = {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  points: AnalyticsDashboardTimeseriesPoint[];
};

export type AnalyticsDashboardTopPostItem = {
  postId: number;
  title: string;
  pageViews: number;
  uniqueVisitors: number;
  avgActiveMs: number;
  bounceRate: number;
};

export type AnalyticsDashboardTopPostsResponse = {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  items: AnalyticsDashboardTopPostItem[];
};

export type AnalyticsDashboardReferrerItem = {
  referrerHost: string;
  sessions: number;
  pageViews: number;
  uniqueVisitors: number;
};

export type AnalyticsDashboardReferrersResponse = {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  items: AnalyticsDashboardReferrerItem[];
};

export type AnalyticsDashboardDeviceItem = {
  deviceCategory: DeviceCategory | 'UNKNOWN';
  sessions: number;
  share: number;
};

export type AnalyticsDashboardDevicesResponse = {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  items: AnalyticsDashboardDeviceItem[];
};

export type AnalyticsDashboardPageItem = {
  pagePath: string;
  sessions: number;
  bounces: number;
  bounceRate: number;
};

export type AnalyticsDashboardPagesResponse = {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  items: AnalyticsDashboardPageItem[];
};
