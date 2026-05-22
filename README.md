# amaneta-log

`amaneta-log`는 콘텐츠 작성과 운영을 함께 다루는 블로그/에디터 플랫폼 모노레포다. 프론트엔드는 Next.js, 백엔드는 NestJS와 Prisma를 사용하며, 작성 화면, 공개 포스트 조회, 편집용 목록, 파일 스토리지 흐름까지 한 저장소에서 관리한다.

## 핵심 구성

- `apps/web`: Next.js 16, React 19, React Query 기반 웹 애플리케이션
- `apps/api`: NestJS 11, Prisma, PostgreSQL 기반 API 서버
- `packages/ui`: 공용 UI 컴포넌트
- `packages/eslint-config`, `packages/typescript-config`: 공용 개발 설정

## 주요 기능

- 게시물 작성과 수정 진입점이 연결된 에디터 플로우
- 공개 글 목록과 편집용 글 목록에 대한 cursor 기반 조회
- 첨부 파일 상태 전이(`TEMP -> ATTACHED -> ORPHANED -> DELETED`)를 포함한 스토리지 관리
- Turborepo 기반 모노레포 개발 환경과 앱 단위 실행

## 기술 스택

- Frontend: Next.js, React, TanStack Query
- Backend: NestJS, Prisma, PostgreSQL
- Tooling: pnpm, Turborepo, TypeScript, ESLint, Prettier
