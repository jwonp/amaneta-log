import AdminView from "@/src/01_views/admin/ui/AdminView"
import { requireAdminSession } from "@/lib/auth/guards"
import type { Metadata } from "next"
import { getNoIndexMetadata } from "@/src/05_shared/seo/lib/seo"
import {
  getAdminAnalyticsDevices,
  getAdminAnalyticsExitPages,
  getAdminAnalyticsLandingPages,
  getAdminAnalyticsOverview,
  getAdminAnalyticsReferrers,
  getAdminAnalyticsTimeseries,
  getAdminAnalyticsTopPosts,
} from "@/src/03_features/analytics/api/adminAnalytics.server"

export const metadata: Metadata = getNoIndexMetadata(
  "관리자",
  "Amaneta Log 관리자 화면입니다."
)

const AdminPage = async () => {
  await requireAdminSession()
  const [overview, timeseries, topPosts, referrers, devices, landingPages, exitPages] = await Promise.all([
    getAdminAnalyticsOverview(),
    getAdminAnalyticsTimeseries(),
    getAdminAnalyticsTopPosts(),
    getAdminAnalyticsReferrers(),
    getAdminAnalyticsDevices(),
    getAdminAnalyticsLandingPages(),
    getAdminAnalyticsExitPages(),
  ])

  return (
    <AdminView
      overview={overview}
      timeseries={timeseries}
      topPosts={topPosts}
      referrers={referrers}
      devices={devices}
      landingPages={landingPages}
      exitPages={exitPages}
    />
  )
}
export default AdminPage
