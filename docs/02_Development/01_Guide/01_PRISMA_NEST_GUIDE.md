# Prisma + NestJS 사용 가이드

이 문서는 `apps/api` 기준으로 Prisma와 NestJS를 함께 사용하는 최소 규칙을 정리한다.

## 1. 기본 폴더 구조

```txt
apps/api
├─ prisma
│  └─ schema.prisma
├─ generated
│  └─ prisma
├─ src
│  ├─ prisma
│  │  ├─ prisma.module.ts
│  │  └─ prisma.service.ts
│  └─ **/*.service.ts
├─ .env
└─ package.json
```

## 2. 역할 구분

| 경로 | 역할 | 직접 수정 여부 |
| --- | --- | --- |
| `prisma/schema.prisma` | 모델, datasource, generator 정의 | 수정함 |
| `generated/prisma/*` | Prisma generated client | 직접 수정 금지 |
| `src/prisma/prisma.service.ts` | NestJS 주입용 PrismaService | 수정함 |
| `src/prisma/prisma.module.ts` | PrismaService export | 수정함 |
| `src/**/*.service.ts` | 실제 도메인 쿼리 작성 | 수정함 |

## 3. schema 관리 규칙

- DB 모델 변경은 반드시 `apps/api/prisma/schema.prisma`에서 시작한다.
- client 생성물은 `generated/prisma`에 두고, 수동 수정하지 않는다.
- schema 변경 후에는 migration과 client regenerate를 같이 처리한다.

예시 generator:

```prisma
generator client {
  provider               = "prisma-client"
  output                 = "../generated/prisma"
  generatedFileExtension = "cts"
  importFileExtension    = "cjs"
  moduleFormat           = "cjs"
}
```

## 4. NestJS 주입 규칙

- Prisma Client 생성과 lifecycle 관리는 `PrismaService`에 모은다.
- 다른 모듈에서는 `PrismaService`만 주입받아 사용한다.
- controller에서 직접 Prisma를 호출하지 않고 service 계층을 통과시킨다.

예시:

```ts
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
}
```

## 5. 자주 쓰는 명령

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
pnpm --filter api prisma:push
pnpm --filter api prisma:studio
```

## 6. 주의 사항

- `generated/prisma`는 commit 대상일지 팀 규칙을 먼저 고정한다.
- `.env`의 `DATABASE_URL`은 로컬과 Docker 환경을 분리해서 관리한다.
- relation, enum, default 값 변경은 API DTO와 테스트까지 같이 점검한다.
