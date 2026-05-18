# EditorListItemCard props 기준 에디터 목록 무한스크롤 구현 계획

> 기준 파일:
> `apps/web/src/02_widgets/editor/ui/EditorList.tsx`
> `apps/web/src/03_features/editor/api/editorList.api.ts`
> `apps/web/src/05_shared/card/model/card.type.ts`
> `apps/web/src/05_shared/card/ui/EditorListItemCard.tsx`
> `apps/api/src/post/post.controller.ts`
> `apps/api/src/post/post.service.ts`
> `apps/api/src/storage/storage.controller.ts`
>
> 이 문서는 `EditorListItemCard`가 요구하는 props에 맞춰 연결된 에디터 목록 무한스크롤의 구현 기준과 남은 확장 포인트를 정리한다.
> 목록 fetch, cursor 페이지네이션, 보호된 썸네일 경로는 이미 구현돼 있으므로, 아래 내용은 완료된 설계와 후속 보강 항목을 함께 다룬다.

## 1. 목표

- `/editor` 화면에서 작성 중인 초안과 발행된 글을 하나의 목록에서 계속 내려보며 확인할 수 있다.
- 첫 구현부터 검색과 기본 필터를 적용한 상태로 무한스크롤이 동작한다.
- 목록 아이템은 현재 `EditorListItemCard` props 구조를 그대로 사용한다.
- 목록 계약은 처음부터 cursor 기반으로 설계해, 데이터 증가 후에도 정렬 흔들림 없이 확장 가능해야 한다.
- 드래프트를 포함하는 관리자 목록이므로 공개 포스트 API와 책임을 분리한다.

## 2. 현재 상태

### 2.1 프론트엔드

- `apps/web/src/02_widgets/editor/ui/EditorList.tsx`는 `useEditorListApi`를 통해 실제 목록 fetch, 무한스크롤, 로딩/오류/빈 상태를 처리한다.
- `apps/web/src/03_features/editor/api/editorList.api.ts`는 `useInfiniteQuery` 기반으로 `GET /posts/editable`를 호출하고 카드 props로 매핑한다.
- `EditorListItemCard`는 아래 props를 요구한다.

```ts
type EditorListItemCardProps = {
  isPublic: boolean
  tags: string[]
  title: string
  description: string | null
  updatedAt: Date
  thumbnailSrc: string
  author: string
}
```

### 2.2 백엔드

- `apps/api/src/post/post.controller.ts`에는 공개 목록 `GET /posts`와 편집 목록 `GET /posts/editable`가 모두 구현돼 있다.
- 공개 상세 `GET /posts/:postId`와 관리자 수정용 `GET /posts/:postId/edit`도 분리돼 있다.
- 목록 API는 공개용과 편집용 DTO/cursor 계약이 분리된 상태다.

### 2.3 파일 접근 제약

- `apps/api/src/storage/storage.controller.ts`의 `GET /storage/posts/:postId/files/:fileId`는 발행된 공개 포스트 파일만 반환한다.
- 에디터 목록용으로는 `GET /storage/posts/:postId/files/:fileId/editable` 보호 경로가 추가돼 있어 드래프트 썸네일도 권한 검증 후 조회할 수 있다.

## 3. 범위

이번 계획의 초기 범위:

1. 에디터 목록 전용 API 계약 정의
2. cursor 기반 무한스크롤 계약 확정
3. 검색과 기본 필터를 포함한 query parameter 설계
4. React Query `useInfiniteQuery` 기반 목록 fetch 구조 설계
5. `EditorListItemCard` props로 변환하는 매핑 규칙 정리
6. 로딩, 오류, 빈 상태, 다음 페이지 로딩 UX 정의
7. 드래프트 썸네일 접근 방식 정리

초기 범위에서 제외:

- 정렬 기준을 사용자가 바꾸는 UI
- 다중 태그 조합, 기간 필터, 작성자 필터 같은 고급 검색
- URL 상태 동기화
- 가상 스크롤

## 4. 핵심 결정

### 4.1 공개 포스트 목록과 에디터 목록은 API를 분리한다

권장안:

- 공개 포스트 목록: `GET /posts`
- 에디터 목록: `GET /posts/editable`

이유:

- 에디터 목록은 `isPublic=false`인 초안을 포함한다.
- 목록 필터와 권한 정책이 공개 블로그 목록과 다르다.
- 처음부터 책임을 분리해야 DTO와 캐시 키가 깔끔해진다.

### 4.2 1차 무한스크롤부터 cursor 기반으로 구현한다

권장 쿼리:

```http
GET /posts/editable?limit=12&cursor=opaque-cursor
```

정렬 기준:

- `updatedAt desc`
- `id desc`

이유:

- 에디터 목록은 수정이 자주 일어나는 데이터라 page 기반보다 cursor 기반이 안전하다.
- 검색/필터가 붙으면 page 번호보다 "현재 조건에서 마지막으로 본 항목 이후"라는 의미가 더 중요해진다.
- 근시일 내 cursor 전환이 예정돼 있다면 지금 DTO와 서비스 계약을 바로 고정하는 편이 재작업이 적다.

cursor 규칙:

- cursor는 마지막 항목의 `updatedAt`, `id`를 기반으로 만든다.
- 서버는 cursor를 해석해 그 다음 구간만 조회한다.
- 프론트는 cursor 내용을 해석하지 않고 opaque string으로만 전달한다.

### 4.3 검색과 기본 필터도 첫 구현 범위에 포함한다

초기 지원 필터:

- `query`: 제목 + 설명 기준 부분 검색
- `visibility`: `all | public | draft`
- `tag`: 단일 태그 기준 필터

이유:

- 에디터 목록은 단순 최신순 탐색보다 특정 초안/발행본을 빨리 찾는 요구가 더 크다.
- `useInfiniteQuery`의 queryKey와 API DTO를 처음부터 필터 친화적으로 설계해야 추후 구조 변경이 줄어든다.
- 필터를 나중에 붙이면 cursor 정합성과 빈 상태 UX를 다시 손봐야 한다.

### 4.4 카드 props 매핑은 API DTO와 UI props를 한 번 분리한다

권장 구조:

- API 응답은 목록 전용 DTO를 사용한다.
- `useEditorListApi` 또는 별도 mapper에서 `EditorListItemCardProps`로 변환한다.

이유:

- 카드가 요구하는 `thumbnailSrc`, `author`는 현재 `Post` 엔터티에 직접 없다.
- 검색/필터용 메타데이터와 카드 렌더링 props는 변경 속도가 다를 가능성이 높다.
- UI 변경과 API 변경을 분리해야 안정적으로 확장된다.

### 4.5 드래프트 썸네일은 보호된 경로로 제공한다

현재 공개 파일 조회 라우트는 드래프트에 사용할 수 없으므로 아래 둘 중 하나가 필요하다.

권장안:

1. 백엔드에 `GET /storage/posts/:postId/files/:fileId/editable` 추가
2. Next.js에 `/api/storage/:postId/files/:fileId/editable` 프록시 추가

이유:

- 드래프트 썸네일은 권한 검증 후에만 노출돼야 한다.
- 검색/필터 결과에서 드래프트 카드가 섞여도 동일한 렌더링 경로를 유지할 수 있다.

## 5. API 계약 계획

### 5.1 백엔드 엔드포인트

권장 엔드포인트:

```http
GET /posts/editable?limit=12&cursor=opaque-cursor&query=foo&visibility=draft&tag=react
```

권한:

- `JwtAuthGuard`
- `RolesGuard`
- `@Roles("ADMIN")`

추가 정책:

- 기본 목록은 현재 로그인 사용자가 작성한 글만 조회한다.
- 추후 관리자가 전체 작성자 글을 보는 화면이 필요하면 별도 필터를 추가한다.

### 5.2 요청 파라미터 DTO

권장 요청 DTO:

```ts
type GetEditablePostListQueryDto = {
  limit?: number
  cursor?: string
  query?: string
  visibility?: "all" | "public" | "draft"
  tag?: string
}
```

기본값:

- `limit`: 12
- `visibility`: `all`

검증 규칙:

- `limit`는 최대치 제한이 필요하다. 예: `1 ~ 50`
- `query`는 trim 후 빈 문자열이면 미적용 처리
- `tag`도 trim 후 빈 문자열이면 미적용 처리
- `visibility`는 enum 검증
- `cursor`는 서버 decode 실패 시 400 처리

### 5.3 응답 DTO

권장 응답:

```ts
type EditablePostListItemDto = {
  id: number
  isPublic: boolean
  tags: string[]
  title: string
  description: string | null
  updatedAt: string
  author: string
  thumbnailFileId: number | null
}

type EditablePostListCursorDto = {
  nextCursor: string | null
  hasNextPage: boolean
}

type GetEditablePostListResponse = {
  items: EditablePostListItemDto[]
  pageInfo: EditablePostListCursorDto
  appliedFilters: {
    query: string | null
    visibility: "all" | "public" | "draft"
    tag: string | null
    limit: number
  }
}
```

포인트:

- 날짜는 JSON 직렬화 기준으로 `string`으로 받는다.
- `thumbnailSrc`는 프론트에서 보호 라우트 URL로 조합한다.
- 목록에서는 수정 화면 진입을 위해 `id`도 같이 내려준다.
- 응답에 `appliedFilters`를 포함하면 프론트 디버깅과 캐시 검증이 쉬워진다.

### 5.4 Prisma 조회 기준

권장 정렬:

- `updatedAt desc`
- `id desc`

권장 조회 필드:

- `id`
- `isPublic`
- `tags`
- `title`
- `description`
- `updatedAt`
- `author.username`
- `files` 중 `usage === THUMBNAIL`인 첨부 파일 id 1개

조회 로직 방향:

- `limit + 1`개를 조회해 다음 페이지 존재 여부를 판단한다.
- cursor가 있으면 `updatedAt`, `id` 복합 조건으로 다음 구간만 읽는다.
- `query`가 있으면 제목과 설명에 `OR` 검색을 건다.
- `visibility=draft`면 `isPublic=false`, `visibility=public`이면 `isPublic=true`, `all`이면 조건 미적용
- `tag`가 있으면 태그 포함 조건을 추가한다.

## 6. 프론트엔드 구현 계획

### 6.1 API 훅

대상 파일:

- `apps/web/src/03_features/editor/api/editorList.api.ts`

권장 책임:

- `useInfiniteQuery`로 cursor 단위 데이터 fetch
- 현재 검색/필터 상태를 queryKey에 포함
- `getNextPageParam`에서 `nextCursor` 사용
- 네트워크 DTO를 카드 렌더링용 목록으로 평탄화

예시 흐름:

```ts
const query = useInfiniteQuery({
  queryKey: ["editor-list", filters],
  initialPageParam: null,
  queryFn: ({ pageParam }) => fetchEditablePosts({ ...filters, cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
})
```

주의:

- 검색어가 바뀌면 기존 페이지는 폐기되고 새 queryKey로 다시 시작해야 한다.
- 필터 객체는 직렬화 안정성이 보장되는 형태로 관리해야 한다.

### 6.2 목록 UI

대상 파일:

- `apps/web/src/02_widgets/editor/ui/EditorList.tsx`

변경 방향:

- 클라이언트 컴포넌트로 전환한다.
- 검색 input과 기본 필터 UI를 목록 상단에 배치한다.
- 카드 목록 하단에 sentinel div를 두고 `IntersectionObserver`로 다음 cursor를 불러온다.
- 초기 로딩과 다음 페이지 로딩 UI를 분리한다.

권장 렌더링 순서:

1. 최초 로딩: 필터 영역 + 스켈레톤 카드
2. 데이터 있음: 필터 영역 + 카드 그리드
3. 추가 페이지 로딩 중: 하단 스켈레톤 1-2개
4. 오류: 재시도 버튼
5. 전체 빈 상태: `작성한 게시물이 없습니다`
6. 필터 결과 빈 상태: `조건에 맞는 게시물이 없습니다`

### 6.3 필터 상태 설계

초기 상태:

```ts
type EditorListFilters = {
  query: string
  visibility: "all" | "public" | "draft"
  tag: string | null
}
```

권장 UX:

- 검색 input은 debounce 후 요청한다.
- `visibility`는 segmented control 또는 select로 단순화한다.
- `tag`는 초기에는 드롭다운 또는 단일 선택 칩으로 제한한다.

주의:

- debounce 적용 시 입력값 상태와 요청 상태를 분리해야 한다.
- 필터 변경 직후 observer가 중복 fetch를 발생시키지 않도록 guard가 필요하다.

### 6.4 카드 props 매핑

권장 매핑:

| 카드 prop | 값 |
| --- | --- |
| `isPublic` | `item.isPublic` |
| `tags` | `item.tags` |
| `title` | `item.title` |
| `description` | `item.description` |
| `updatedAt` | `new Date(item.updatedAt)` |
| `author` | `item.author` |
| `thumbnailSrc` | `item.thumbnailFileId ? /api/storage/${item.id}/files/${item.thumbnailFileId}/editable : "/thumbnail-placeholder.svg"` |

주의:

- 현재 카드의 fallback 경로는 `/public/thumbnail-placeholder.svg`로 돼 있으면 `/thumbnail-placeholder.svg`로 정리해야 한다.
- `updatedAt` 파싱은 mapper에서 한 번만 처리해 카드 컴포넌트는 순수 렌더링에 집중하게 한다.

## 7. UX 상태 계획

### 7.1 빈 상태

- 전체 결과가 없을 때: `작성한 게시물이 없습니다`
- 검색/필터 결과가 없을 때: `조건에 맞는 게시물이 없습니다`

### 7.2 오류 상태

- 첫 페이지 실패: 목록 영역에 오류 메시지와 `다시 시도` 버튼 표시
- 다음 페이지 실패: 기존 목록은 유지하고 하단에 `더 불러오지 못했습니다` 재시도 버튼 표시
- 잘못된 cursor 응답은 새로고침 또는 필터 재적용 안내가 필요하다

### 7.3 끝 상태

- `hasNextPage === false`면 추가 fetch를 중단한다.
- 별도 종료 문구는 필수가 아니고, 카드 하단 여백만 유지해도 충분하다.

## 8. 테스트 계획

### 8.1 프론트엔드

- `useEditorListApi`가 `nextCursor`를 기준으로 다음 페이지를 계산하는지 확인
- 필터 값 변경 시 queryKey가 분리되고 첫 페이지부터 다시 조회하는지 확인
- DTO가 `EditorListItemCardProps` 형태로 올바르게 매핑되는지 확인
- `EditorList`가 sentinel 진입 시 `fetchNextPage`를 호출하는지 확인
- 검색 debounce 이후 요청이 발생하는지 확인
- 빈 상태, 필터 결과 빈 상태, 오류 상태, 추가 페이지 로딩 상태를 각각 검증

### 8.2 백엔드

- 로그인 사용자 기준으로 본인 글만 내려오는지 확인
- `updatedAt desc, id desc` 정렬이 안정적으로 유지되는지 확인
- `limit + 1` 기반으로 `hasNextPage`와 `nextCursor`가 올바른지 확인
- `query`, `visibility`, `tag` 조합이 예상대로 적용되는지 확인
- 썸네일 파일 id가 없을 때 `thumbnailFileId: null`을 반환하는지 확인
- 드래프트 썸네일 editable 조회 라우트가 권한 없이 열리지 않는지 확인
- 잘못된 cursor 값에 대해 400을 반환하는지 확인

## 9. 구현 순서

1. `GET /posts/editable` 요청/응답 DTO와 cursor 규약 고정
2. PostService 목록 조회 구현
3. 검색과 기본 필터 조건을 Prisma 쿼리에 반영
4. 드래프트 썸네일용 보호 파일 조회 경로 추가
5. Next.js `/api/posts/editable` 프록시 추가
6. `useEditorListApi` 구현
7. `EditorList`에 검색 input, visibility 필터, tag 필터 UI 연결
8. `EditorList`에 무한스크롤 sentinel 연결
9. 상태별 테스트 추가

## 10. 오픈 이슈

- 에디터 목록이 정말 `ADMIN 전용 전체 목록`인지, `현재 작성자 기준 내 글 목록`인지 정책 확인이 필요하다.
- `query` 검색 범위를 제목 + 설명까지만 볼지, 태그까지 포함할지 결정이 필요하다.
- 썸네일을 매번 프록시 스트리밍할지, 짧은 수명의 signed URL을 발급할지 운영 방식 결정을 해야 한다.
- 공개 블로그 목록도 곧 만들 계획이면 `GET /posts`의 공개 응답 DTO를 지금 같이 분리해 두는 편이 낫다.
