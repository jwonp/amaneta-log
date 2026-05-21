# 이용자 통계 수집 기능 구현 계획

> 기준 파일:
> `apps/api/prisma/schema.prisma`
> `apps/api/src/post/*`
> `apps/api/src/main.ts`
> `apps/web/app/(main)/posts/page.tsx`
> `apps/web/app/(main)/posts/[postId]/page.tsx`
> `apps/web/app/layout.tsx`
> `apps/web/app/api/*`
> `apps/web/src/02_widgets/post/ui/PostList.tsx`
> `apps/web/src/02_widgets/post/ui/PostDetail.tsx`
>
> 이 문서는 `amaneta-log`에 조회수, 방문 세션, 이탈률, 유입경로, 읽기 지속시간 등 이용자 접속/이용 통계를 수집하고 조회할 수 있는 기능을 구현하기 위한 실행 계획을 정리한다.

## 1. 목표

- 공개 블로그 기준으로 페이지 조회수와 방문 세션을 수집할 수 있다.
- 포스트 단위 조회수, 순 방문자 수, 유입경로, 기기 분포, 기본 이탈률을 집계할 수 있다.
- 관리자 화면 또는 전용 API에서 일별/포스트별 통계를 조회할 수 있다.
- 개인정보를 과하게 저장하지 않으면서도 운영 의사결정에 필요한 수준의 통계를 남긴다.
- 봇/중복 새로고침/짧은 중복 이벤트로 인해 수치가 심하게 왜곡되지 않게 한다.

## 2. 현재 상태

### 2.1 공개 블로그 트래픽 수집 기능이 없다

- 현재 구조에는 별도 analytics event 저장 모델이나 트래킹 API가 없다.
- 포스트 목록과 상세 렌더링은 있지만 조회수나 세션 정보는 별도로 기록하지 않는다.

### 2.2 웹은 Next.js, API는 Nest + Prisma 구조다

- 통계 수집은 프론트에서 발생시킨 이벤트를 Next.js 또는 Nest API로 보내고, Prisma를 통해 저장하는 형태가 자연스럽다.
- 공개 블로그 경로는 `/posts`, `/posts/[postId]` 중심이므로 1차 수집 범위도 여기에 맞추는 것이 맞다.

### 2.3 통계 정의가 아직 없다

- “조회수”, “방문자 수”, “이탈률”, “읽은 시간”을 어떤 기준으로 계산할지 명확한 정책이 없다.
- 정의 없이 구현하면 이후 수치가 계속 흔들린다.

## 3. 범위

이번 계획의 1차 범위:

1. 공개 페이지 pageview / session / engagement 이벤트 수집
2. 포스트 상세 조회수 집계
3. 일별/포스트별 통계 테이블 또는 집계 뷰 설계
4. 관리자 조회용 API 설계
5. 개인정보 최소화와 중복 방지 정책 정리

1차 범위에서 제외:

- 실시간 대시보드
- 외부 광고/전환 추적
- 사용자 로그인 기반 퍼널 분석
- A/B 테스트 프레임워크
- 쿠키 동의 배너 수준의 법률 대응 구현

## 4. 통계 정의

### 4.1 조회수(Page View)

권장 정의:

- 공개 페이지가 실제 브라우저에서 렌더링된 뒤 pageview 이벤트가 1회 기록되면 조회수 1로 본다.
- 같은 세션에서 매우 짧은 시간 내 동일 URL 반복 진입은 중복 제거 대상이다.

권장 중복 제거 예:

- 동일 `sessionId`
- 동일 `pageType`
- 동일 `pageKey`
- 30초 이내 재진입

### 4.2 방문 세션(Session)

권장 정의:

- 익명 방문자 기준 브라우저 단위 `sessionId`를 발급한다.
- 30분 이상 활동이 없으면 새 세션으로 본다.

### 4.3 순 방문자(Unique Visitor)

권장 정의:

- 사용자 식별이 아닌 익명 `visitorId` 기준으로 본다.
- 장기 쿠키 또는 localStorage 기반 랜덤 UUID를 사용한다.

주의:

- 개인을 식별할 수 있는 계정 정보와 결합하지 않는다.

### 4.4 이탈률(Bounce Rate)

권장 정의:

- 세션 내 pageview가 1건뿐이고 의미 있는 engagement 이벤트가 없으면 bounce로 본다.

engagement 예:

- 10초 이상 활성 체류
- 50% 이상 스크롤
- 두 번째 pageview 발생

### 4.5 읽기 지속시간 / 체류시간

권장 정의:

- 포스트 상세에서 `pagehide`, `visibilitychange`, heartbeat를 조합해 활성 시간을 누적한다.
- 탭이 백그라운드로 간 시간은 제외한다.

## 5. 핵심 결정

### 5.1 1차는 자체 수집 방식으로 간다

권장안:

- 외부 SaaS를 붙이지 않고, 앱 내부에 이벤트 수집 API와 Prisma 저장 모델을 둔다.

이유:

- 블로그 규모에서 필요한 지표가 비교적 명확하다.
- 포스트/권한/관리 화면 구조와 자연스럽게 연결할 수 있다.
- 원본 이벤트와 집계 규칙을 직접 통제할 수 있다.

### 5.2 이벤트 원본과 집계 테이블을 분리한다

권장안:

- 원본 이벤트 테이블
- 세션 테이블
- 일별/포스트별 집계 테이블

이유:

- 원본 이벤트만 있으면 조회가 무겁다.
- 집계 테이블만 있으면 정의 변경이 어렵다.
- 둘을 분리해야 운영성과 분석 유연성을 같이 확보할 수 있다.

### 5.3 개인정보는 최소화한다

권장안:

- 저장 허용:
  - `visitorId` 익명 UUID
  - `sessionId`
  - `path`
  - `postId`
  - `referrer host`
  - `utm_*`
  - `device category`
  - `country` 또는 `timezone` 수준의 약한 지역 정보
- 저장 지양:
  - 원문 IP
  - 전체 User-Agent 원문
  - 개인 식별 가능한 계정 데이터

이유:

- 블로그 통계 기능에 원문 IP나 UA 전체 문자열이 필수는 아니다.
- 필요하면 해시 또는 coarse-grained 분류값만 보관하는 편이 낫다.

### 5.4 봇과 중복 이벤트를 초기에 방어한다

권장안:

- 알려진 bot UA 패턴 1차 차단
- `sendBeacon` + idempotency key
- 동일 세션/페이지 단위 짧은 중복 제거

이유:

- 조회수는 중복과 봇의 영향을 가장 많이 받는다.
- 1차 방어만 있어도 수치 왜곡이 크게 줄어든다.

### 5.5 공개 페이지만 먼저 수집한다

권장안:

- 1차 대상:
  - `/posts`
  - `/posts/[postId]`
- editor/admin/auth 경로는 제외

이유:

- 운영상 가장 의미 있는 지표는 공개 페이지 트래픽이다.
- 내부 도구 트래픽까지 섞으면 수치가 오염된다.

## 6. 데이터 모델 계획

### 6.1 원본 이벤트 테이블

권장 모델 예시:

```prisma
model AnalyticsEvent {
  id                BigInt   @id @default(autoincrement())
  createdAt         DateTime @default(now())
  visitorId         String
  sessionId         String
  eventType         AnalyticsEventType
  pageType          AnalyticsPageType
  pagePath          String
  postId            Int?
  referrerHost      String?
  utmSource         String?
  utmMedium         String?
  utmCampaign       String?
  deviceCategory    DeviceCategory?
  countryCode       String?
  durationMs        Int?
  scrollPercent     Int?
  isBounceCandidate Boolean  @default(false)
  dedupeKey         String?  @unique
}
```

권장 이벤트 타입:

- `PAGE_VIEW`
- `ENGAGEMENT`
- `PAGE_HIDE`
- `HEARTBEAT`

### 6.2 세션 테이블

```prisma
model AnalyticsSession {
  id              BigInt   @id @default(autoincrement())
  sessionId       String   @unique
  visitorId       String
  startedAt       DateTime
  endedAt         DateTime?
  landingPath     String
  landingPostId   Int?
  referrerHost    String?
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  pageViewCount   Int      @default(0)
  engagementCount Int      @default(0)
  totalActiveMs   Int      @default(0)
  isBounce        Boolean?
}
```

### 6.3 일별 집계 테이블

```prisma
model PostAnalyticsDaily {
  id             BigInt   @id @default(autoincrement())
  date           DateTime
  postId         Int
  pageViews      Int      @default(0)
  uniqueVisitors Int      @default(0)
  sessions       Int      @default(0)
  bounces        Int      @default(0)
  avgActiveMs    Int      @default(0)
}
```

추가 가능 집계:

- `SiteAnalyticsDaily`
- `ReferrerAnalyticsDaily`

## 7. 수집 플로우 계획

### 7.1 클라이언트 식별자

- 첫 방문 시 `visitorId` 생성 후 localStorage 저장
- 세션 시작 시 `sessionId` 생성
- 마지막 활동 시각 갱신
- 30분 inactivity 시 새 `sessionId`

### 7.2 pageview 수집

- 공개 페이지 hydration 후 1회 전송
- `navigator.sendBeacon()` 우선 사용
- fallback은 `fetch(..., { keepalive: true })`

전송 payload 예:

```ts
type TrackPageViewPayload = {
  visitorId: string
  sessionId: string
  pageType: "POST_LIST" | "POST_DETAIL"
  pagePath: string
  postId?: number
  referrerHost?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  viewport?: {
    width: number
    height: number
  }
}
```

### 7.3 engagement 수집

1차 권장 기준:

- 상세 페이지 진입 후 10초 활성 상태 도달
- 스크롤 50% 도달
- 15초 heartbeat마다 active duration 누적

### 7.4 종료 시각 수집

- `visibilitychange`
- `pagehide`

를 사용해 마지막 active duration flush

## 8. API 설계 계획

### 8.1 수집용 API

권장 엔드포인트:

- `POST /analytics/events`
- 또는 Next.js 프록시: `POST /api/analytics/events`

권장 이유:

- 브라우저는 웹 앱 기준 same-origin으로 호출
- 내부에서는 Nest API로 전달 가능

### 8.2 조회용 API

권장 관리자 API:

- `GET /analytics/summary?from=...&to=...`
- `GET /analytics/posts/:postId?from=...&to=...`
- `GET /analytics/referrers?from=...&to=...`

권한:

- ADMIN 전용

## 9. 집계 전략

### 9.1 1차는 write-time 최소 집계 + read-time 보조 조회

권장안:

- 원본 이벤트는 즉시 저장
- 세션 업데이트는 같은 트랜잭션 또는 큐 형태로 반영
- 일별 집계는 cron 또는 배치로 갱신

이유:

- 실시간 정확도와 구현 복잡도 사이에서 균형이 좋다.

### 9.2 배치 집계

권장 방식:

- Nest schedule 사용
- 5분 또는 15분 간격 증분 집계

집계 대상:

- site daily
- post daily
- referrer daily

## 10. 관리자 UI 계획

1차 화면 요구사항:

- 전체 요약:
  - 총 조회수
  - 순 방문자 수
  - 세션 수
  - 이탈률
- 포스트별:
  - 조회수 상위 글
  - 최근 7일 추이
  - 평균 체류시간
- 유입경로:
  - direct
  - search
  - social
  - referral

UI 위치:

- 기존 `/admin` 화면 하위 탭 또는 전용 analytics 섹션

## 11. 보안 및 운영 정책

- analytics 수집 엔드포인트에 rate limiting 적용
- 허용 origin 제한
- payload schema validation 적용
- raw IP 저장 금지 또는 비가역 해시 처리
- 관리자 조회 API는 `ADMIN` 권한 필수
- 과도한 이벤트 볼륨 대비 보존 기간 정책 필요

권장 보존 정책:

- 원본 이벤트: 90일 또는 180일
- 일별 집계: 장기 보관

## 12. 테스트 계획

### 12.1 수집 정확성

- 상세 페이지 진입 시 pageview 1건 저장
- 새로고침/짧은 재진입 시 중복 제거 동작
- 30분 inactivity 후 새 세션 생성

### 12.2 bounce 계산

- 단일 pageview + engagement 없음 -> bounce
- 상세 체류 10초 이상 -> non-bounce

### 12.3 권한 및 보안

- 비관리자 조회 API 접근 차단
- 잘못된 payload 400 처리
- 과도한 요청 rate limit 동작

### 12.4 집계 일관성

- 원본 이벤트 합과 일별 집계 수치 일치
- 포스트별 조회수와 사이트 총합 논리 검증

## 13. 구현 순서 제안

1. 지표 정의 확정
2. Prisma 모델 및 migration 추가
3. Nest analytics module / controller / service 추가
4. 공개 페이지 client tracker 추가
5. pageview / engagement / pagehide 이벤트 전송 연결
6. 관리자 조회 API 추가
7. 일별 집계 배치 추가
8. `/admin` 통계 화면 연결

## 14. 보류하면 안 되는 주의점

- 조회수와 순 방문자 수는 정의를 먼저 고정하지 않으면 나중에 비교가 불가능하다.
- 이탈률은 pageview만으로 계산하지 말고 engagement 기준을 같이 가져가야 한다.
- raw IP, 전체 User-Agent, 로그인 사용자 정보 결합은 초기 범위에서 피하는 것이 맞다.
- 봇과 짧은 중복 요청 방어 없이 시작하면 수치 신뢰도가 급격히 떨어진다.
