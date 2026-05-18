# amaneta-log

Next.js + NestJS 기반 블로그/에디터 모노레포다.

## 1. 문서 목적

- 이 문서는 현재 레포의 구조, 실행 진입점, 문서 위치를 빠르게 파악하기 위한 루트 인덱스다.
- 상세 구현 계획은 `docs/` 하위 문서를 기준으로 관리한다.

## 2. 프로젝트 구조

```text
amaneta-log/
├── apps/
│   ├── web/            # Next.js 16, React 19, React Query 기반 프론트엔드
│   └── api/            # NestJS 11, Prisma 기반 백엔드
├── packages/
│   ├── ui/             # 공용 UI 컴포넌트
│   ├── eslint-config/  # 공용 ESLint 설정
│   └── typescript-config/
├── docs/               # PERFO 스타일 문서 인덱스와 실행 계획
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 3. 주요 실행 명령

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

개별 앱 실행:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

Prisma 마이그레이션:

```bash
pnpm --filter api prisma:migrate:docker
```

- Compose 개발 환경 기준 기본 마이그레이션 경로다.
- 호스트 Prisma CLI는 `apps/api/.env`의 `PRISMA_DATABASE_URL`을 사용하고, 컨테이너 내부 런타임은 `DATABASE_URL`을 사용한다.

## 4. 문서 맵

- [docs/00_README.md](./docs/00_README.md): 전체 문서 인덱스와 라벨링 규칙
- [docs/02_Development/00_Plan/00_README.md](./docs/02_Development/00_Plan/00_README.md): 구현 계획 문서 인덱스
- [docs/02_Development/01_Guide/00_README.md](./docs/02_Development/01_Guide/00_README.md): 개발 가이드와 회고 문서 인덱스

## 5. 현재 구현 메모

- 에디터 작성 플로우는 초안 작성과 수정 진입점이 이미 연결돼 있다.
- 에디터 목록은 `EditorList`와 `useEditorListApi`가 아직 비어 있어 별도 구현이 필요하다.
- 백엔드 `GET /posts`는 미구현 상태라, 목록 API 계약부터 먼저 고정해야 한다.
