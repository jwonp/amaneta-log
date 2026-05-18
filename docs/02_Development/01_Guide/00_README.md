# amaneta-log 개발 가이드

> 이 디렉터리는 구현 순서 문서가 아니라, 개발 중 반복해서 참고할 설정 가이드와 회고 문서를 모아둔다.

## 문서 구성

- [01_PRISMA_NEST_GUIDE.md](./01_PRISMA_NEST_GUIDE.md): `apps/api` 기준 Prisma + NestJS 사용 가이드
- [02_DOCKER_BUILD_OPTIMIZATION.md](./02_DOCKER_BUILD_OPTIMIZATION.md): Docker 빌드 컨텍스트와 Dockerfile 최적화 회고
- [03_MONOREPO_API_POSTGRES_MINIO_SETUP.md](./03_MONOREPO_API_POSTGRES_MINIO_SETUP.md): 모노레포에 NestJS API, PostgreSQL, MinIO를 연결하는 설정 가이드

## 문서 작성 기준

- 반복 설정, 초기 세팅, 운영 회고처럼 재사용 가치가 높은 내용을 우선 보관한다.
- 새 가이드는 배경 설명보다 현재 레포에서 바로 써먹을 수 있는 파일 경로와 명령어를 먼저 둔다.
