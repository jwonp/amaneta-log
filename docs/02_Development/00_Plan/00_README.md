# amaneta-log 개발 계획

> 이 디렉터리는 설계 아이디어가 아니라 실제 구현에 바로 들어갈 수 있는 실행 계획만 다룬다.

## 문서 구성

- [01_EDITOR_LIST_INFINITE_SCROLL_PLAN.md](./01_EDITOR_LIST_INFINITE_SCROLL_PLAN.md): `EditorListItemCard` props 기준 에디터 목록 무한스크롤 구현 계획
- [02_POST_UPLOAD_PLAN.md](./02_POST_UPLOAD_PLAN.md): 게시물 작성, 업로드, 첨부파일 상태 전이 구현 TODO
- [03_ACCESS_TOKEN_REFRESH_RECOVERY_PLAN.md](./03_ACCESS_TOKEN_REFRESH_RECOVERY_PLAN.md): access token 만료 시 refresh token으로 요청을 복구하고 실패 시 세션 종료를 처리하는 계획

## 문서 작성 기준

- 문서는 `목표 -> 현재 상태 -> 범위 -> 핵심 결정 -> 작업 계획 -> 테스트` 순서를 기본으로 한다.
- 프론트와 백엔드 책임이 섞이는 경우, API 계약을 먼저 고정하고 UI 계획을 뒤에 둔다.
- 기존 미구현 코드가 있을 때는 새 구현안뿐 아니라 현재 차단 지점도 같이 기록한다.
