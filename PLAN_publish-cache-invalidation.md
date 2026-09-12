# 작업 계획: 발행 후 /posts 즉시 미반영 이슈

## 캐시 레이어 구조

```
[1] Server-side: unstable_cache (revalidate: 300s = 5분)
    postList.server.ts:32 — getCachedInitialPostListInternal()
    → /posts 페이지 SSR 시 initialPage 데이터 제공

[2] Client-side: React Query useInfiniteQuery (staleTime: 60s default)
    postList.api.ts:22 — initialData = initialPage (SSR에서 받은 값)
    → initialData는 stale로 간주되어 즉시 background refetch 트리거
    → /api/posts → backend 직접 호출 (캐시 없음) → 최신 데이터 반환
```

## 발행 흐름

```
EditorForm.tsx:298 — PATCH /api/posts/${postId} (saveMode: "PUBLISH")
    ↓
app/api/posts/[postId]/route.ts:39 — backend에 patch 프록시
    ↓ (캐시 무효화 없음)
EditorForm.tsx:320 — router.push("/editor")
    ↓
유저가 /posts 이동
    ↓
page.tsx:35 — getCachedInitialPostList() → 5분짜리 캐시 히트 → 구 데이터
    ↓
PostListClient → initialPage(구 데이터)로 렌더
    ↓
React Query background refetch → /api/posts → 최신 데이터 → UI 업데이트
```

## 실제 증상

1. /posts 진입 시 새 포스트 없는 목록 표시 (SSR cached initialPage)
2. React Query refetch 완료 후 새 포스트 나타남 (짧은 딜레이)

Layer 2(React Query)는 `initialData`를 stale로 보고 즉시 refetch하므로 자체적으로는 최신 데이터를 얻는다.  
문제는 Layer 1(unstable_cache)이 초기 SSR 렌더를 5분 동안 구 데이터로 묶어둔다는 것.

## 작업

**파일 1**: `apps/web/app/api/posts/[postId]/route.ts`

PATCH 핸들러에서 backend 성공 응답 후 `saveMode === "PUBLISH"`이면 `revalidatePath("/posts")` 호출.

```ts
import { revalidatePath } from "next/cache"

export const PATCH = async (request: NextRequest, context: RouteContext) => {
  const requestApi = await createServerRequestApi(request)
  const { postId } = await context.params
  const payload = await request.json()

  try {
    const { data, status } = await requestApi.patch(`/posts/${postId}`, payload)

    // publish 시 /posts SSR 캐시 무효화
    if (payload.saveMode === "PUBLISH") {
      revalidatePath("/posts")
    }

    return NextResponse.json(data, { status })
  } catch (error) {
    // ... 기존 에러 핸들링
  }
}
```

`revalidatePath("/posts")`는 `unstable_cache` 항목을 즉시 무효화한다.  
이후 /posts 방문 시 서버가 backend에서 최신 데이터를 fetch → 새 포스트가 initialPage에 포함.

**파일 2 (선택)**: `apps/web/src/02_widgets/editor/ui/EditorForm.tsx`

현재 발행 후 `/editor`로 redirect된다 (line 320). UX 개선 차원에서 `/posts`로 바꾸는 방안을 검토.  
→ 별도 UX 결정 필요. 지금 이슈 해결 범위 밖.

## 검증

1. 포스트 발행 → `/posts` 방문
2. SSR 단계에서 새 포스트가 initialPage에 포함되는지 확인 (Network 탭에서 HTML 소스 확인)
3. React Query refetch 없이 초기 렌더에 새 포스트 표시
