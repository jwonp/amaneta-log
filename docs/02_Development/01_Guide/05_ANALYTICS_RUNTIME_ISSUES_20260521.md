# Analytics Runtime Issues - 2026-05-21

## 범위

- 운영 환경 브라우저 콘솔 경고
- `POST /api/analytics/events` 500
- 운영 서버 Prisma CLI 실행 오류

## 확인된 증상

### 1. `POST /api/analytics/events` 500

- 브라우저 콘솔에서 `POST https://blog.amaneta.me/api/analytics/events 500`
- 첫 페이지 진입 시 page view 이벤트가 실패

### 2. Cloudflare Insights 스크립트 차단

- 브라우저 콘솔에서 `https://static.cloudflareinsights.com/beacon.min.js/...` 차단
- CSP 위반 메시지 출력

### 3. 이미지 preload 경고

- `/api/storage/.../files/...` 경로 이미지에 대해 preload 경고 출력
- `next/image`가 preload한 리소스가 load 직후 바로 소비되지 않았다는 경고

### 4. 운영 서버 `prisma generate` 실패

- 배포 서버 호스트에서 `pnpm --filter api prisma:generate` 실행 시 `ERR_REQUIRE_ESM`
- 현재 서버 Node 버전은 `v18.19.1`
- 프로젝트 `package.json` 엔진 요구사항은 `node >= 20`

## 원인 정리

### 1. Analytics 500의 직접 원인

`apps/api/src/analytics/analytics.service.ts`에서 `AnalyticsEvent`를 먼저 insert하고, 그 뒤에 `AnalyticsSession`을 생성 또는 갱신한다.

하지만 `AnalyticsEvent.sessionId`는 `AnalyticsSession.sessionId`를 참조하는 foreign key를 가진다. 새 세션의 첫 이벤트는 아직 부모 세션이 없으므로 insert 순서에 따라 FK 오류가 발생할 수 있다.

정리:

- 현재 순서: `analyticsEvent.create()` -> `upsertSession()`
- 필요한 순서: `session ensure` -> `analyticsEvent.create()` -> `session counters update`

### 2. Cloudflare 스크립트 차단 원인

`apps/web/next.config.mjs`의 CSP가 `script-src 'self' ...`로 제한되어 있어 Cloudflare Insights 스크립트 출처를 허용하지 않는다.

### 3. preload 경고 원인

카드 이미지 컴포넌트 일부가 `priority`로 렌더링되어 preload가 생성되지만, 브라우저 입장에서는 해당 리소스가 즉시 중요한 렌더링에 사용되지 않는 경우가 있다.

이는 기능 장애라기보다 최적화 경고에 가깝다.

### 4. Prisma CLI 실패 원인

운영 서버 호스트에서 Prisma CLI를 Node 18로 실행하고 있다. 현재 Prisma 7 계열과 저장소 설정은 Node 20 이상을 전제로 하고 있으므로, 호스트에서 직접 `prisma generate`를 돌리면 ESM/CJS 경계에서 실패할 수 있다.

## 이번 패치 범위

이번 작업에서는 실제 장애인 analytics 500을 우선 수정하고, 함께 확인된 운영 이슈 중 즉시 완화 가능한 항목도 반영한다.

- 세션 보장 로직과 카운터 반영 로직 분리
- 새 세션의 첫 이벤트가 FK 오류 없이 저장되도록 순서 수정
- dedupe된 이벤트는 세션 카운터를 잘못 올리지 않도록 유지
- Cloudflare Insights 스크립트/비콘 출처를 CSP에 허용
- 게시물 리스트 카드 이미지 preload 경고를 줄이기 위해 목록 카드 `priority` 사용 제거
- 호스트 Node 18에서 Prisma CLI를 직접 실행하지 않도록 dev 배포 스크립트 추가

다음 항목은 별도 작업으로 분리한다.

- 운영 서버 Node 20 정렬 및 Prisma 실행 절차 정리
- Cloudflare Insights를 유지할지 완전히 제거할지 제품/인프라 기준 확정

## 운영 체크리스트

### analytics 패치 배포 후

- `/posts` 진입 시 `/api/analytics/events`가 200 또는 deduped success로 응답하는가?
- 새 visitor/session 조합에서 첫 page view가 저장되는가?
- `AnalyticsSession.pageViewCount`, `engagementCount`, `isBounce`가 의도대로 반영되는가?

### Prisma 실행 시

- production DB 마이그레이션은 `prisma migrate dev` 대신 `prisma migrate deploy`를 사용한다.
- Prisma CLI는 Node 20 환경 또는 컨테이너 내부에서 실행한다.
