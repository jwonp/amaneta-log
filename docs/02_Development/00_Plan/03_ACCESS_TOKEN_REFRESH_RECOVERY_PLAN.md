# Access Token 만료 복구 계획

> 기준 파일:
> `apps/web/lib/auth/next-auth.config.ts`
> `apps/web/lib/api/requestApi.ts`
> `apps/web/app/api/posts/[postId]/route.ts`
> `apps/web/app/api/posts/[postId]/edit/route.ts`
> `apps/web/app/api/posts/draft/route.ts`
> `apps/web/app/api/storage/[postId]/files/route.ts`
> `apps/web/app/api/storage/[postId]/files/[fileId]/route.ts`
> `apps/web/app/api/storage/[postId]/files/[fileId]/editable/route.ts`
> `apps/web/src/02_widgets/editor/ui/EditorForm.tsx`
> `apps/api/src/auth/auth.service.ts`
>
> 이 문서는 access token 만료 이후에도 refresh token이 유효한 동안에는 autosave, 업로드, 편집 조회 요청이 401로 연속 실패하지 않도록 복구 흐름을 정리한다.

## 1. 목표

- refresh token이 유효한 동안에는 access token 만료로 인한 401을 자동 복구한다.
- autosave, draft 생성, 파일 업로드, 편집 조회가 같은 복구 규칙을 사용한다.
- refresh token까지 만료되면 무한 재시도 없이 세션 종료와 리다이렉트로 정리한다.
- 세션 만료 원인이 사용자에게 보이는 상태 메시지와 이동 동선으로 연결된다.

## 2. 현재 상태

### 2.1 NextAuth에는 선제 refresh 로직만 있다

- `apps/web/lib/auth/next-auth.config.ts`의 `jwt` callback은 `accessTokenExpiresAt` 기준으로 만료 30초 전에 refresh를 시도한다.
- 이 로직은 "만료 예측"에는 대응하지만, 실제 API 요청이 401을 반환했을 때 refresh 후 재시도하는 흐름은 없다.

### 2.2 웹 API route는 401을 그대로 전달한다

- `apps/web/app/api/posts/[postId]/route.ts`를 포함한 다수의 route는 `createServerRequestApi()`로 백엔드 요청을 만들고, 실패 시 status를 그대로 프론트에 반환한다.
- `apps/web/app/api/storage/[postId]/files/route.ts`와 `apps/web/app/api/storage/[postId]/files/[fileId]/route.ts`도 세션 access token을 그대로 사용한다.

### 2.3 클라이언트는 세션 만료와 일반 저장 실패를 구분하지 않는다

- `apps/web/src/02_widgets/editor/ui/EditorForm.tsx`는 autosave 실패 시 `"저장에 실패했습니다."`로만 처리한다.
- refresh 실패나 세션 만료를 구분하지 않아 autosave가 반복 실패해도 사용자 행동이 바뀌지 않는다.

### 2.4 refresh token rotation race 가능성이 있다

- `apps/api/src/auth/auth.service.ts`의 `refresh()`는 기존 refresh token을 revoke하고 새 토큰을 발급한다.
- access token 만료 시 여러 요청이 동시에 refresh를 시도하면 일부 요청은 이미 revoke된 refresh token으로 실패할 수 있다.

## 3. 범위

이번 계획의 범위:

1. 서버 요청 공통 레이어에서 401 복구 로직 추가
2. refresh 요청 single-flight 처리
3. 웹 API route를 공통 복구 헬퍼로 통일
4. autosave/업로드 UI에서 세션 만료를 별도 상태로 처리
5. refresh 실패 시 리다이렉트 정책 정리

이번 계획에서 제외:

- refresh token 발급 정책 자체 변경
- 다중 탭 간 세션 동기화 최적화
- 전체 인증 구조 교체

## 4. 핵심 결정

### 4.1 401 복구는 서버 요청 레이어에서 처리한다

권장안:

- `apps/web/lib/api/requestApi.ts`에 "백엔드 호출 -> 401 감지 -> refresh 시도 -> 원 요청 1회 재시도"를 담당하는 공통 유틸을 추가한다.

이유:

- 현재 저장, 업로드, 조회 route가 모두 서버 측 프록시를 거친다.
- 클라이언트 axios interceptor마다 중복 구현하는 것보다, 서버 프록시에서 복구하는 편이 적용 범위가 넓고 일관적이다.

### 4.2 refresh는 single-flight로 묶는다

권장안:

- 같은 세션 컨텍스트에서 refresh가 진행 중이면 나머지 요청은 새 refresh를 다시 호출하지 않고, 기존 refresh promise를 기다린다.

이유:

- 백엔드 refresh token rotation과 충돌하지 않으려면 동시에 여러 refresh를 보내면 안 된다.
- autosave, 썸네일 업로드, 본문 업로드, 편집 조회가 동시에 들어올 수 있다.

### 4.3 재시도는 1회로 제한한다

권장안:

- 백엔드 응답이 401일 때 refresh 후 원 요청을 정확히 1번만 재시도한다.
- 재시도 후에도 401이면 세션 종료 흐름으로 전환한다.

이유:

- 무한 재시도는 서버 부하와 UI 오류 반복을 만든다.
- refresh token이 죽었거나 세션 상태가 이미 비정상인 경우에는 빠르게 종료하는 편이 낫다.

### 4.4 refresh 실패 시에는 세션 종료와 리다이렉트를 명확히 한다

권장안:

- refresh 실패 시 세션 오류 코드를 고정값으로 정리한다.
- 페이지 진입 요청은 `/login?callbackUrl=...`로 보낸다.
- autosave 같은 background 요청은 프론트가 세션 만료 상태를 감지해 저장을 멈추고 `/login?callbackUrl=...` 또는 `/`로 이동시킨다.

이유:

- 현재는 401이 발생해도 사용자가 원인을 알기 어렵다.
- "refresh token 유효 시 자동 복구, refresh token 만료 시 세션 종료" 정책을 분리해야 UX가 일관된다.

### 4.5 세션 만료는 일반 저장 실패와 구분한다

권장안:

- `EditorForm` save state에 세션 만료 전용 에러 메시지를 둔다.
- 세션 만료가 확인되면 autosave 타이머를 중단하고 추가 저장/업로드를 막는다.

이유:

- 네트워크 오류나 validation 오류와 세션 만료는 사용자가 취해야 할 행동이 다르다.
- 편집 도중 세션이 끝났으면 재로그인이 우선이다.

## 5. 작업 계획

### 5.1 공통 에러/결과 타입 추가

- `apps/web/lib/api` 아래에 인증 복구용 타입을 추가한다.
- 예: `ApiAuthErrorCode = "ACCESS_TOKEN_EXPIRED" | "SESSION_REFRESH_FAILED" | "UNAUTHORIZED"`
- 웹 API route와 클라이언트가 같은 코드를 공유하도록 한다.

### 5.2 서버 요청 유틸 확장

- `apps/web/lib/api/requestApi.ts`를 확장해 현재 세션 토큰으로 요청을 만들고, 401 발생 시 refresh를 수행한 뒤 새 access token으로 재시도하는 helper를 추가한다.
- 가능하면 `createServerRequestApi()`를 대체하지 말고, 상위에서 재사용 가능한 `requestWithSessionRecovery()` 계층을 둔다.

### 5.3 refresh single-flight 구현

- module scope에 refresh 진행 상태를 두고, 이미 refresh 중이면 동일 promise를 재사용한다.
- refresh 성공 시 새 access token / refresh token / 만료시각을 세션에 반영한다.
- refresh 실패 시 공통 에러를 반환한다.

### 5.4 NextAuth 세션 갱신 경로 보강

- `next-auth.config.ts`의 refresh 함수와 중복/충돌이 없게 역할을 정리한다.
- 선제 refresh는 유지하되, 실요청 401 복구는 request layer가 담당하도록 책임을 분리한다.
- `session.error`에 들어갈 값을 whitelist 기반으로 정리한다.

### 5.5 웹 API route 통일 적용

- 아래 route를 우선 공통 유틸로 전환한다.
  - `apps/web/app/api/posts/[postId]/route.ts`
  - `apps/web/app/api/posts/[postId]/edit/route.ts`
  - `apps/web/app/api/posts/draft/route.ts`
  - `apps/web/app/api/storage/[postId]/files/route.ts`
  - `apps/web/app/api/storage/[postId]/files/[fileId]/route.ts`
  - `apps/web/app/api/storage/[postId]/files/[fileId]/editable/route.ts`
- 각 route는 401을 generic 500으로 덮지 말고 공통 auth error code와 함께 반환한다.

### 5.6 프론트 autosave / 업로드 상태 처리 보강

- `EditorForm.tsx`에서 401 복구 실패 응답을 감지하면 `"세션이 만료되어 저장을 중단했습니다. 다시 로그인해주세요."` 같은 메시지로 전환한다.
- autosave 타이머와 후속 저장 예약을 중지한다.
- 필요하면 callbackUrl과 함께 로그인 페이지 또는 인덱스 페이지로 이동시킨다.

### 5.7 리다이렉트 정책 정리

- 편집, 업로드, draft 생성처럼 인증이 필수인 화면은 refresh 실패 시 `/login?callbackUrl=현재주소`를 기본값으로 사용한다.
- 인덱스 페이지로 보내는 정책이 더 적합한 화면이 있으면 route 단위로 예외를 둘 수 있지만, 기본 정책은 로그인 복귀가 더 안전하다.

## 6. 테스트 계획

### 6.1 서버 레이어

- access token 만료 + refresh token 유효 -> refresh 후 요청 성공
- access token 만료 + refresh token 무효 -> 401 auth error code 반환
- 동시에 2개 이상 요청 발생 -> refresh 호출은 1회만 수행

### 6.2 편집 플로우

- autosave 시점에 access token 만료 -> 저장 성공으로 복구
- 썸네일 업로드 시점에 access token 만료 -> 업로드 성공으로 복구
- refresh token 만료 상태 -> autosave 중단, 세션 만료 메시지 표시, 리다이렉트

### 6.3 회귀 확인

- 로그인 직후 일반 저장/업로드는 기존과 동일하게 동작
- access token이 아직 유효한 요청은 추가 지연 없이 통과
- 보호 페이지 진입 정책은 기존 proxy/auth 구조와 충돌하지 않음

## 7. 구현 순서 제안

1. 공통 auth recovery 타입과 request helper 추가
2. refresh single-flight 구현
3. posts/storage 웹 API route를 공통 helper로 전환
4. `EditorForm` 세션 만료 상태 처리 추가
5. 리다이렉트/에러 메시지 검증
6. 관련 테스트 추가

## 8. 보류하면 안 되는 주의점

- refresh token rotation이 있으므로 refresh를 여러 번 동시에 보내면 안 된다.
- 백엔드 raw message를 그대로 프론트에 노출하지 않는다.
- 401 복구 실패를 generic `"저장 실패"`로 숨기면 다시 같은 문제를 겪는다.
- 요청 재시도는 1회로 제한해야 한다.
