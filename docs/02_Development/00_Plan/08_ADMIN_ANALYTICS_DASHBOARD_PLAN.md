# Admin Analytics Dashboard 구현 계획

> 기준 문서:
> `docs/02_Development/00_Plan/07_USAGE_ANALYTICS_PLAN.md`
>
> 기준 파일:
> `apps/web/app/(main)/admin/page.tsx`
> `apps/web/src/01_views/admin/ui/AdminView.tsx`
> `apps/api/prisma/schema.prisma`
> `apps/api/src/auth/*`
> `apps/api/src/post/*`
> `apps/api/src/main.ts`
> `apps/web/app/api/*`
>
> 이 문서는 이용자 통계 수집 기능 위에, 운영자가 `/admin`에서 실제로 의미 있는 블로그 성과를 볼 수 있도록 어드민 통계 대시보드를 확장하는 계획을 정리한다.

## 1. 목표

- `/admin`에서 블로그 운영에 필요한 핵심 지표를 한 화면에서 확인할 수 있다.
- 단순 조회수 나열이 아니라 글 성과, 유입경로, 이탈, 재방문, 참여도를 함께 해석할 수 있다.
- 통계 수집 원본 이벤트와 집계 규칙이 대시보드 지표와 일관되게 연결된다.
- 1차는 실시간성보다 신뢰 가능한 집계와 운영 판단에 필요한 요약을 우선한다.

## 2. 현재 상태

### 2.1 통계 수집 기능 자체가 아직 없다

- 현재 기준 문서 `07_USAGE_ANALYTICS_PLAN.md`는 수집/저장/집계 기능의 계획만 정의한다.
- 따라서 어드민 대시보드는 그 위에 얹는 2단계 계획으로 보는 것이 맞다.

### 2.2 `/admin`은 확장 가능한 자리지만 분석 중심 구조는 없다

- 관리자 페이지는 존재하지만, 통계 대시보드 전용 정보 구조와 API 계약은 아직 없다.
- 따라서 UI를 먼저 만드는 것이 아니라, 지표 정의와 집계 API를 먼저 고정해야 한다.

### 2.3 운영자가 실제로 필요한 지표 세트가 따로 있다

- 조회수만으로는 어떤 글이 성과가 좋은지 판단하기 어렵다.
- 유입경로, 이탈률, 체류시간, 재방문, 랜딩/이탈 페이지까지 같이 봐야 의미가 생긴다.

## 3. 범위

이번 계획의 범위:

1. 관리자 대시보드 정보 구조 정의
2. overview / timeseries / top-posts / referrers / devices / landing-exit API 정의
3. 일별/포스트별/세션 기반 집계 계획 확장
4. `/admin`에서 보여줄 1차 UI 구성 정의
5. 기간 비교와 지표 정의 tooltip 정책 포함

이번 계획에서 제외:

- 실시간 스트리밍 대시보드
- 외부 광고 플랫폼 연동
- 개별 사용자 행동 재생 기능
- 대규모 BI 도구 수준의 자유 쿼리 인터페이스

## 4. 대시보드 정보 구조

### 4.1 Overview

첫 화면 KPI 카드:

- 총 조회수
- 순 방문자 수
- 세션 수
- 이탈률
- 평균 활성 체류시간
- 페이지당 조회수

보조 정보:

- 직전 기간 대비 증감률
- 집계 기준 기간
- 마지막 집계 시각

### 4.2 Content Performance

글 성과 섹션:

- 조회수 상위 글
- 최근 7일 급상승 글
- 평균 체류시간 상위 글
- 이탈률 높은 글
- 게시 후 1일 / 7일 / 30일 성과

### 4.3 Traffic Sources

유입 분석 섹션:

- direct / search / social / referral 비중
- 상위 referrer host
- UTM source / medium / campaign 성과
- 랜딩 페이지 상위 목록

### 4.4 Audience / Device

방문자 특성:

- mobile / desktop / tablet 비중
- 신규 방문자 / 재방문자 비율
- 시간대별 방문 분포
- 국가 또는 timezone 수준 분포

### 4.5 Engagement

참여 지표:

- 10초 이상 활성 체류 비율
- 스크롤 50% 도달률
- 평균 페이지뷰/세션
- 포스트 상세 engagement rate
- 완독 근사 지표

## 5. 추가 지표 정의

### 5.1 Returning Visitor Rate

권장 정의:

- 기간 내 동일 `visitorId`가 2회 이상 방문한 비율

### 5.2 Pages Per Session

권장 정의:

- `총 pageview / 총 session`

### 5.3 Post Engagement Rate

권장 정의:

- 포스트 상세 세션 중 engagement 이벤트가 1회 이상 발생한 비율

### 5.4 Landing-to-Bounce Rate

권장 정의:

- 특정 랜딩 페이지로 시작한 세션 중 bounce 세션 비율

### 5.5 Exit Page Rate

권장 정의:

- 세션의 마지막 pageview가 해당 페이지인 비율

### 5.6 Read Completion Proxy

권장 정의:

- 긴 활성 체류 + 높은 스크롤 도달을 조합한 완독 근사 지표

주의:

- 이는 정확한 “완독”이 아니라 운영 판단용 proxy임을 UI에 명시한다.

## 6. 데이터 모델 / 집계 확장 계획

### 6.1 기존 07번 계획 위에 추가할 집계 테이블

권장 추가 모델:

```prisma
model SiteAnalyticsDaily {
  id             BigInt   @id @default(autoincrement())
  date           DateTime
  pageViews      Int      @default(0)
  uniqueVisitors Int      @default(0)
  sessions       Int      @default(0)
  bounces        Int      @default(0)
  avgActiveMs    Int      @default(0)
}

model ReferrerAnalyticsDaily {
  id             BigInt   @id @default(autoincrement())
  date           DateTime
  referrerHost   String
  sessions       Int      @default(0)
  pageViews      Int      @default(0)
  uniqueVisitors Int      @default(0)
}

model PageAnalyticsDaily {
  id             BigInt   @id @default(autoincrement())
  date           DateTime
  pagePath       String
  postId         Int?
  pageViews      Int      @default(0)
  uniqueVisitors Int      @default(0)
  sessions       Int      @default(0)
  bounces        Int      @default(0)
  avgActiveMs    Int      @default(0)
}
```

### 6.2 세션 요약 확장

`AnalyticsSession`에 추가 검토할 필드:

- `entryPagePath`
- `entryPostId?`
- `exitPagePath?`
- `exitPostId?`
- `isReturningVisitor`
- `deviceCategory`
- `engaged`
- `pageDepth`

### 6.3 포스트 성과 파생 집계

포스트별로 별도 계산 가능한 값:

- 게시 후 1일 조회수
- 게시 후 7일 조회수
- 게시 후 30일 조회수
- 평균 활성 체류시간
- bounce rate
- 스크롤 milestone 도달률

## 7. API 계획

### 7.1 관리자 대시보드 API

권장 엔드포인트:

- `GET /analytics/dashboard/overview`
- `GET /analytics/dashboard/timeseries`
- `GET /analytics/dashboard/top-posts`
- `GET /analytics/dashboard/referrers`
- `GET /analytics/dashboard/devices`
- `GET /analytics/dashboard/landing-pages`
- `GET /analytics/dashboard/exit-pages`

공통 query:

- `from`
- `to`
- `timezone`
- `limit`
- `comparePrevious=true|false`

권한:

- `ADMIN` 전용

### 7.2 응답 예시

Overview 예시:

```ts
type AnalyticsDashboardOverviewResponse = {
  range: {
    from: string
    to: string
    timezone: string
  }
  totals: {
    pageViews: number
    uniqueVisitors: number
    sessions: number
    bounceRate: number
    avgActiveMs: number
    pagesPerSession: number
  }
  delta?: {
    pageViews: number
    uniqueVisitors: number
    sessions: number
    bounceRate: number
    avgActiveMs: number
    pagesPerSession: number
  }
  freshness: {
    lastAggregatedAt: string | null
  }
}
```

Top Posts 예시:

```ts
type TopPostAnalyticsItem = {
  postId: number
  title: string
  pageViews: number
  uniqueVisitors: number
  sessions: number
  bounceRate: number
  avgActiveMs: number
  engagementRate: number
}
```

## 8. UI 계획

### 8.1 기본 레이아웃

상단:

- 기간 필터 `Today / 7D / 30D / Custom`
- 비교 토글 `이전 기간 대비`
- timezone 표시
- 마지막 집계 시각

첫 줄:

- KPI 카드 5~6개

둘째 줄:

- 일별 조회수 추이 차트
- 유입경로 비중 차트

셋째 줄:

- 상위 글 테이블
- 상위 referrer 테이블

넷째 줄:

- 디바이스 분포
- 랜딩 페이지 / 이탈 페이지

### 8.2 1차 UI 범위

반드시 넣을 것:

- Overview KPI 카드
- 최근 7일 추이
- 상위 글 표
- 유입경로 표

2차로 미뤄도 되는 것:

- 고급 비교 차트
- 시간대 heatmap
- 재방문 cohort

### 8.3 지표 설명 UI

각 카드/표 항목에는 tooltip 또는 help text가 필요하다.

예:

- 조회수 정의
- bounce 기준
- 평균 활성 체류시간 정의
- 완독 근사 지표 정의

## 9. 집계 전략

### 9.1 1차는 배치 집계 기반으로 간다

권장안:

- 원본 이벤트 저장
- 세션 요약 업데이트
- 5분 또는 15분 단위 배치로 dashboard 집계 갱신

이유:

- `/admin` 대시보드는 완전 실시간일 필요가 낮다.
- 안정성과 구현 복잡도의 균형이 좋다.

### 9.2 비교 기간 계산

권장안:

- 현재 범위와 같은 길이의 직전 기간을 자동 계산
- 예: 최근 7일 선택 시 직전 7일과 비교

## 10. 테스트 계획

### 10.1 수치 일관성

- overview 총합과 상위 글 합이 논리적으로 맞는지 확인
- referrer 합계와 총 session/pageview 합이 크게 어긋나지 않는지 확인

### 10.2 권한 보호

- 비관리자 접근 차단
- 인증 없는 요청 차단

### 10.3 UI 검증

- 기간 필터 전환 시 데이터 갱신
- 데이터 없음 상태 표시
- tooltip/정의 문구 노출

### 10.4 집계 freshness

- 원본 이벤트 발생 후 다음 집계 주기에서 반영되는지 확인

## 11. 구현 순서 제안

1. `07_USAGE_ANALYTICS_PLAN.md` 기준 수집/세션/원본 이벤트 구현
2. 일별 집계 모델 확장
3. 관리자 dashboard API 구현
4. `/admin` KPI 카드와 표 UI 추가
5. 기간 비교/추이 차트 추가
6. 랜딩/이탈/재방문 지표 확장

## 12. 보류하면 안 되는 주의점

- 수집 기능 없이 대시보드부터 만들면 수치 정의가 계속 바뀐다.
- 대시보드 숫자에는 반드시 정의와 freshness가 같이 있어야 한다.
- 실시간성보다 집계 신뢰성과 일관성을 우선해야 한다.
- 조회수만 강조하면 운영 판단이 왜곡되므로 이탈률, 체류, 유입경로를 같이 봐야 한다.
