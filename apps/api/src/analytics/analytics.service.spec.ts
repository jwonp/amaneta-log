import { Prisma } from '../../generated/prisma/client.cjs';
import { AnalyticsService } from './analytics.service';

type OverviewMetricsAccessor = {
  computeOverviewMetrics: (
    pageViews: Array<{
      createdAt: Date;
      visitorId: string;
      postId: number | null;
    }>,
    sessions: Array<{
      visitorId: string;
      startedAt: Date;
      totalActiveMs: number;
      pageViewCount: number;
      isBounce: boolean | null;
    }>,
  ) => {
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
    bounceRate: number;
    avgActiveMs: number;
    pagesPerSession: number;
  };
};

type PageBreakdownAccessor = {
  buildPageBreakdown: (
    items: Array<{
      pagePath: string;
      isBounce: boolean | null;
    }>,
    limit: number,
  ) => Array<{
    pagePath: string;
    sessions: number;
    bounces: number;
    bounceRate: number;
  }>;
};

describe('AnalyticsService', () => {
  it('creates a new session before inserting the first analytics event', async () => {
    const prisma = {
      analyticsSession: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 1n,
          sessionId: 'session-1',
        }),
        update: jest.fn().mockResolvedValue({
          id: 1n,
          sessionId: 'session-1',
        }),
      },
      analyticsEvent: {
        create: jest.fn().mockResolvedValue({
          id: 1n,
        }),
      },
    };

    const service = new AnalyticsService(prisma as never);

    await expect(
      service.trackEvent({
        visitorId: 'visitor-1',
        sessionId: 'session-1',
        eventType: 'PAGE_VIEW',
        pageType: 'POST_LIST',
        pagePath: '/posts',
        dedupeKey: 'dedupe-key',
      }),
    ).resolves.toEqual({
      accepted: true,
      deduped: false,
    });

    expect(prisma.analyticsSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: 'session-1',
          visitorId: 'visitor-1',
          landingPath: '/posts',
          pageViewCount: 0,
          engagementCount: 0,
        }) as any,
      }) as any,
    );
    expect(
      prisma.analyticsSession.create.mock.invocationCallOrder[0],
    ).toBeLessThan(prisma.analyticsEvent.create.mock.invocationCallOrder[0]);
    expect(prisma.analyticsSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sessionId: 'session-1',
        },
        data: expect.objectContaining({
          pageViewCount: { increment: 1 },
          isBounce: true,
        }) as any,
      }) as any,
    );
  });

  it('treats duplicate dedupeKey as deduped success', async () => {
    const prisma = {
      analyticsSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
        }),
        create: jest.fn(),
        update: jest.fn(),
      },
      analyticsEvent: {
        create: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('duplicate', {
            code: 'P2002',
            clientVersion: 'test',
          }),
        ),
      },
    };

    const service = new AnalyticsService(prisma as never);

    await expect(
      service.trackEvent({
        visitorId: 'visitor-1',
        sessionId: 'session-1',
        eventType: 'PAGE_VIEW',
        pageType: 'POST_LIST',
        pagePath: '/posts',
        dedupeKey: 'dedupe-key',
      }),
    ).resolves.toEqual({
      accepted: true,
      deduped: true,
    });
    expect(prisma.analyticsSession.update).not.toHaveBeenCalled();
  });

  it('aggregates top-level overview metrics from pageviews and sessions', () => {
    const service = new AnalyticsService({} as never);
    const { computeOverviewMetrics } =
      service as unknown as OverviewMetricsAccessor;

    const metrics = computeOverviewMetrics(
      [
        {
          createdAt: new Date('2026-05-20T00:00:00.000Z'),
          visitorId: 'v1',
          postId: 1,
        },
        {
          createdAt: new Date('2026-05-20T01:00:00.000Z'),
          visitorId: 'v2',
          postId: 1,
        },
        {
          createdAt: new Date('2026-05-20T02:00:00.000Z'),
          visitorId: 'v1',
          postId: 2,
        },
      ],
      [
        {
          visitorId: 'v1',
          startedAt: new Date('2026-05-20T00:00:00.000Z'),
          totalActiveMs: 12000,
          pageViewCount: 2,
          isBounce: false,
        },
        {
          visitorId: 'v2',
          startedAt: new Date('2026-05-20T01:00:00.000Z'),
          totalActiveMs: 3000,
          pageViewCount: 1,
          isBounce: true,
        },
      ],
    );

    expect(metrics).toEqual({
      pageViews: 3,
      uniqueVisitors: 2,
      sessions: 2,
      bounceRate: 50,
      avgActiveMs: 7500,
      pagesPerSession: 1.5,
    });
  });

  it('builds page breakdown with bounce rate ordering', () => {
    const service = new AnalyticsService({} as never);
    const { buildPageBreakdown } = service as unknown as PageBreakdownAccessor;

    const items = buildPageBreakdown(
      [
        {
          pagePath: '/posts',
          isBounce: true,
        },
        {
          pagePath: '/posts',
          isBounce: false,
        },
        {
          pagePath: '/posts/1',
          isBounce: true,
        },
      ],
      5,
    );

    expect(items).toEqual([
      {
        pagePath: '/posts',
        sessions: 2,
        bounces: 1,
        bounceRate: 50,
      },
      {
        pagePath: '/posts/1',
        sessions: 1,
        bounces: 1,
        bounceRate: 100,
      },
    ]);
  });
});
