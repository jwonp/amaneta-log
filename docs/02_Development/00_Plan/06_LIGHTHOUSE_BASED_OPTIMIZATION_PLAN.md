# Lighthouse 리포트 기반 추가 최적화 계획

> 기준 파일:
> `/Users/joowon/Downloads/blog.amaneta.me-20260520T122750.html`
> `apps/web/app/layout.tsx`
> `apps/web/app/(main)/posts/page.tsx`
> `apps/web/app/(main)/posts/[postId]/page.tsx`
> `apps/web/src/02_widgets/post/ui/PostList.tsx`
> `apps/web/src/02_widgets/post/ui/PostDetail.tsx`
> `apps/web/src/04_entities/markdown/ui/MarkDownPreview.tsx`
> `apps/web/src/05_shared/card/ui/PostListItemCard.tsx`
> `apps/web/src/04_entities/header/ui/HeaderMenuItem.tsx`
> `apps/web/src/05_shared/logo/ui/Logo.tsx`
>
> 이 문서는 2026-05-20에 생성된 Lighthouse HTML 리포트
> `blog.amaneta.me-20260520T122750.html`
> 을 기준으로, 기존 SEO/성능 계획 외에 추가로 반영해야 할 최적화 항목을 정리한다.

## 1. 목표

- Lighthouse에서 드러난 실제 병목을 코드 구조에 연결해 우선순위를 명확히 한다.
- TTFB, LCP 이미지 탐색, 접근성 기본 결손, 캐시/JS 잔여 최적화를 별도 추적한다.
- 이미 작성한 SEO/성능 문서와 중복되지 않게, 리포트 기반 보강 항목만 정리한다.

## 2. 현재 상태

### 2.1 리포트 개요

대상 URL:

- `https://blog.amaneta.me/posts`

Lighthouse 핵심 점수:

- Performance: `0.92`
- Accessibility: `0.81`
- Best Practices: `1.00`
- SEO: `0.83`

핵심 수치:

- FCP: `0.9s`
- LCP: `1.4s`
- Speed Index: `1.7s`
- TTI: `1.4s`
- TBT: `0ms`
- CLS: `0`

### 2.2 가장 큰 병목은 문서 응답 지연이다

- `server-response-time`: 루트 문서 응답 `640ms`
- `document-latency-insight`: 예상 절감 시간 `540ms`

즉 현재는 main-thread나 CLS가 아니라, 첫 문서 응답이 가장 먼저 줄여야 할 병목이다.

### 2.3 LCP 요소가 lazy 이미지로 잡힌다

- `lcp-discovery-insight`
- `lcp-breakdown-insight`

샘플 노드:

```html
<img alt="Blog thumbnail placeholder" loading="lazy" ...>
```

즉 목록 첫 카드 썸네일이 LCP 후보인데, lazy 로딩 상태로 탐색되고 있다.

### 2.4 JS 최적화 여지는 남아 있다

- `unused-javascript`: 약 `25KiB` 절감 가능
- `legacy-javascript-insight`: 약 `13KiB` 절감 가능

주요 대상:

- `/_next/static/chunks/04st6949xeclh.js`

### 2.5 캐시 수명 설정이 일부 약하다

- `cache-insight`: 약 `6KiB` 절감 가능

샘플 대상:

- `https://static.cloudflareinsights.com/beacon.min.js/...`
- `/user.svg`
- `/user-white.svg`

### 2.6 접근성과 기본 SEO 결손이 아직 크다

주요 실패 항목:

- `document-title`
- `meta-description`
- `landmark-one-main`
- `color-contrast`
- `list`
- `listitem`

즉 전역 metadata와 main landmark, 내비게이션 마크업, 대비비 개선이 아직 필요하다.

### 2.7 bfcache 차단 원인이 있다

- `bf-cache`: 실패 이유 `2개`

원인은 리포트 HTML만으로는 바로 확정되지 않았으므로, 실제 브라우저 진단으로 차단 원인을 따로 확인해야 한다.

## 3. 범위

이번 계획의 범위:

1. TTFB 개선
2. LCP 이미지 탐색/우선순위 개선
3. 접근성/기본 SEO 결손 보완
4. 캐시/잔여 JS 최적화
5. bfcache 차단 원인 확인

이번 계획에서 제외:

- 근본적인 CDN/인프라 이전
- 대규모 디자인 리뉴얼
- 전체 라우팅 체계 변경

## 4. 핵심 결정

### 4.1 가장 먼저 줄일 것은 TTFB다

권장안:

- `/posts` 응답 생성 경로를 서버 렌더링 기준으로 단순화하고, 첫 페이지 데이터 조회 비용을 줄인다.

이유:

- 현재 리포트에서 가장 큰 절감 잠재력은 문서 응답 지연이다.
- TBT, CLS는 이미 양호하므로 서버 응답과 HTML 생성 비용이 우선순위가 더 높다.

### 4.2 LCP 후보 이미지는 lazy로 두면 안 된다

권장안:

- 목록 첫 화면의 대표 카드 썸네일 중 최소 1개는 `priority` 또는 eager 전략으로 관리한다.
- LCP 후보가 되는 썸네일은 서버 HTML에서 빠르게 탐색 가능해야 한다.

이유:

- Lighthouse가 실제로 lazy loaded image를 LCP 후보로 잡고 있다.
- 현재 LCP 수치는 나쁘지 않지만, 탐색 전략이 비효율적이라 변동성에 취약하다.

### 4.3 SEO와 접근성 기본기부터 마무리한다

권장안:

- `title`, `meta description`, `main` landmark, navigation list 구조, color contrast를 우선 고친다.

이유:

- 이 항목들은 구현 난이도 대비 Lighthouse 개선 폭이 크다.
- SEO 문서와 접근성 품질을 동시에 올릴 수 있다.

### 4.4 JS 절감은 구조 변경 후 따라오는 2차 효과로 본다

권장안:

- 공개 목록과 상세를 더 서버 중심으로 바꾸면서 불필요한 client JS를 줄인다.
- 단순 minification이나 미세 조정보다 렌더링 구조 전환을 우선한다.

이유:

- 절감 대상 JS 규모는 아주 크지 않다.
- 하지만 현재 목록/markdown 구조를 서버 쪽으로 옮기면 자연스럽게 번들 감소 효과가 생긴다.

### 4.5 bfcache는 추정하지 말고 원인을 확인한다

권장안:

- Chrome DevTools의 bfcache 진단으로 정확한 차단 이유 2개를 확인한 후 수정한다.

이유:

- Lighthouse HTML 요약만으로는 정확한 blocking API를 확정할 수 없다.
- 잘못 추정하면 불필요한 수정이 늘어난다.

## 5. 작업 계획

### 5.1 TTFB 개선

- `/posts` 첫 페이지를 서버 렌더링 기준으로 재구성
- 초기 목록 fetch 경로를 단순화
- 불필요한 서버-서버 프록시 hop이 있는지 확인
- 첫 페이지 데이터에 대해 캐시 전략 또는 revalidate 정책을 검토

우선 확인할 포인트:

- `apps/web/app/(main)/posts/page.tsx`
- 목록 데이터가 서버에서 직접 조립 가능한지 여부
- 요청 체인이 `브라우저 -> Next route -> 백엔드`로 한 번 더 꺾이는지 여부

### 5.2 LCP 이미지 최적화

- `PostListItemCard`의 첫 화면 카드 썸네일 중 최소 1개는 lazy 해제 검토
- 실제 fold 안에 들어오는 카드에만 `priority` 적용
- `sizes`가 실제 grid 폭과 맞는지 재검토
- placeholder alt 문구도 실제 콘텐츠 중심으로 교정

우선 확인 파일:

- `apps/web/src/05_shared/card/ui/PostListItemCard.tsx`

### 5.3 전역 SEO/접근성 기본기 보강

- `layout.tsx`에 전역 `metadata` 추가
- `<main>` landmark 도입
- navigation list 구조를 올바른 `<ul><li>` 계층으로 정리
- 대비 부족 버튼 색상 보정

우선 확인 파일:

- `apps/web/app/layout.tsx`
- `apps/web/src/04_entities/header/ui/HeaderMenuItem.tsx`
- navigation-menu wrapper를 사용하는 header 영역

### 5.4 페이지별 metadata 보강

- `/posts`와 `/posts/[postId]`에 title/description/canonical 추가
- 에러/인증/관리 페이지는 `noindex`

이 항목은 기존 `04_SEO_OPTIMIZATION_PLAN.md`의 실행을 앞당기는 의미가 크다.

### 5.5 캐시 수명 보강

- 정적 public asset 응답 헤더 확인
- `/user.svg`, `/user-white.svg`, 기타 고정 아이콘에 장기 캐시 정책 적용 검토
- Cloudflare beacon은 직접 제어 범위 밖이므로 우선순위를 낮춘다

### 5.6 JS 잔여 최적화

- 공개 상세 markdown 렌더링을 서버 컴포넌트 쪽으로 분리
- 공개 목록의 client-only fetch 의존도 축소
- 필요 시 번들 분석으로 `04st6949xeclh.js`가 어느 경로에서 커지는지 확인

### 5.7 bfcache 진단

- 실제 브라우저에서 `/posts` 페이지의 bfcache 차단 원인 2개 확인
- `unload` 계열 이벤트, no-store 정책, 동기 API 사용 여부를 점검

## 6. 테스트 계획

### 6.1 Lighthouse 재측정

- 동일 URL `https://blog.amaneta.me/posts`
- 동일 조건에서 전후 비교

특히 확인할 항목:

- `server-response-time`
- `document-latency-insight`
- `lcp-discovery-insight`
- `unused-javascript`
- `document-title`
- `meta-description`
- `landmark-one-main`

### 6.2 DOM/마크업 검증

- 페이지에 단일 `<main>` 존재
- 내비게이션 list 구조 유효성 확인
- title/meta description/canonical 확인

### 6.3 LCP 검증

- 첫 화면 대표 카드 이미지가 lazy 상태로 잡히지 않는지 확인
- `priority`를 적용한 이미지 수가 과도하지 않은지 확인

## 7. 구현 순서 제안

1. 전역 metadata + main landmark + navigation 구조 수정
2. `/posts` 첫 페이지 서버 렌더링 보강
3. 첫 화면 LCP 썸네일 eager/priority 전략 적용
4. 상세/목록 JS 절감 구조 반영
5. 정적 asset 캐시 정책 점검
6. bfcache 원인 확인 후 별도 수정
7. Lighthouse 재측정

## 8. 다른 계획 문서와의 관계

- `04_SEO_OPTIMIZATION_PLAN.md`
  - metadata, canonical, noindex, sitemap 실행 계획의 상위 문서
- `05_BUILD_AND_CORE_WEB_VITALS_PLAN.md`
  - 렌더링 구조, LCP, JS 번들 최적화의 상위 문서

이 문서는 위 두 문서의 일반 계획 중, 2026-05-20 Lighthouse 실측으로 우선순위가 확인된 항목만 별도로 추적한다.

## 9. 보류하면 안 되는 주의점

- 현재 Lighthouse에서 가장 낮은 점수는 TTFB와 기본 SEO/접근성 결손이다.
- LCP 수치가 이미 괜찮다고 해서 LCP 이미지 lazy 문제를 방치하면 이후 콘텐츠 증가 시 쉽게 악화될 수 있다.
- `priority` 이미지를 여러 개 남발하면 오히려 네트워크 경쟁이 심해질 수 있다.
- bfcache는 차단 원인을 확인하기 전까지 추정 수정하지 않는다.
