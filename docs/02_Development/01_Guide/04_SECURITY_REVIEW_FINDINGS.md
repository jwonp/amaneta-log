# Security Review Findings

> 작성일: 2026-05-21
> 범위: 현재 작업 트리 기준 `apps/api`, `apps/web`, Docker/배포 설정, production dependency audit

## 요약

현재 코드베이스는 access/refresh token 분리, refresh token 해시 저장, Prisma 기반 DB 접근처럼 기본 보안 구조는 갖추고 있다. 다만 운영 환경에서 우선 해결해야 할 취약점이 몇 가지 있다.

가장 우선순위가 높은 항목은 파일 업로드 메모리 DoS, JSON-LD stored XSS, 공개 인증/분석 엔드포인트 rate limit 부재다. 그 다음으로 Docker secret 취급, MinIO 권한 분리, 보안 헤더, 에러 응답 정리가 필요하다.

## 우선 조치 목록

1. 업로드 요청 크기 제한과 Nest `FileInterceptor` limit 적용
2. JSON-LD 직렬화 결과에서 script-breakout 문자 이스케이프
3. 로그인, 회원가입, refresh, analytics 수집 엔드포인트에 rate limit 적용
4. `.dockerignore`와 Docker build arg에서 production secret 제거
5. MinIO root 계정 대신 버킷 전용 service account 사용
6. CSP, `nosniff`, HSTS 등 보안 헤더 적용
7. signup proxy의 `AxiosError` 원문 노출 제거
8. 사용자 입력 길이와 형식 제한 추가
9. `pnpm audit --prod` 취약 의존성 업데이트

## 발견 사항

### 1. 파일 업로드 메모리 DoS 가능성

**위험도: High**

관련 파일:

- `apps/web/app/api/storage/[postId]/files/route.ts`
- `apps/api/src/storage/storage.controller.ts`
- `apps/api/src/storage/storage.service.ts`

현재 Next route handler는 `request.formData()`로 요청 본문 전체를 메모리에 올린 뒤 파일 타입과 크기를 검증한다. Nest API도 `FileInterceptor('file')`를 사용하지만 Multer `limits.fileSize`가 없다. 공격자가 큰 multipart 요청을 보내면 web 또는 API 프로세스 메모리를 압박할 수 있다.

현재 서비스 레벨에는 MIME type과 size 검증이 있지만, 이 검증은 파일이 이미 메모리에 올라온 뒤 실행된다.

해결 방안:

- reverse proxy 또는 플랫폼 레벨에서 최대 body size를 먼저 제한한다.
- Nest `FileInterceptor('file', { limits: { fileSize: ... } })`를 적용한다.
- `fileFilter` 또는 커스텀 pipe로 허용 MIME type을 컨트롤러 경계에서 차단한다.
- Next route handler에서도 `Content-Length`가 업로드 한도를 초과하면 `request.formData()` 호출 전에 거절한다.
- 장기적으로는 대용량 업로드를 서버 메모리 버퍼링 대신 presigned URL 또는 streaming 방식으로 전환한다.
- 업로드 파일은 `file.mimetype`만 신뢰하지 말고 magic byte 검증을 추가한다.

### 2. JSON-LD stored XSS 가능성

**위험도: High**

관련 파일:

- `apps/web/src/05_shared/seo/ui/JsonLd.tsx`
- `apps/web/app/(main)/posts/[postId]/page.tsx`

`JsonLd` 컴포넌트가 `dangerouslySetInnerHTML`에 `JSON.stringify(data)`를 그대로 넣는다. JSON-LD 데이터에는 게시글 제목과 설명이 포함된다. 게시글 값에 `</script>` 같은 문자열이 들어가면 script 태그를 탈출할 수 있다.

해결 방안:

- JSON-LD 전용 serializer를 만든다.
- `JSON.stringify(data)` 결과에서 최소한 `<`, `>`, `&`, U+2028, U+2029를 이스케이프한다.
- 예시:

```ts
const serializeJsonLd = (data: Record<string, unknown>) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
```

- `JsonLd`는 이 serializer만 사용하도록 제한한다.
- 회귀 테스트에 `</script><script>alert(1)</script>`가 script를 탈출하지 않는 케이스를 추가한다.

### 3. 로그인, 회원가입, 분석 수집 rate limit 부재

**위험도: High**

관련 파일:

- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/analytics/analytics.controller.ts`
- `apps/api/src/analytics/analytics.service.ts`

`/auth/signup`, `/auth/login`, `/auth/refresh`가 공개 엔드포인트이고, analytics 이벤트 수집도 무인증 공개 쓰기 엔드포인트다. 현재 코드에는 rate limit, IP 제한, 계정 단위 실패 제한, CAPTCHA, analytics quota가 없다.

가능한 영향:

- 로그인 brute force
- 회원가입 스팸
- refresh endpoint 반복 호출
- analytics 테이블 쓰기 폭증으로 DB 비용과 성능 문제

해결 방안:

- `@nestjs/throttler`를 도입하거나 edge/reverse proxy에서 rate limit을 적용한다.
- 로그인은 IP + username 조합으로 실패 횟수를 제한한다.
- 회원가입은 IP 단위 rate limit과 CAPTCHA, 이메일 검증 또는 초대 코드 정책을 검토한다.
- analytics는 IP/session/visitor 기준 rate limit과 sampling을 적용한다.
- analytics request body는 현재 길이 제한이 일부 있으나, 이벤트 빈도 제한도 별도로 필요하다.
- 운영 로그에 rate limit hit를 남겨 abuse 여부를 관찰한다.

### 4. Docker build와 배포 설정의 secret 취급 위험

**위험도: Medium**

관련 파일:

- `.dockerignore`
- `apps/web/dockerfile`
- `docker-compose.prod.yml`

`.dockerignore`는 `.env`, `**/.env`, `**/.env.local`만 제외한다. `.env.production` 또는 `apps/*/.env.production`은 build context에 포함될 수 있다. 또한 `NEXTAUTH_SECRET`이 Docker build arg와 build stage `ENV`로 전달된다.

해결 방안:

- `.dockerignore`에 아래 패턴을 추가한다.

```gitignore
.env.*
**/.env.*
```

- `NEXTAUTH_SECRET`처럼 runtime에만 필요한 secret은 Docker build arg로 넘기지 않는다.
- Next build에 꼭 필요한 public 값과 runtime secret을 분리한다.
- BuildKit secret이 필요한 경우 `--secret` mount를 사용하고 이미지 레이어에 남기지 않는다.
- 배포 전 `docker history`와 이미지 inspect로 secret이 남지 않는지 확인한다.

### 5. MinIO root credential 사용 및 콘솔 노출

**위험도: Medium**

관련 파일:

- `apps/api/src/storage/s3.provider.ts`
- `docker-compose.prod.yml`

API가 `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`를 사용해 S3 client를 생성한다. production compose는 MinIO console port도 호스트에 노출한다. 앱이 root credential을 사용하면 앱 취약점이 곧 전체 object store 권한 탈취로 이어질 수 있다.

해결 방안:

- 앱 전용 MinIO service account를 만든다.
- 해당 계정에는 필요한 버킷과 object prefix에 대한 최소 권한만 부여한다.
- root credential은 초기 bucket 생성과 운영자 작업에만 사용한다.
- MinIO console은 public internet에 직접 노출하지 않는다. 내부망, VPN, bastion, reverse proxy auth 뒤로 제한한다.

### 6. 보안 헤더와 CSP 부재

**위험도: Medium**

관련 파일:

- `apps/web/next.config.mjs`
- `apps/api/src/main.ts`
- `apps/api/src/storage/storage.controller.ts`

Next headers는 정적 asset cache 위주로만 설정되어 있다. API도 Helmet을 사용하지 않는다. 파일 응답은 저장된 MIME type을 `Content-Type`으로 그대로 반환한다.

해결 방안:

- Next global headers에 다음 정책을 추가한다.
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` 또는 CSP `frame-ancestors 'none'`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security` HTTPS 운영 환경 한정
- Nest API에 `helmet`을 적용한다.
- storage 파일 응답에도 `X-Content-Type-Options: nosniff`를 추가한다.
- 이미지 업로드만 허용한다면 파일 응답 MIME type을 allowlist 기반으로만 반환한다.

### 7. signup proxy의 AxiosError 원문 노출

**위험도: Medium**

관련 파일:

- `apps/web/app/api/auth/signup/route.ts`

회원가입 proxy가 실패 시 `AxiosError` 객체를 응답 JSON에 포함한다. 이 객체에는 내부 요청 config, URL, 응답 상세 정보가 포함될 수 있다.

해결 방안:

- `AxiosError` 원문을 절대 응답에 담지 않는다.
- `normalizeAppError`와 `serializeAppError` 패턴을 사용해 `status`, `code`, `message`만 반환한다.
- 서버 로그에는 필요한 세부 정보를 남기되, 클라이언트 응답은 일반화한다.

### 8. 사용자 입력 길이와 형식 제한 부족

**위험도: Low to Medium**

관련 파일:

- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/post/post.validation.ts`

회원가입 username은 trim과 empty check만 있고 길이와 형식 제한이 없다. 게시글 저장 payload도 타입 검증 위주이며 title, markdown, tag 개수와 길이 제한이 없다.

해결 방안:

- DTO validation을 명시적인 schema로 통일한다. 예: `zod`, `class-validator`, 커스텀 pipe.
- 권장 제한:
  - username: 3-64자, 허용 문자 명시, email로 사용할 경우 email 형식 검증
  - password: 최소 12자 권장, 최대 길이도 설정해 hashing DoS 방지
  - title: 1-120자
  - description: 0-300자
  - markdown: 최대 크기 설정
  - tags: 개수와 각 tag 길이 제한
- DB column과 API validation 제한을 일치시킨다.

### 9. 의존성 취약점

**위험도: Medium to High**

실행 명령:

```sh
pnpm audit --prod
```

결과:

- high 1건: `picomatch <2.3.2`
- moderate 4건: `picomatch`, `@hono/node-server`, `postcss`

주요 경로:

- `packages/ui > shadcn > fast-glob > micromatch > picomatch`
- `apps/api > @prisma/client > prisma > @prisma/dev > @hono/node-server`
- `apps/web > next > postcss`

해결 방안:

- `pnpm update` 또는 명시적 override로 patched version을 사용한다.
- `pnpm why picomatch`, `pnpm why postcss`, `pnpm why @hono/node-server`로 경로를 확인한다.
- 업데이트 후 `pnpm audit --prod`, `pnpm build`, 관련 테스트를 다시 실행한다.
- dev/build-time dependency라도 CI와 build server에서 실행되는 패키지는 별도 위험 평가를 남긴다.

## 비교적 양호한 부분

- Prisma client를 사용하고 있고 raw SQL 사용 흔적은 발견되지 않았다.
- 비밀번호 저장은 scrypt, salt, pepper, `timingSafeEqual`을 사용한다.
- refresh token은 원문 저장이 아니라 peppered hash로 저장된다.
- refresh token 회전 시 기존 token을 폐기한다.
- 게시글 편집과 파일 접근은 작성자 또는 admin 여부를 서버에서 재검증한다.
- public post 파일은 게시글이 published/public이고 파일이 attached 상태일 때만 읽을 수 있다.

## 권장 작업 순서

1. 업로드 요청 제한을 web, API, proxy 레벨에 동시에 추가한다.
2. JSON-LD serializer와 회귀 테스트를 추가한다.
3. auth와 analytics 엔드포인트에 rate limit을 추가한다.
4. Docker secret 전달 방식과 `.dockerignore`를 정리한다.
5. MinIO service account와 콘솔 접근 정책을 분리한다.
6. Next/Nest 보안 헤더를 추가한다.
7. 에러 응답 정리와 입력 schema 제한을 적용한다.
8. 의존성 업데이트 후 audit/build/test를 재실행한다.

## 검증 체크리스트

- 큰 multipart 업로드가 `413 Payload Too Large`로 빠르게 거절되는가?
- `</script>`가 포함된 게시글 title/description이 JSON-LD script를 탈출하지 않는가?
- 로그인 실패 반복 시 rate limit이 작동하는가?
- analytics 이벤트 반복 전송이 제한되는가?
- production image history에 secret이 남지 않는가?
- MinIO 앱 계정이 지정 bucket/prefix 외 작업을 할 수 없는가?
- 응답에 `Content-Security-Policy`와 `X-Content-Type-Options: nosniff`가 포함되는가?
- signup 실패 응답에 내부 Axios config나 backend URL이 포함되지 않는가?
- `pnpm audit --prod`가 허용 가능한 상태인가?
