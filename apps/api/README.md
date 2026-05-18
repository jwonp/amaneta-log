# amaneta-log API

`apps/api`는 게시물, 인증, 스토리지 기능을 담당하는 NestJS 애플리케이션이다.

## 1. 문서 목적

- 이 문서는 API 앱의 실행 명령, 현재 모듈, 관련 계획 문서를 빠르게 찾기 위한 인덱스다.
- 기능별 상세 설계와 구현 순서는 루트 `docs/` 하위 문서를 기준으로 관리한다.

## 2. 현재 모듈

- `auth`: JWT 인증과 권한 가드
- `post`: 게시물 초안 생성, 상세 조회, 수정
- `storage`: 게시물 파일 업로드와 조회
- `user`: 사용자 조회
- `prisma`: DB 접근 공통 모듈

## 3. 실행 명령

```bash
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:e2e
```

Prisma:

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
pnpm --filter api prisma:migrate:docker
pnpm --filter api prisma:studio
```

주의:

- 로컬 호스트에서 Prisma CLI를 직접 실행할 때는 `PRISMA_DATABASE_URL`이 사용된다.
- Docker Compose 개발 환경에서는 `pnpm --filter api prisma:migrate:docker`를 기본 명령으로 사용한다.
- 앱 런타임은 컨테이너 내부 네트워크를 쓰므로 `DATABASE_URL`은 `postgres:5432`를 유지한다.

## 4. 현재 구현 메모

- `POST /posts/draft`, `GET /posts`, `GET /posts/editable`, `GET /posts/:postId`, `GET /posts/:postId/edit`, `PATCH /posts/:postId`가 연결돼 있다.
- 공개 목록과 편집 목록은 분리된 DTO/cursor 계약을 사용하고, 썸네일은 `ATTACHED` 파일만 응답에 포함한다.
- 파일 조회는 공개 프록시와 편집용 보호 경로를 모두 제공하며, 업로드 후 `TEMP/ATTACHED/ORPHANED/DELETED` 상태 전이와 orphan cleanup cron이 동작한다.

## 5. 관련 문서

- [../../docs/00_README.md](/Users/joowon/Desktop/workspace/amaneta-log/docs/00_README.md)
- [../../docs/02_Development/00_Plan/00_README.md](/Users/joowon/Desktop/workspace/amaneta-log/docs/02_Development/00_Plan/00_README.md)
- [../../docs/02_Development/01_Guide/00_README.md](/Users/joowon/Desktop/workspace/amaneta-log/docs/02_Development/01_Guide/00_README.md)
- [../../docs/02_Development/00_Plan/01_EDITOR_LIST_INFINITE_SCROLL_PLAN.md](/Users/joowon/Desktop/workspace/amaneta-log/docs/02_Development/00_Plan/01_EDITOR_LIST_INFINITE_SCROLL_PLAN.md)
