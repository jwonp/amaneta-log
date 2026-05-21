import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.cjs';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AnalyticsDashboardDevicesResponse,
  AnalyticsDashboardOverviewResponse,
  AnalyticsDashboardPagesResponse,
  AnalyticsDashboardReferrersResponse,
  AnalyticsDashboardTimeseriesPoint,
  AnalyticsDashboardTimeseriesResponse,
  AnalyticsDashboardTopPostsResponse,
  TrackAnalyticsEventRequest,
  TrackAnalyticsEventResponse,
} from './analytics.dto.type';

type DashboardRange = {
  from: Date;
  to: Date;
  timezone: string;
  limit: number;
  comparePrevious: boolean;
};

type OverviewMetrics = AnalyticsDashboardOverviewResponse['totals'];

type SessionSummary = {
  visitorId: string;
  startedAt: Date;
  totalActiveMs: number;
  pageViewCount: number;
  isBounce: boolean | null;
};

type PageViewSummary = {
  createdAt: Date;
  visitorId: string;
  postId: number | null;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(
    payload: TrackAnalyticsEventRequest,
    userAgent?: string,
  ): Promise<TrackAnalyticsEventResponse> {
    if (this.isBotUserAgent(userAgent)) {
      return {
        accepted: false,
        deduped: false,
      };
    }

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          visitorId: payload.visitorId,
          sessionId: payload.sessionId,
          eventType: payload.eventType,
          pageType: payload.pageType,
          pagePath: payload.pagePath,
          postId: payload.postId ?? null,
          referrerHost: payload.referrerHost ?? null,
          utmSource: payload.utmSource ?? null,
          utmMedium: payload.utmMedium ?? null,
          utmCampaign: payload.utmCampaign ?? null,
          deviceCategory: payload.deviceCategory ?? null,
          timezone: payload.timezone ?? null,
          durationMs: payload.durationMs ?? null,
          scrollPercent: payload.scrollPercent ?? null,
          dedupeKey: payload.dedupeKey ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return {
          accepted: true,
          deduped: true,
        };
      }

      throw error;
    }

    await this.upsertSession(payload);

    return {
      accepted: true,
      deduped: false,
    };
  }

  async getDashboardOverview(
    range: DashboardRange,
  ): Promise<AnalyticsDashboardOverviewResponse> {
    const current = await this.buildOverviewMetrics(range.from, range.to);
    const previous = range.comparePrevious
      ? await this.buildPreviousOverviewMetrics(range.from, range.to)
      : null;

    return {
      range: this.serializeRange(range),
      totals: current,
      deltas: {
        pageViews: this.calculateDeltaRate(
          current.pageViews,
          previous?.pageViews,
        ),
        uniqueVisitors: this.calculateDeltaRate(
          current.uniqueVisitors,
          previous?.uniqueVisitors,
        ),
        sessions: this.calculateDeltaRate(current.sessions, previous?.sessions),
        bounceRate: this.calculateDeltaRate(
          current.bounceRate,
          previous?.bounceRate,
        ),
        avgActiveMs: this.calculateDeltaRate(
          current.avgActiveMs,
          previous?.avgActiveMs,
        ),
        pagesPerSession: this.calculateDeltaRate(
          current.pagesPerSession,
          previous?.pagesPerSession,
        ),
      },
    };
  }

  async getDashboardTimeseries(
    range: DashboardRange,
  ): Promise<AnalyticsDashboardTimeseriesResponse> {
    const [pageViews, sessions] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        select: {
          createdAt: true,
          visitorId: true,
        },
      }),
      this.prisma.analyticsSession.findMany({
        where: {
          startedAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        select: {
          startedAt: true,
          totalActiveMs: true,
          sessionId: true,
        },
      }),
    ]);

    const pointsByDay = new Map<string, AnalyticsDashboardTimeseriesPoint>();

    for (const event of pageViews) {
      const key = this.toDateKey(event.createdAt);
      const point = this.ensurePoint(pointsByDay, key);
      point.pageViews += 1;
      point.uniqueVisitors += 0;
    }

    const uniqueVisitorBuckets = new Map<string, Set<string>>();

    for (const event of pageViews) {
      const key = this.toDateKey(event.createdAt);
      const visitors = uniqueVisitorBuckets.get(key) ?? new Set<string>();
      visitors.add(event.visitorId);
      uniqueVisitorBuckets.set(key, visitors);
    }

    for (const [key, visitors] of uniqueVisitorBuckets) {
      this.ensurePoint(pointsByDay, key).uniqueVisitors = visitors.size;
    }

    for (const session of sessions) {
      const key = this.toDateKey(session.startedAt);
      const point = this.ensurePoint(pointsByDay, key);
      point.sessions += 1;
      point.avgActiveMs += session.totalActiveMs;
    }

    const points = Array.from(pointsByDay.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((point) => ({
        ...point,
        avgActiveMs:
          point.sessions > 0
            ? Math.round(point.avgActiveMs / point.sessions)
            : 0,
      }));

    return {
      range: this.serializeRange(range),
      points,
    };
  }

  async getDashboardTopPosts(
    range: DashboardRange,
  ): Promise<AnalyticsDashboardTopPostsResponse> {
    const [pageViews, sessions] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'PAGE_VIEW',
          postId: {
            not: null,
          },
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        select: {
          postId: true,
          visitorId: true,
          sessionId: true,
        },
      }),
      this.prisma.analyticsSession.findMany({
        where: {
          startedAt: {
            gte: range.from,
            lte: range.to,
          },
          landingPostId: {
            not: null,
          },
        },
        select: {
          landingPostId: true,
          sessionId: true,
          totalActiveMs: true,
          isBounce: true,
        },
      }),
    ]);

    const summary = new Map<
      number,
      {
        pageViews: number;
        visitors: Set<string>;
        sessionIds: Set<string>;
        totalActiveMs: number;
        bounces: number;
      }
    >();

    for (const event of pageViews) {
      if (!event.postId) {
        continue;
      }

      const item = summary.get(event.postId) ?? {
        pageViews: 0,
        visitors: new Set<string>(),
        sessionIds: new Set<string>(),
        totalActiveMs: 0,
        bounces: 0,
      };

      item.pageViews += 1;
      item.visitors.add(event.visitorId);
      item.sessionIds.add(event.sessionId);
      summary.set(event.postId, item);
    }

    for (const session of sessions) {
      if (!session.landingPostId) {
        continue;
      }

      const item = summary.get(session.landingPostId) ?? {
        pageViews: 0,
        visitors: new Set<string>(),
        sessionIds: new Set<string>(),
        totalActiveMs: 0,
        bounces: 0,
      };

      item.totalActiveMs += session.totalActiveMs;
      if (session.isBounce) {
        item.bounces += 1;
      }
      summary.set(session.landingPostId, item);
    }

    const topPostIds = Array.from(summary.entries())
      .sort((left, right) => right[1].pageViews - left[1].pageViews)
      .slice(0, range.limit)
      .map(([postId]) => postId);

    const posts = await this.prisma.post.findMany({
      where: {
        id: {
          in: topPostIds,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });
    const postTitleById = new Map(posts.map((post) => [post.id, post.title]));

    return {
      range: this.serializeRange(range),
      items: topPostIds.map((postId) => {
        const item = summary.get(postId);
        const sessionCount = item?.sessionIds.size ?? 0;
        return {
          postId,
          title: postTitleById.get(postId) ?? `Post #${postId}`,
          pageViews: item?.pageViews ?? 0,
          uniqueVisitors: item?.visitors.size ?? 0,
          avgActiveMs:
            sessionCount > 0
              ? Math.round((item?.totalActiveMs ?? 0) / sessionCount)
              : 0,
          bounceRate:
            sessionCount > 0
              ? Number((((item?.bounces ?? 0) / sessionCount) * 100).toFixed(1))
              : 0,
        };
      }),
    };
  }

  async getDashboardReferrers(
    range: DashboardRange,
  ): Promise<AnalyticsDashboardReferrersResponse> {
    const [sessions, pageViews] = await Promise.all([
      this.prisma.analyticsSession.findMany({
        where: {
          startedAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        select: {
          referrerHost: true,
          visitorId: true,
          sessionId: true,
        },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        select: {
          sessionId: true,
          referrerHost: true,
        },
      }),
    ]);

    const summary = new Map<
      string,
      {
        sessions: Set<string>;
        visitors: Set<string>;
        pageViews: number;
      }
    >();

    for (const session of sessions) {
      const referrerHost = session.referrerHost?.trim() || 'direct';
      const item = summary.get(referrerHost) ?? {
        sessions: new Set<string>(),
        visitors: new Set<string>(),
        pageViews: 0,
      };

      item.sessions.add(session.sessionId);
      item.visitors.add(session.visitorId);
      summary.set(referrerHost, item);
    }

    for (const event of pageViews) {
      const referrerHost = event.referrerHost?.trim() || 'direct';
      const item = summary.get(referrerHost) ?? {
        sessions: new Set<string>(),
        visitors: new Set<string>(),
        pageViews: 0,
      };

      item.pageViews += 1;
      summary.set(referrerHost, item);
    }

    const items = Array.from(summary.entries())
      .map(([referrerHost, item]) => ({
        referrerHost,
        sessions: item.sessions.size,
        pageViews: item.pageViews,
        uniqueVisitors: item.visitors.size,
      }))
      .sort((left, right) => right.sessions - left.sessions)
      .slice(0, range.limit);

    return {
      range: this.serializeRange(range),
      items,
    };
  }

  async getDashboardDevices(
    range: DashboardRange,
  ): Promise<AnalyticsDashboardDevicesResponse> {
    const sessions = await this.prisma.analyticsSession.findMany({
      where: {
        startedAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      select: {
        deviceCategory: true,
      },
    });

    const counts = new Map<string, number>();

    for (const session of sessions) {
      const key = session.deviceCategory ?? 'UNKNOWN';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const total = sessions.length;
    const items = Array.from(counts.entries())
      .map(([deviceCategory, count]) => ({
        deviceCategory:
          deviceCategory as AnalyticsDashboardDevicesResponse['items'][number]['deviceCategory'],
        sessions: count,
        share: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      }))
      .sort((left, right) => right.sessions - left.sessions);

    return {
      range: this.serializeRange(range),
      items,
    };
  }

  async getDashboardLandingPages(
    range: DashboardRange,
  ): Promise<AnalyticsDashboardPagesResponse> {
    const sessions = await this.prisma.analyticsSession.findMany({
      where: {
        startedAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      select: {
        landingPath: true,
        isBounce: true,
      },
    });

    return {
      range: this.serializeRange(range),
      items: this.buildPageBreakdown(
        sessions.map((session) => ({
          pagePath: session.landingPath,
          isBounce: session.isBounce,
        })),
        range.limit,
      ),
    };
  }

  async getDashboardExitPages(
    range: DashboardRange,
  ): Promise<AnalyticsDashboardPagesResponse> {
    const pageViews = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'PAGE_VIEW',
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      orderBy: [{ sessionId: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: {
        sessionId: true,
        pagePath: true,
      },
    });
    const sessions = await this.prisma.analyticsSession.findMany({
      where: {
        startedAt: {
          gte: range.from,
          lte: range.to,
        },
      },
      select: {
        sessionId: true,
        isBounce: true,
      },
    });
    const bounceBySessionId = new Map(
      sessions.map((session) => [session.sessionId, session.isBounce]),
    );
    const seenSessionIds = new Set<string>();
    const exits: Array<{ pagePath: string; isBounce: boolean | null }> = [];

    for (const event of pageViews) {
      if (seenSessionIds.has(event.sessionId)) {
        continue;
      }

      seenSessionIds.add(event.sessionId);
      exits.push({
        pagePath: event.pagePath,
        isBounce: bounceBySessionId.get(event.sessionId) ?? null,
      });
    }

    return {
      range: this.serializeRange(range),
      items: this.buildPageBreakdown(exits, range.limit),
    };
  }

  private async upsertSession(payload: TrackAnalyticsEventRequest) {
    const existingSession = await this.prisma.analyticsSession.findUnique({
      where: {
        sessionId: payload.sessionId,
      },
      select: {
        id: true,
      },
    });

    if (!existingSession) {
      await this.prisma.analyticsSession.create({
        data: {
          sessionId: payload.sessionId,
          visitorId: payload.visitorId,
          landingPath: payload.pagePath,
          landingPostId: payload.postId ?? null,
          referrerHost: payload.referrerHost ?? null,
          utmSource: payload.utmSource ?? null,
          utmMedium: payload.utmMedium ?? null,
          utmCampaign: payload.utmCampaign ?? null,
          deviceCategory: payload.deviceCategory ?? null,
          timezone: payload.timezone ?? null,
          pageViewCount: payload.eventType === 'PAGE_VIEW' ? 1 : 0,
          engagementCount: payload.eventType === 'ENGAGEMENT' ? 1 : 0,
          totalActiveMs: payload.durationMs ?? 0,
          endedAt: new Date(),
          isBounce: payload.eventType === 'PAGE_VIEW',
        },
      });

      return;
    }

    await this.prisma.analyticsSession.update({
      where: {
        sessionId: payload.sessionId,
      },
      data: {
        referrerHost: payload.referrerHost ?? undefined,
        utmSource: payload.utmSource ?? undefined,
        utmMedium: payload.utmMedium ?? undefined,
        utmCampaign: payload.utmCampaign ?? undefined,
        deviceCategory: payload.deviceCategory ?? undefined,
        timezone: payload.timezone ?? undefined,
        pageViewCount:
          payload.eventType === 'PAGE_VIEW' ? { increment: 1 } : undefined,
        engagementCount:
          payload.eventType === 'ENGAGEMENT' ? { increment: 1 } : undefined,
        totalActiveMs:
          payload.durationMs != null
            ? { increment: payload.durationMs }
            : undefined,
        endedAt: new Date(),
        isBounce: payload.eventType === 'PAGE_VIEW' ? false : false,
      },
    });
  }

  private async buildOverviewMetrics(
    from: Date,
    to: Date,
  ): Promise<OverviewMetrics> {
    const [pageViews, sessions] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'PAGE_VIEW',
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          visitorId: true,
        },
      }),
      this.prisma.analyticsSession.findMany({
        where: {
          startedAt: {
            gte: from,
            lte: to,
          },
        },
        select: {
          visitorId: true,
          startedAt: true,
          totalActiveMs: true,
          pageViewCount: true,
          isBounce: true,
        },
      }),
    ]);

    return this.computeOverviewMetrics(
      pageViews.map((event) => ({
        createdAt: from,
        visitorId: event.visitorId,
        postId: null,
      })),
      sessions,
    );
  }

  private async buildPreviousOverviewMetrics(from: Date, to: Date) {
    const span = to.getTime() - from.getTime();
    const previousTo = new Date(from.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - span);
    return this.buildOverviewMetrics(previousFrom, previousTo);
  }

  private buildPageBreakdown(
    items: Array<{ pagePath: string; isBounce: boolean | null }>,
    limit: number,
  ): AnalyticsDashboardPagesResponse['items'] {
    const summary = new Map<
      string,
      {
        sessions: number;
        bounces: number;
      }
    >();

    for (const item of items) {
      const pagePath = item.pagePath || '/';
      const bucket = summary.get(pagePath) ?? {
        sessions: 0,
        bounces: 0,
      };

      bucket.sessions += 1;
      if (item.isBounce) {
        bucket.bounces += 1;
      }
      summary.set(pagePath, bucket);
    }

    return Array.from(summary.entries())
      .map(([pagePath, item]) => ({
        pagePath,
        sessions: item.sessions,
        bounces: item.bounces,
        bounceRate:
          item.sessions > 0
            ? Number(((item.bounces / item.sessions) * 100).toFixed(1))
            : 0,
      }))
      .sort((left, right) => right.sessions - left.sessions)
      .slice(0, limit);
  }

  private computeOverviewMetrics(
    pageViews: PageViewSummary[],
    sessions: SessionSummary[],
  ): OverviewMetrics {
    const uniqueVisitors = new Set(pageViews.map((event) => event.visitorId));
    const bounceCount = sessions.filter((session) => session.isBounce).length;
    const totalActiveMs = sessions.reduce(
      (sum, session) => sum + session.totalActiveMs,
      0,
    );
    const totalPages = sessions.reduce(
      (sum, session) => sum + session.pageViewCount,
      0,
    );
    const sessionCount = sessions.length;

    return {
      pageViews: pageViews.length,
      uniqueVisitors: uniqueVisitors.size,
      sessions: sessionCount,
      bounceRate:
        sessionCount > 0
          ? Number(((bounceCount / sessionCount) * 100).toFixed(1))
          : 0,
      avgActiveMs:
        sessionCount > 0 ? Math.round(totalActiveMs / sessionCount) : 0,
      pagesPerSession:
        sessionCount > 0 ? Number((totalPages / sessionCount).toFixed(2)) : 0,
    };
  }

  private calculateDeltaRate(current: number, previous?: number) {
    if (previous == null) {
      return null;
    }

    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private ensurePoint(
    points: Map<string, AnalyticsDashboardTimeseriesPoint>,
    key: string,
  ) {
    const existing = points.get(key);

    if (existing) {
      return existing;
    }

    const created: AnalyticsDashboardTimeseriesPoint = {
      date: key,
      pageViews: 0,
      uniqueVisitors: 0,
      sessions: 0,
      avgActiveMs: 0,
    };

    points.set(key, created);
    return created;
  }

  private toDateKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private serializeRange(range: DashboardRange) {
    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      timezone: range.timezone,
    };
  }

  private isBotUserAgent(userAgent?: string) {
    if (!userAgent) {
      return false;
    }

    return /bot|crawler|spider|preview|headless/i.test(userAgent);
  }
}
