import { ReactNode } from "react"
import {
  AnalyticsDashboardDevicesResponse,
  AnalyticsDashboardOverviewResponse,
  AnalyticsDashboardPagesResponse,
  AnalyticsDashboardReferrersResponse,
  AnalyticsDashboardTimeseriesResponse,
  AnalyticsDashboardTopPostsResponse,
} from "@/src/05_shared/api/analytics/model/analytics.type"
import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/src/components/card"

const formatDelta = (value: number | null, suffix = "%") => {
  if (value == null) {
    return "비교 없음"
  }

  const sign = value > 0 ? "+" : ""
  return `${sign}${value}${suffix}`
}

const formatDuration = (value: number) => {
  if (value < 1000) {
    return `${value}ms`
  }

  return `${(value / 1000).toFixed(1)}s`
}

const buildBars = (points: AnalyticsDashboardTimeseriesResponse["points"]) => {
  const maxPageViews = Math.max(...points.map((point) => point.pageViews), 1)

  return points.map((point) => ({
    ...point,
    height: `${Math.max(16, Math.round((point.pageViews / maxPageViews) * 100))}%`,
  }))
}

const deviceLabel: Record<
  AnalyticsDashboardDevicesResponse["items"][number]["deviceCategory"],
  string
> = {
  MOBILE: "모바일",
  DESKTOP: "데스크톱",
  TABLET: "태블릿",
  OTHER: "기타",
  UNKNOWN: "미분류",
}

const EmptyState = ({ message }: { message: string }) => {
  return <div className="text-sm text-foreground/60">{message}</div>
}

const MetricDefinition = ({ children }: { children: ReactNode }) => {
  return <p className="text-xs leading-5 text-foreground/55">{children}</p>
}

const PageBreakdownList = ({
  items,
  emptyMessage,
}: {
  items: AnalyticsDashboardPagesResponse["items"]
  emptyMessage: string
}) => {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return items.map((item) => (
    <div
      key={item.pagePath}
      className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
    >
      <div className="truncate text-sm font-medium">{item.pagePath}</div>
      <div className="grid grid-cols-2 gap-2 text-xs text-foreground/70">
        <span>세션 {item.sessions}</span>
        <span>이탈 {item.bounces}</span>
        <span className="col-span-2">이탈률 {item.bounceRate}%</span>
      </div>
    </div>
  ))
}

const AdminView = ({
  overview,
  timeseries,
  topPosts,
  referrers,
  devices,
  landingPages,
  exitPages,
}: {
  overview: AnalyticsDashboardOverviewResponse
  timeseries: AnalyticsDashboardTimeseriesResponse
  topPosts: AnalyticsDashboardTopPostsResponse
  referrers: AnalyticsDashboardReferrersResponse
  devices: AnalyticsDashboardDevicesResponse
  landingPages: AnalyticsDashboardPagesResponse
  exitPages: AnalyticsDashboardPagesResponse
}) => {
  const cards = [
    {
      label: "총 조회수",
      value: overview.totals.pageViews.toLocaleString("ko-KR"),
      delta: formatDelta(overview.deltas.pageViews),
    },
    {
      label: "순 방문자",
      value: overview.totals.uniqueVisitors.toLocaleString("ko-KR"),
      delta: formatDelta(overview.deltas.uniqueVisitors),
    },
    {
      label: "세션 수",
      value: overview.totals.sessions.toLocaleString("ko-KR"),
      delta: formatDelta(overview.deltas.sessions),
    },
    {
      label: "이탈률",
      value: `${overview.totals.bounceRate}%`,
      delta: formatDelta(overview.deltas.bounceRate),
    },
    {
      label: "평균 활성 체류",
      value: formatDuration(overview.totals.avgActiveMs),
      delta: formatDelta(overview.deltas.avgActiveMs),
    },
    {
      label: "세션당 페이지",
      value: `${overview.totals.pagesPerSession}`,
      delta: formatDelta(overview.deltas.pagesPerSession),
    },
  ]
  const bars = buildBars(timeseries.points)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">운영 통계</h1>
        <p className="text-sm text-foreground/70">
          공개 블로그 기준 최근 7일 트래픽 요약입니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground/70">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-semibold tracking-tight">{card.value}</div>
              <p className="text-xs text-foreground/60">직전 기간 대비 {card.delta}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>일별 조회 흐름</CardTitle>
            <MetricDefinition>
              공개 페이지 `PAGE_VIEW` 이벤트를 일자별로 합산한 값입니다.
            </MetricDefinition>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-3">
              {bars.length > 0 ? (
                bars.map((point) => (
                  <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-52 w-full items-end rounded-md bg-muted/40 px-1 py-1">
                      <div
                        className="w-full rounded-sm bg-foreground/80 transition-[height]"
                        style={{ height: point.height }}
                      />
                    </div>
                    <div className="text-center text-[11px] text-foreground/65">
                      {point.date.slice(5)}
                    </div>
                    <div className="text-xs font-medium">{point.pageViews}</div>
                  </div>
                ))
              ) : (
                <div className="flex h-52 w-full items-center justify-center text-sm text-foreground/60">
                  아직 수집된 데이터가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>상위 게시물</CardTitle>
            <MetricDefinition>
              포스트 상세 진입 기준 조회수 상위 글과 해당 세션의 평균 체류/이탈을 표시합니다.
            </MetricDefinition>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPosts.items.length > 0 ? (
              topPosts.items.map((item) => (
                <div
                  key={item.postId}
                  className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="line-clamp-2 text-sm font-medium">{item.title}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-foreground/70">
                    <span>조회수 {item.pageViews}</span>
                    <span>방문자 {item.uniqueVisitors}</span>
                    <span>체류 {formatDuration(item.avgActiveMs)}</span>
                    <span>이탈률 {item.bounceRate}%</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="아직 인기 게시물 통계를 계산할 데이터가 없습니다." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>유입경로</CardTitle>
            <MetricDefinition>
              세션 시작 시점의 referrer host를 기준으로 direct 포함 상위 유입을 집계합니다.
            </MetricDefinition>
          </CardHeader>
          <CardContent className="space-y-4">
            {referrers.items.length > 0 ? (
              referrers.items.map((item) => (
                <div
                  key={item.referrerHost}
                  className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="text-sm font-medium">{item.referrerHost}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-foreground/70">
                    <span>세션 {item.sessions}</span>
                    <span>조회수 {item.pageViews}</span>
                    <span>방문자 {item.uniqueVisitors}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="아직 유입경로 통계가 없습니다." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>디바이스 분포</CardTitle>
            <MetricDefinition>
              세션 시작 브라우저 UA를 모바일/데스크톱/태블릿 수준으로 축약해 분류합니다.
            </MetricDefinition>
          </CardHeader>
          <CardContent className="space-y-4">
            {devices.items.length > 0 ? (
              devices.items.map((item) => (
                <div
                  key={item.deviceCategory}
                  className="space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{deviceLabel[item.deviceCategory]}</span>
                    <span>{item.share}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-foreground/80"
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                  <div className="text-xs text-foreground/70">세션 {item.sessions}</div>
                </div>
              ))
            ) : (
              <EmptyState message="아직 디바이스 분포 통계가 없습니다." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>랜딩 페이지</CardTitle>
            <MetricDefinition>
              세션이 시작된 첫 페이지 기준이며, 페이지별 이탈률을 함께 보여줍니다.
            </MetricDefinition>
          </CardHeader>
          <CardContent className="space-y-4">
            <PageBreakdownList
              items={landingPages.items}
              emptyMessage="아직 랜딩 페이지 통계가 없습니다."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이탈 페이지</CardTitle>
            <MetricDefinition>
              세션별 마지막 `PAGE_VIEW` 기준 종료 페이지를 계산한 값입니다.
            </MetricDefinition>
          </CardHeader>
          <CardContent className="space-y-4">
            <PageBreakdownList
              items={exitPages.items}
              emptyMessage="아직 이탈 페이지 통계가 없습니다."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default AdminView
