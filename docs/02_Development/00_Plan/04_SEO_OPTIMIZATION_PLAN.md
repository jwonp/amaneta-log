# SEO 최적화 계획

> 기준 파일:
> `apps/web/app/layout.tsx`
> `apps/web/app/page.tsx`
> `apps/web/next.config.mjs`
> `apps/web/app/(main)/posts/page.tsx`
> `apps/web/app/(main)/posts/[postId]/page.tsx`
> `apps/web/src/01_views/post/ui/PostListView.tsx`
> `apps/web/src/02_widgets/post/ui/PostList.tsx`
> `apps/web/src/02_widgets/post/ui/PostDetail.tsx`
> `apps/web/src/03_features/post/api/postDetail.server.ts`
> `apps/web/src/03_features/post/api/postList.api.ts`
>
> 이 문서는 `amaneta-log` 공개 블로그의 검색 노출 품질을 높이기 위한 실행 계획을 정리한다.

## 1. 목표

- 공개 포스트 목록과 상세 페이지가 검색엔진에 안정적으로 색인된다.
- 각 공개 페이지가 title, description, canonical, Open Graph, Twitter card를 가진다.
- 비공개/인증/관리 화면은 색인 대상에서 제외된다.
- 포스트 목록 첫 페이지와 포스트 상세는 검색엔진이 자바스크립트 실행 없이도 핵심 내용을 읽을 수 있다.
- sitemap, robots, 구조화 데이터까지 포함한 기본 SEO 표면을 완성한다.

## 2. 현재 상태

### 2.1 전역 metadata가 없다

- `apps/web/app/layout.tsx`에는 Next.js `metadata` export가 없다.
- 사이트 기본 title, description, metadataBase, Open Graph, Twitter 설정이 비어 있다.
- `<html lang="en">`으로 고정되어 있어 한국어 블로그와 맞지 않는다.

### 2.2 페이지 단위 metadata도 없다

- `apps/web/app/(main)/posts/page.tsx`와 `apps/web/app/(main)/posts/[postId]/page.tsx` 모두 `generateMetadata()`가 없다.
- 포스트 상세는 서버 컴포넌트로 전환되어 메타데이터 확장 기반은 있지만 실제 적용은 안 되어 있다.

### 2.3 목록 페이지가 클라이언트 fetch 중심이다

- `apps/web/src/02_widgets/post/ui/PostList.tsx`는 React Query `useInfiniteQuery`로 `/api/posts`를 호출한다.
- 따라서 검색엔진이 받는 초기 HTML에는 목록 콘텐츠가 충분히 포함되지 않을 수 있다.

### 2.4 색인 정책이 분리되어 있지 않다

- `robots.ts`, `sitemap.ts`가 없다.
- `/login`, `/signup`, `/editor`, `/admin`, 에러 페이지에 대한 `noindex` 정책도 없다.

### 2.5 포스트 본문 구조가 검색 친화적으로 충분히 노출되지 않는다

- `apps/web/src/02_widgets/post/ui/PostDetail.tsx`는 현재 markdown 본문만 렌더링한다.
- 제목, 설명, 작성자, 게시일, 대표 이미지 같은 문서형 정보가 본문 상단에 분명히 노출되지 않는다.

## 3. 범위

이번 계획의 범위:

1. 전역/페이지 metadata 구성
2. 공개/비공개 경로 색인 정책 분리
3. 포스트 목록 1페이지 SSR 기반 전환 계획
4. 포스트 상세 구조화 데이터 및 본문 헤더 보강
5. `robots.ts`, `sitemap.ts` 추가

이번 계획에서 제외:

- slug URL 전면 도입
- 다국어 SEO
- RSS/Atom feed
- 태그 아카이브 페이지 신설

## 4. 핵심 결정

### 4.1 공개 블로그와 인증/관리 영역의 색인 정책을 분리한다

권장안:

- index 대상:
  - `/posts`
  - `/posts/[postId]`
- noindex 대상:
  - `/login`
  - `/signup`
  - `/editor`
  - `/admin`
  - `/auth/error`
  - `/errors/*`
  - 기타 권한/오류 페이지

이유:

- 인증/편집/관리 화면은 검색 유입 가치가 없고 품질 신호를 떨어뜨릴 수 있다.
- 공개 페이지와 비공개 페이지의 메타데이터 전략은 처음부터 분리해야 한다.

### 4.2 포스트 상세를 SEO 1순위 표면으로 본다

권장안:

- `apps/web/app/(main)/posts/[postId]/page.tsx`에 `generateMetadata()`를 추가한다.
- 포스트 제목, 설명, 썸네일, canonical, OG/Twitter card를 상세 페이지 단위로 생성한다.

이유:

- 검색 유입의 핵심 landing page는 대개 상세 페이지다.
- 현재 상세는 서버 컴포넌트라 가장 낮은 비용으로 개선할 수 있다.

### 4.3 목록 첫 페이지는 서버에서 렌더링한다

권장안:

- `/posts` 첫 페이지는 서버 fetch로 초기 목록을 렌더링한다.
- 이후 페이지부터만 클라이언트 infinite scroll을 사용한다.

이유:

- 초기 HTML에 목록 카드와 링크가 포함돼야 크롤러 친화적이다.
- 현재 클라이언트 전용 목록은 색인 안정성이 떨어질 수 있다.

### 4.4 canonical과 metadataBase를 먼저 고정한다

권장안:

- 사이트 절대 URL을 환경변수 기반으로 고정한다.
- `metadataBase`와 canonical URL 생성 로직을 공통화한다.

이유:

- 현재 `/`는 `next.config.mjs`에서 `/posts`로 영구 리다이렉트된다.
- canonical 기준이 없으면 `/`와 `/posts`의 대표 URL 신호가 흔들릴 수 있다.

### 4.5 구조화 데이터는 최소 세트부터 도입한다

권장안:

- 전역 또는 목록: `WebSite` 또는 `Blog`
- 포스트 상세: `BlogPosting`

이유:

- 메타 태그만으로도 기본 SEO는 가능하지만, 게시물형 콘텐츠는 구조화 데이터 이점이 크다.
- 처음부터 과한 스키마를 넣기보다 핵심 필드만 정확히 넣는 편이 낫다.

## 5. 작업 계획

### 5.1 전역 metadata 추가

- `apps/web/app/layout.tsx`에 `export const metadata` 추가
- 포함 항목:
  - `metadataBase`
  - 기본 `title`
  - 기본 `description`
  - `openGraph`
  - `twitter`
  - 기본 `robots`
- `<html lang="ko">`로 정리

### 5.2 공개/비공개 경로 metadata 정책 분리

- `(auth)` 레이아웃 또는 각 auth/error 페이지에 `robots: { index: false, follow: false }` 설정
- editor/admin/error 계열 페이지에도 동일 정책 적용

### 5.3 포스트 상세 `generateMetadata()` 구현

- `getPostDetail()` 기반으로 포스트 데이터를 읽어 metadata 생성
- 우선 필드:
  - title: 포스트 제목
  - description: 포스트 설명
  - canonical: `/posts/{postId}`
  - OG image: 썸네일 있으면 사용
  - article published/modified time

### 5.4 포스트 상세 본문 헤더 보강

- `PostDetail.tsx` 상단에 최소 문서 헤더 추가
  - `h1`
  - description
  - author
  - updatedAt 또는 publishedAt
  - thumbnail

### 5.5 포스트 목록 SSR 1페이지 전환

- `/posts` 페이지에서 서버 fetch로 첫 페이지 데이터를 받아 렌더링
- `PostList`는 initial data를 받을 수 있게 분리
- infinite scroll은 2페이지 이후만 담당

### 5.6 robots와 sitemap 추가

- `apps/web/app/robots.ts`
  - 공개 포스트 색인 허용
  - auth/editor/admin/error 경로는 disallow 또는 noindex 정책과 병행
- `apps/web/app/sitemap.ts`
  - `/posts`
  - 공개 포스트 상세 URL 전체

### 5.7 구조화 데이터 추가

- 상세 페이지에 `BlogPosting` JSON-LD 삽입
- 포함 필드:
  - headline
  - description
  - author
  - datePublished
  - dateModified
  - image
  - mainEntityOfPage

## 6. 테스트 계획

### 6.1 메타데이터 검증

- `/posts` 응답 HTML에 title/description/canonical 존재
- `/posts/[postId]` 응답 HTML에 포스트별 메타데이터 존재
- 로그인/에러/에디터 페이지에 noindex 적용 확인

### 6.2 색인 표면 검증

- `robots.txt` 응답 확인
- `sitemap.xml` 생성 확인
- sitemap에 공개 포스트만 포함되는지 확인

### 6.3 렌더링 검증

- 목록 첫 페이지 HTML에 포스트 카드 링크/텍스트가 포함되는지 확인
- 상세 페이지 HTML에 `h1`, 설명, 본문이 서버 응답에 포함되는지 확인

## 7. 구현 순서 제안

1. 전역 metadata와 lang 정리
2. 공개/비공개 색인 정책 추가
3. 포스트 상세 `generateMetadata()` 추가
4. 포스트 상세 문서 헤더 보강
5. `robots.ts` / `sitemap.ts` 추가
6. 포스트 목록 SSR 1페이지 전환
7. 구조화 데이터 추가

## 8. 보류하면 안 되는 주의점

- 비공개 포스트, 드래프트, 관리자 페이지가 sitemap에 들어가면 안 된다.
- canonical 기준 URL은 환경변수 기반으로 하나로 고정해야 한다.
- 포스트 목록을 전부 클라이언트 fetch에만 의존하면 SEO 효과가 제한된다.
- 포스트 상세 메타데이터는 raw markdown 전체가 아니라 제목/설명 중심으로 요약해야 한다.
