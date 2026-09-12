# 작업 계획: 필터 칩 UX — 별도 뱃지 제거

## 현재 동작

```
[PostTagFilterBar] → Toggle 칩 (pressed 상태로 on/off 됨)
[ActiveTagFilters] → 선택된 태그를 Badge 칩으로 또 그림 (remove 버튼 포함)
```

선택하면 두 곳에 중복 표시된다. 원하는 건 Toggle 칩만 on/off되는 것.

## 원인

`PostListClient.tsx:103-110`에서 `selectedTags.length > 0`이면 `ActiveTagFilters`를 렌더한다.  
`PostTagFilterBar`의 `Toggle` 컴포넌트는 이미 `pressed` 상태로 시각적 on/off를 처리하고 있다.

## 작업

**파일 1**: `apps/web/src/02_widgets/post/ui/PostListClient.tsx`

- line 8: `ActiveTagFilters` import 삭제
- line 103-110: `{selectedTags.length > 0 && <ActiveTagFilters ... />}` 블록 삭제
- line 82-87: `removeTag`, `clearAll` 콜백 — `PostList`의 `onClearFilters`에 `clearAll`은 계속 필요하니 유지

**파일 2**: `apps/web/src/03_features/post/filter/ui/ActiveTagFilters.tsx`

- 다른 곳에서 쓰이는지 grep 확인 후 미사용이면 파일 삭제

## 검증

- 태그 클릭 시 Toggle 칩만 활성화, 아래 뱃지 없음
- 다시 클릭 시 해제
- "더 보기" 팝오버 태그도 체크마크만으로 on/off
