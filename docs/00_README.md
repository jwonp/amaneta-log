# amaneta-log 문서 인덱스

> 이 디렉터리는 구현 계획과 운영 메모를 `PERFO` 스타일로 정리하는 문서 진입점이다.

## 1. 문서 구성

- [README.md](./README.md): 프로젝트 구조, 실행 명령, 문서 위치를 빠르게 보는 내부 안내
- [02_Development/00_Plan/00_README.md](./02_Development/00_Plan/00_README.md): 실제 구현 순서와 범위를 정리한 실행 계획 문서 모음
- [02_Development/01_Guide/00_README.md](./02_Development/01_Guide/00_README.md): 개발 중 축적된 설정 가이드, 구현 메모, 회고 문서 모음

## 2. 라벨링 규칙

- `00_README.md`: 디렉터리 인덱스
- `{NN}_{TOPIC}_PLAN.md`: 구현 계획 문서
- `{NN}_{TOPIC}_SPEC.md`: 계약과 상세 스펙 문서
- 파일명은 숫자 순서를 먼저 두고, 핵심 토픽은 대문자 스네이크 케이스로 고정한다.

## 3. 현재 활성 문서

- [02_Development/00_Plan/01_EDITOR_LIST_INFINITE_SCROLL_PLAN.md](./02_Development/00_Plan/01_EDITOR_LIST_INFINITE_SCROLL_PLAN.md): `EditorListItemCard` props 기준 에디터 목록 무한스크롤 구현 계획
- [02_Development/00_Plan/02_POST_UPLOAD_PLAN.md](./02_Development/00_Plan/02_POST_UPLOAD_PLAN.md): 게시물 작성, 업로드, 첨부파일 상태 전이 구현 TODO
- [02_Development/01_Guide/01_PRISMA_NEST_GUIDE.md](./02_Development/01_Guide/01_PRISMA_NEST_GUIDE.md): Prisma와 NestJS 연동 가이드
- [02_Development/01_Guide/02_DOCKER_BUILD_OPTIMIZATION.md](./02_Development/01_Guide/02_DOCKER_BUILD_OPTIMIZATION.md): Docker 빌드 컨텍스트 최적화 회고
- [02_Development/01_Guide/03_MONOREPO_API_POSTGRES_MINIO_SETUP.md](./02_Development/01_Guide/03_MONOREPO_API_POSTGRES_MINIO_SETUP.md): 모노레포에 NestJS API, PostgreSQL, MinIO를 붙이는 설정 가이드
