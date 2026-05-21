import { createServerRequestApi } from "@/lib/api/requestApi"
import {
  AnalyticsDashboardDevicesResponse,
  AnalyticsDashboardOverviewResponse,
  AnalyticsDashboardPagesResponse,
  AnalyticsDashboardReferrersResponse,
  AnalyticsDashboardTimeseriesResponse,
  AnalyticsDashboardTopPostsResponse,
} from "@/src/05_shared/api/analytics/model/analytics.type"

const DEFAULT_QUERY = "comparePrevious=true&limit=5"

export const getAdminAnalyticsOverview = async () => {
  const requestApi = await createServerRequestApi()
  const response =
    await requestApi.get<AnalyticsDashboardOverviewResponse>(
      `/analytics/dashboard/overview?${DEFAULT_QUERY}`
    )

  return response.data
}

export const getAdminAnalyticsTimeseries = async () => {
  const requestApi = await createServerRequestApi()
  const response =
    await requestApi.get<AnalyticsDashboardTimeseriesResponse>(
      `/analytics/dashboard/timeseries?${DEFAULT_QUERY}`
    )

  return response.data
}

export const getAdminAnalyticsTopPosts = async () => {
  const requestApi = await createServerRequestApi()
  const response =
    await requestApi.get<AnalyticsDashboardTopPostsResponse>(
      `/analytics/dashboard/top-posts?${DEFAULT_QUERY}`
    )

  return response.data
}

export const getAdminAnalyticsReferrers = async () => {
  const requestApi = await createServerRequestApi()
  const response =
    await requestApi.get<AnalyticsDashboardReferrersResponse>(
      `/analytics/dashboard/referrers?${DEFAULT_QUERY}`
    )

  return response.data
}

export const getAdminAnalyticsDevices = async () => {
  const requestApi = await createServerRequestApi()
  const response =
    await requestApi.get<AnalyticsDashboardDevicesResponse>(
      `/analytics/dashboard/devices?${DEFAULT_QUERY}`
    )

  return response.data
}

export const getAdminAnalyticsLandingPages = async () => {
  const requestApi = await createServerRequestApi()
  const response =
    await requestApi.get<AnalyticsDashboardPagesResponse>(
      `/analytics/dashboard/landing-pages?${DEFAULT_QUERY}`
    )

  return response.data
}

export const getAdminAnalyticsExitPages = async () => {
  const requestApi = await createServerRequestApi()
  const response =
    await requestApi.get<AnalyticsDashboardPagesResponse>(
      `/analytics/dashboard/exit-pages?${DEFAULT_QUERY}`
    )

  return response.data
}
