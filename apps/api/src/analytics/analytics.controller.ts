import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedRequest } from '../auth/auth.type';
import type {
  AnalyticsDashboardDevicesResponse,
  AnalyticsDashboardOverviewResponse,
  AnalyticsDashboardPagesResponse,
  AnalyticsDashboardRangeQuery,
  AnalyticsDashboardReferrersResponse,
  AnalyticsDashboardTimeseriesResponse,
  AnalyticsDashboardTopPostsResponse,
  TrackAnalyticsEventResponse,
} from './analytics.dto.type';
import { AnalyticsService } from './analytics.service';
import {
  parseAnalyticsDashboardRangeQuery,
  parseTrackAnalyticsEventRequest,
} from './analytics.validation';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async trackEvent(
    @Body() body: unknown,
    @Headers('user-agent') userAgent?: string,
  ): Promise<TrackAnalyticsEventResponse> {
    return await this.analyticsService.trackEvent(
      parseTrackAnalyticsEventRequest(body),
      userAgent,
    );
  }

  @Get('dashboard/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getOverview(
    @Req() _request: AuthenticatedRequest,
    @Query() query: AnalyticsDashboardRangeQuery,
  ): Promise<AnalyticsDashboardOverviewResponse> {
    return await this.analyticsService.getDashboardOverview(
      parseAnalyticsDashboardRangeQuery(query),
    );
  }

  @Get('dashboard/timeseries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getTimeseries(
    @Req() _request: AuthenticatedRequest,
    @Query() query: AnalyticsDashboardRangeQuery,
  ): Promise<AnalyticsDashboardTimeseriesResponse> {
    return await this.analyticsService.getDashboardTimeseries(
      parseAnalyticsDashboardRangeQuery(query),
    );
  }

  @Get('dashboard/top-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getTopPosts(
    @Req() _request: AuthenticatedRequest,
    @Query() query: AnalyticsDashboardRangeQuery,
  ): Promise<AnalyticsDashboardTopPostsResponse> {
    return await this.analyticsService.getDashboardTopPosts(
      parseAnalyticsDashboardRangeQuery(query),
    );
  }

  @Get('dashboard/referrers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getReferrers(
    @Req() _request: AuthenticatedRequest,
    @Query() query: AnalyticsDashboardRangeQuery,
  ): Promise<AnalyticsDashboardReferrersResponse> {
    return await this.analyticsService.getDashboardReferrers(
      parseAnalyticsDashboardRangeQuery(query),
    );
  }

  @Get('dashboard/devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getDevices(
    @Req() _request: AuthenticatedRequest,
    @Query() query: AnalyticsDashboardRangeQuery,
  ): Promise<AnalyticsDashboardDevicesResponse> {
    return await this.analyticsService.getDashboardDevices(
      parseAnalyticsDashboardRangeQuery(query),
    );
  }

  @Get('dashboard/landing-pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getLandingPages(
    @Req() _request: AuthenticatedRequest,
    @Query() query: AnalyticsDashboardRangeQuery,
  ): Promise<AnalyticsDashboardPagesResponse> {
    return await this.analyticsService.getDashboardLandingPages(
      parseAnalyticsDashboardRangeQuery(query),
    );
  }

  @Get('dashboard/exit-pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getExitPages(
    @Req() _request: AuthenticatedRequest,
    @Query() query: AnalyticsDashboardRangeQuery,
  ): Promise<AnalyticsDashboardPagesResponse> {
    return await this.analyticsService.getDashboardExitPages(
      parseAnalyticsDashboardRangeQuery(query),
    );
  }
}
