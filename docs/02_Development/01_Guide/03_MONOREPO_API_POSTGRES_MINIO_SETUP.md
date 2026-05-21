# Turbo Monorepo에 NestJS, PostgreSQL, MinIO 붙이기

이 문서는 현재 저장소 구조를 기준으로 `apps/api` NestJS 앱을 추가하고, 로컬 개발용 PostgreSQL과 MinIO를 `docker-compose.yml`에 연결하는 최소 설정 순서를 정리한다.

## 1. 전제

- 패키지 매니저: `pnpm`
- 워크스페이스: `apps/*`, `packages/*`
- 기존 프론트 앱: `apps/web`
- 새 백엔드 앱: `apps/api`

## 2. 목표 구조

```text
apps/
  api/
    src/
      app.controller.ts
      app.module.ts
      app.service.ts
      main.ts
    package.json
    tsconfig.json
docker-compose.yml
```

## 3. NestJS 앱 생성

```bash
pnpm dlx @nestjs/cli new apps/api --package-manager pnpm --skip-git
```

생성 후 `apps/api/package.json`의 `name`은 Turbo 필터를 위해 `api`로 맞춘다.

## 4. API 스크립트 기준

권장 스크립트:

```json
{
  "name": "api",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

## 5. Docker Compose 연결

- `postgres` 서비스 추가
- `minio` 서비스 추가
- `api` 서비스에 `DATABASE_URL`, `MINIO_*` 환경변수 연결
- `web`은 `BACKEND_URL`로 `api`를 바라보게 설정

권장 포트 예시:

- Web: `3000`
- API: `4000`
- PostgreSQL: `5432`
- MinIO API: `9000`
- MinIO Console: `9001`

## 6. 환경변수 체크

- API: `DATABASE_URL`, `JWT_SECRET`, `MINIO_ENDPOINT`, `MINIO_BUCKET`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
- Web: `BACKEND_URL`
- Docker Compose: 서비스 이름 기준 내부 호스트명 사용

MinIO는 앱 전용 service account를 따로 두고, `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`는 bucket 생성과 운영 작업에만 사용하는 쪽을 권장한다.

## 7. 검증 순서

1. `pnpm install`
2. `docker compose up -d postgres minio`
3. `pnpm --filter api dev`
4. `pnpm --filter web dev`
5. API에서 DB 연결과 MinIO bucket 접근 확인
