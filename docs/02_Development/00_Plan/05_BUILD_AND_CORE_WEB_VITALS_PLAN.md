# 빌드 최적화 및 Core Web Vitals 개선 계획

> 기준 파일:
> `apps/web/package.json`
> `apps/web/next.config.mjs`
> `apps/web/app/layout.tsx`
> `apps/web/app/(main)/posts/page.tsx`
> `apps/web/src/02_widgets/post/ui/PostList.tsx`
> `apps/web/src/02_widgets/post/ui/PostDetail.tsx`
> `apps/web/src/04_entities/markdown/ui/MarkDownPreview.tsx`
> `apps/web/src/05_shared/card/ui/PostListItemCard.tsx`
> `turbo.json`
> `docker-compose.yml`
> `apps/web/dockerfile`
> `apps/web/dockerfile.dev`
> `docs/02_Development/01_Guide/02_DOCKER_BUILD_OPTIMIZATION.md`
>
> 이 문서는 웹 앱의 빌드 시간, 배포 산출물, 그리고 LCP/INP/CLS 중심 사용자 체감 성능을 개선하기 위한 실행 계획을 정리한다.

## 1. 목표

- 웹 빌드 시간을 줄이고 캐시 적중률을 높인다.
- 공개 포스트 목록과 상세 페이지의 초기 렌더링 비용을 낮춘다.
- Core Web Vitals 목표를 운영 기준으로 관리한다.
- 개선 대상과 측정 지표를 연결해 회귀를 빠르게 감지할 수 있게 한다.

## 2. 현재 상태

### 2.1 빌드 파이프라인은 기본형이다

- `apps/web/package.json`에는 `build`, `lint`, `typecheck`만 있고 번들 분석/측정용 스크립트는 없다.
- `turbo.json`은 기본 캐시 설정만 있으며, 성능 측정이나 번들 리포트용 task는 없다.

### 2.2 Docker build 최적화는 일부 선행돼 있다

- `docs/02_Development/01_Guide/02_DOCKER_BUILD_OPTIMIZATION.md` 기준으로 build context 축소와 Dockerfile 레이어 개선은 이미 한 번 정리돼 있다.
- 하지만 웹 앱 번들 자체 최적화와 런타임 성능 관점 계획은 별도로 없다.

### 2.3 포스트 목록은 클라이언트 주도 렌더링이다

- `apps/web/src/02_widgets/post/ui/PostList.tsx`는 client component + React Query + infinite scroll 조합이다.
- 초기 JS 의존도가 높아 첫 렌더링과 상호작용 준비 시점에 불리할 수 있다.

### 2.4 마크다운 상세 렌더링은 전부 클라이언트 렌더러에 의존한다

- `apps/web/src/04_entities/markdown/ui/MarkDownPreview.tsx`는 `"use client"`이며 `react-markdown`, `remark-gfm`, `remark-breaks`를 사용한다.
- 공개 상세 페이지까지 클라이언트 번들에 markdown renderer 비용이 실릴 가능성이 크다.

### 2.5 이미지 전략은 부분적으로만 최적화돼 있다

- 목록 카드 썸네일은 `next/image`를 쓰고 있다.
- 하지만 상세 대표 이미지 구조가 아직 약하고, markdown 내부 이미지의 sizing/lazy/priority 전략도 분리되어 있지 않다.

## 3. 범위

이번 계획의 범위:

1. 빌드 측정 및 번들 가시성 확보
2. 포스트 목록/상세 렌더링 구조 개선
3. 이미지 및 markdown 렌더링 최적화
4. Core Web Vitals 측정/경고 체계 정의

이번 계획에서 제외:

- CDN 교체
- 인프라 단의 글로벌 캐시 계층 재설계
- 대규모 디자인 시스템 리라이트

## 4. 핵심 결정

### 4.1 측정 없이는 최적화를 진행하지 않는다

권장안:

- bundle 분석, build 시간, page weight, Core Web Vitals를 먼저 수집하는 경로를 추가한다.

이유:

- 현재는 어떤 변경이 실제로 개선인지 비교하기 어렵다.
- 체감상 느린 것과 실제 LCP/INP/CLS 병목은 다를 수 있다.

### 4.2 공개 페이지는 서버 렌더링 비중을 더 높인다

권장안:

- 포스트 목록 첫 페이지와 포스트 상세는 서버 중심으로 렌더링한다.
- 클라이언트는 hydration이 꼭 필요한 부분에만 남긴다.

이유:

- JS 번들 크기, hydration 비용, LCP 지연을 동시에 줄일 수 있다.
- 공개 콘텐츠 페이지에서 React Query 기반 클라이언트 fetch를 과하게 유지할 이유가 적다.

### 4.3 markdown 렌더러는 공개 상세에서 client component가 아니어야 한다

권장안:

- `MarkDownPreview`를 공개 상세용 서버 컴포넌트와 편집 preview용 클라이언트 컴포넌트로 분리한다.

이유:

- 현재 구조는 공개 상세 페이지까지 client markdown renderer 비용이 들어갈 수 있다.
- 편집 preview와 공개 상세는 요구사항이 다르므로 분리하는 편이 합리적이다.

### 4.4 LCP 후보를 명시적으로 관리한다

권장안:

- 포스트 목록과 상세에서 가장 큰 썸네일/대표 이미지를 LCP 후보로 보고, 크기/priority/placeholder 정책을 정한다.

이유:

- 이미지 비중이 높은 블로그 UI에서는 LCP가 이미지에서 많이 결정된다.
- 크기 미지정 또는 과한 지연 로딩은 LCP 악화로 바로 이어진다.

### 4.5 CLS는 skeleton과 실렌더링 레이아웃 일치를 우선한다

권장안:

- 카드, 상세 헤더, markdown 이미지 영역의 고정 비율/최소 높이 전략을 먼저 정한다.

이유:

- 지금 목록은 skeleton이 있으나, 상세 헤더와 markdown 본문 이미지 레이아웃은 더 엄격한 공간 예약이 필요할 수 있다.

## 5. 작업 계획

### 5.1 측정 도구 추가

- 웹 앱에 번들 분석 스크립트 추가
- 빌드 시간 측정과 산출물 확인용 명령 정리
- 운영/개발에서 Core Web Vitals 수집 지점을 정한다

권장 추가 항목:

- `ANALYZE=true next build` 계열 분석 스크립트
- `web-vitals` 기반 클라이언트 측정 훅 또는 Next.js 측정 경로

### 5.2 포스트 목록 초기 렌더링 서버화

- `/posts` 첫 페이지는 서버에서 데이터 fetch 후 렌더링
- infinite scroll은 후속 페이지에만 사용
- 초기 JS 의존도와 hydration량을 줄인다

예상 효과:

- TTFB 이후 콘텐츠 가시성 개선
- LCP 후보를 더 빨리 HTML에 포함
- 크롤러와 사용자 모두에게 유리

### 5.3 포스트 상세 markdown 렌더링 분리

- `MarkDownPreview`를 공개 상세용 서버 버전과 에디터 preview용 클라이언트 버전으로 분리
- 공개 상세는 서버 렌더링으로 보내고, 편집 preview만 클라이언트에서 유지

예상 효과:

- 상세 페이지 hydration 비용 감소
- bundle size 감소
- INP 개선 가능성 증가

### 5.4 이미지 정책 정리

- 목록 카드 첫 화면 썸네일:
  - 실제 LCP 후보면 `priority` 검토
  - 적절한 `sizes` 유지
- 상세 대표 이미지:
  - 있으면 명시적 크기 또는 aspect ratio 제공
  - blur placeholder 검토
- markdown 이미지:
  - width/height 또는 aspect ratio 추론이 가능하도록 장기 계획 수립

### 5.5 layout shift 방지

- 상세 헤더, 썸네일, 카드 영역에서 skeleton과 실데이터 높이 차이를 줄인다.
- 폰트는 이미 `next/font`를 쓰고 있으므로 유지하되, 폰트 로딩으로 인한 재배치가 없는지 확인한다.

### 5.6 인터랙션 비용 줄이기

- 포스트 목록 필터/검색이 붙을 경우 `useDeferredValue` 기반으로 입력-렌더링 분리
- markdown preview나 큰 리스트에서 불필요한 client state 전파를 줄인다
- editor 외 공개 페이지에서는 React Query 사용을 최소화한다

### 5.7 빌드/캐시 경로 정리

- `turbo.json`에 분석/측정용 task가 필요한지 검토
- 웹 빌드 산출물 캐시와 환경변수 의존성을 재확인
- Docker build 최적화 문서와 실제 Dockerfile 상태가 계속 일치하는지 점검

## 6. 핵심 측정 지표

운영 목표값:

- LCP: 2.5초 이하
- INP: 200ms 이하
- CLS: 0.1 이하

추가 관찰 지표:

- TTFB
- 초기 JS 번들 크기
- `/posts`와 `/posts/[postId]`의 hydration 비용
- build time
- Docker image build time

## 7. 테스트 계획

### 7.1 빌드 측정

- `pnpm build` 시간 비교
- 번들 분석 리포트 전후 비교
- Docker build 시간 전후 비교

### 7.2 렌더링 측정

- `/posts`
- `/posts/[postId]`

각 페이지에서 아래를 확인:

- LCP 후보 요소
- hydration 시점
- JS 전송량
- CLS 발생 여부

### 7.3 회귀 검증

- 목록 infinite scroll 동작 유지
- 상세 markdown 렌더링 결과 동일성 유지
- 썸네일/이미지 표시 품질 유지

## 8. 구현 순서 제안

1. 측정 스크립트와 baseline 수집
2. 포스트 목록 첫 페이지 서버 렌더링화
3. 공개 상세 markdown 서버 렌더링 분리
4. 이미지/LCP 정책 적용
5. CLS 방지 보강
6. 번들/빌드 캐시 정리
7. 재측정 및 회귀 확인

## 9. 보류하면 안 되는 주의점

- 측정 없이 bundle이나 렌더링 구조를 바꾸면 개선 여부를 판단할 수 없다.
- 공개 상세에 client-only markdown renderer를 계속 유지하면 SEO와 성능이 같이 손해를 본다.
- LCP 개선을 위해 모든 이미지를 `priority`로 두면 오히려 네트워크 경쟁이 심해질 수 있다.
- CLS는 이미지뿐 아니라 본문 상단 메타 영역과 skeleton 차이에서도 발생할 수 있다.
