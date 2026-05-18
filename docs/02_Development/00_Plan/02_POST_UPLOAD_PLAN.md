# Post 업로드 구현 TODO

이 문서는 `amaneta-log`의 게시물 작성, 썸네일 업로드, 본문 첨부파일 상태 전이, 그리고 고아 파일 정리 크론까지 포함한 실행 TODO를 정리한다.

## 1. 목표 플로우

```txt
새 글 작성 진입
→ 백엔드에서 DRAFT Post 생성
→ postId 반환
→ EditorForm은 postId를 들고 작성 시작
→ 입력 변경 시 draft 기준 자동저장 대기
→ 이미지/동영상 업로드 시 postId 기준으로 StorageFile TEMP 저장
→ 업로드 pending이 없고 변경이 안정화되면 자동저장 실행
→ 글 저장 시 markdown에서 실제 사용된 URL만 추출
→ 사용된 파일은 ATTACHED
→ 사용되지 않은 파일은 ORPHANED
→ 일정 시간 지난 ORPHANED 파일은 크론이 스토리지와 DB에서 정리
→ Post는 DRAFT 또는 PUBLISHED 상태로 저장
```

## 2. 데이터 모델 체크리스트

### 2.1 Post 상태

```prisma
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DELETED
}
```

### 2.2 StorageFile 상태와 용도

```prisma
enum StorageFileStatus {
  TEMP
  ATTACHED
  ORPHANED
  DELETED
}

enum StorageFileUsage {
  CONTENT
  THUMBNAIL
}

enum StorageFileKind {
  IMAGE
  VIDEO
  OTHER
}
```

### 2.3 Post 핵심 필드

```prisma
model Post {
  id          Int        @id @default(autoincrement())
  title       String     @default("")
  description String?
  markdown    String     @default("")
  tags        String[]
  isPublic    Boolean    @default(false)
  status      PostStatus @default(DRAFT)
  authorId    Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  publishedAt DateTime?
}
```

### 2.4 StorageFile 메타데이터 보강 권장

고아 정리 크론을 안정적으로 운영하려면 아래 필드 중 최소 하나는 추가하는 편이 좋다.

- `orphanedAt DateTime?`
- `deletedAt DateTime?`

이유:

- 현재는 `status=ORPHANED`와 `updatedAt`만으로 정리 시점을 추론해야 한다.
- 추후 메타데이터 수정이나 재상태 전이가 생기면 `updatedAt`만으로 TTL 판단이 흔들릴 수 있다.
- `orphanedAt`이 있으면 "언제부터 고아였는가"를 명확하게 계산할 수 있다.

## 3. 백엔드 작업

1. `POST /posts/draft`에서 초안 Post를 먼저 만든다.
2. `POST /storage/:postId/files`에서 업로드 파일을 `TEMP`로 저장한다.
3. `PATCH /posts/:postId` 저장 시 markdown에서 실제 사용된 첨부파일을 추출한다.
4. 사용된 본문 파일은 `ATTACHED` 전환한다.
5. 이번 저장 payload에서 빠진 본문 파일은 `TEMP`뿐 아니라 기존 `ATTACHED`도 `ORPHANED`로 전환한다.
6. 썸네일 파일은 `thumbnailId` 기준으로 `ATTACHED` 전환한다.
7. 이번 저장에서 선택되지 않은 기존 썸네일은 `ORPHANED`로 전환한다.
8. 발행 저장이면 `status=PUBLISHED`, 임시 저장이면 `status=DRAFT`로 유지한다.
9. 별도 크론에서 `ORPHANED` 파일을 일정 주기로 스토리지와 DB에서 정리한다.

## 4. 프론트엔드 작업

1. 새 글 작성 시 먼저 draft id를 발급받고 `/editor/edit/:postId`로 이동한다.
2. 썸네일 업로드는 `usage=THUMBNAIL`, 본문 첨부는 `usage=CONTENT`로 분리한다.
3. 저장 payload에는 `title`, `description`, `markdown`, `tags`, `isPublic`, `thumbnailId`를 포함한다.
4. 업로드 성공 직후 에디터는 응답 받은 파일 id를 상태로 유지한다.
5. 본문 첨부 업로드도 실제로 연결해, markdown에 삽입되는 URL 규칙을 백엔드 parser와 일치시킨다.
6. 사용자가 입력을 멈추면 같은 draft 저장 payload로 자동저장을 실행한다.

### 4.1 markdown 이미지 삽입 설계

현재 구조 기준 문제:

- 본문 textarea 상태는 `EditorMarkdownField` 내부에서만 관리한다.
- 이미지 버튼은 `EditorForm` 하단 툴바에 있고 textarea selection 정보에 접근할 수 없다.
- 지금 구조로는 "현재 커서 위치에 업로드 후 markdown 삽입"을 안정적으로 구현하기 어렵다.

권장 구조:

1. markdown 상태를 `EditorForm` 또는 별도 `useEditorComposer` 훅으로 끌어올린다.
2. `EditorMarkdownField`는 controlled component로 바꾼다.
3. textarea ref와 selection range도 상위에서 관리한다.
4. 툴바의 이미지 버튼은 상위 상태를 통해 markdown 삽입 함수를 호출한다.

예시 상태:

```ts
type EditorComposerState = {
  markdown: string
  selectionStart: number
  selectionEnd: number
  pendingUploads: Array<{
    localId: string
    fileName: string
    usage: "CONTENT"
  }>
}
```

### 4.2 삽입 대상 markdown 포맷

권장 canonical 포맷:

```md
![alt text](/api/storage/{postId}/files/{fileId})
```

이 포맷을 권장하는 이유:

- markdown에는 MinIO `publicUrl` 대신 앱이 소유한 URL만 남긴다.
- 프론트 라우트 또는 백엔드 라우트가 권한과 공개 여부를 판단할 수 있다.
- 저장 시 파일 참조 추출도 `fileId` 기준으로 단순해진다.

주의:

- 현재 백엔드 `extractPostStorageStoredNamesFromMarkdown`는 MinIO object path 기준이라 이 포맷을 해석하지 못한다.
- 그래서 markdown 이미지 삽입을 도입할 때는 저장 로직도 `storedName` 기준에서 `fileId` 기준으로 같이 바꾸는 편이 낫다.

### 4.3 프론트 업로드 및 삽입 흐름

권장 흐름:

```txt
이미지 버튼 클릭
→ hidden file input open
→ image/* 선택
→ 현재 textarea selection 저장
→ Next.js `/api/storage/:postId/files` 로 usage=CONTENT 업로드
→ 성공 시 fileId 수신
→ ![alt](/api/storage/{postId}/files/{fileId}) 를 selection 위치에 삽입
→ caret을 삽입된 markdown 뒤로 이동
→ preview에서 즉시 렌더링
```

삽입 문자열 예시:

```ts
const imageMarkdown = `![${altText}](/api/storage/${postId}/files/${fileId})`
```

초기 alt text 규칙:

- 기본값은 파일명에서 확장자를 제거한 값 사용
- 사용자가 나중에 직접 수정 가능

### 4.4 업로드 중 상태 처리

최소 권장안:

- 업로드 중에는 이미지 버튼을 disabled 처리
- 업로드 실패 시 toast 또는 field-level error 표시
- 업로드 중인 파일이 있으면 저장 버튼도 disabled 처리

이유:

- 업로드 완료 전에 저장이 먼저 일어나면 markdown에 참조가 들어가지 않거나, 파일 상태가 `TEMP`로 남을 수 있다.
- "저장 시점의 markdown"이 상태 전이의 기준이므로 업로드 pending과 저장은 충돌하지 않게 막는 편이 낫다.

확장안:

- placeholder comment를 먼저 삽입하고 업로드 완료 후 실제 markdown으로 치환
- drag and drop, clipboard paste 업로드 지원

첫 구현에서는 upload success 후 실제 markdown 삽입만으로도 충분하다.

### 4.5 textarea 삽입 유틸 설계

권장 유틸:

```ts
type InsertTextAtSelectionParams = {
  source: string
  insertText: string
  selectionStart: number
  selectionEnd: number
}
```

동작:

- 선택 영역이 있으면 해당 구간을 치환
- 선택 영역이 없으면 caret 위치에 삽입
- 필요하면 앞뒤 개행을 자동 보정

예시 규칙:

- 문단 중간 삽입이면 앞뒤에 공백 또는 개행을 보정
- 단독 블록 이미지로 넣을 때는 `\n\n`을 앞뒤로 붙여 가독성을 맞춘다

권장 기본 삽입 문자열:

```md
![alt text](/api/storage/{postId}/files/{fileId})
```

### 4.6 preview 라우팅 설계

목표:

- 같은 markdown 문자열이 editor preview와 공개 post detail 양쪽에서 동작해야 한다.

권장 방식:

- markdown에는 `/api/storage/{postId}/files/{fileId}`만 저장한다.
- Next route 또는 백엔드 file route가 다음을 공통 처리한다.
  - 공개 글의 `ATTACHED` 파일이면 그대로 응답
  - 비공개 draft인데 요청자가 작성자 또는 관리자면 editable 파일 응답
  - 그 외는 404

이유:

- editor 전용 `/editable` URL을 markdown에 저장하면 공개 글 렌더링에 그대로 남아 버린다.
- 반대로 공개용 object URL을 저장하면 draft preview 권한 경계가 약해진다.

### 4.7 백엔드 참조 추출 규칙과의 정합성

markdown 이미지 삽입을 프론트에 붙이려면 아래 변경이 같이 필요하다.

1. markdown parser가 `/api/storage/{postId}/files/{fileId}` 패턴을 읽을 수 있어야 한다.
2. 저장 시 사용 파일 추출 기준을 `storedName`이 아니라 `fileId`로 바꾸는 편이 낫다.
3. `<img src="...">` 같은 HTML 이미지도 허용할지 정책을 정해야 한다.

권장안:

- 1차는 markdown image syntax `![alt](url)`만 공식 지원
- parser도 같은 규칙만 우선 지원
- raw HTML media는 나중에 확장

이유:

- 현재 preview는 ReactMarkdown 기본 이미지 렌더링과 잘 맞는다.
- 반면 raw HTML video/image는 preview와 저장 parser 정책이 쉽게 어긋난다.

### 4.8 자동저장 설계

목표:

- 사용자가 임시저장 버튼을 누르지 않아도 편집 중 변경이 draft로 주기적으로 저장된다.
- 자동저장은 발행 저장과 분리되고, 항상 `DRAFT` 기준으로만 동작한다.

정책:

- 자동저장 payload는 임시저장과 동일한 shape를 사용한다.
- 자동저장 시 `isPublic`은 항상 `false`로 저장한다.
- 사용자가 발행 상태 토글을 켜 두었더라도 자동저장만으로는 `PUBLISHED`로 바뀌지 않는다.
- 발행은 명시적인 수동 저장 버튼으로만 일어난다.

이유:

- 자동저장은 "작업 유실 방지" 책임만 가져야 한다.
- 입력 도중 visibility 상태까지 따라가며 publish되면 의도치 않은 공개 리스크가 생긴다.

1차 결정:

- autosave는 프론트에서 `isPublic=false`를 강제한다.

보완 메모:

- 1차 구현은 프론트 강제로 진행해도 된다.
- 다만 장기적으로는 백엔드도 autosave 요청이 publish로 승격되지 않도록 보호하는 편이 더 안전하다.

### 4.9 자동저장 트리거 규칙

권장 규칙:

- `title`, `description`, `markdown`, `tags`, `thumbnailId` 중 하나라도 바뀌면 dirty 상태로 전환
- 마지막 입력 후 `2초 ~ 5초` debounce
- 아래 조건이 모두 만족되면 autosave 실행

조건:

- `dirty === true`
- `pendingUploads.length === 0`
- 현재 수동 저장 요청이 없음
- 현재 autosave 요청이 진행 중이 아님

추가 트리거:

- 페이지 이탈 직전 `beforeunload` 경고
- route change 직전 dirty 상태면 즉시 autosave 시도 또는 경고
- 에디터 blur 시 즉시 저장은 선택 사항이고 1차에서는 debounce만으로 충분

### 4.10 프론트 상태 모델

권장 상태:

```ts
type EditorSaveState = {
  lastSavedAt: string | null
  saveStatus: "idle" | "dirty" | "saving" | "saved" | "error"
  isManualSaving: boolean
  isAutoSaving: boolean
  pendingUploadsCount: number
}
```

핵심 원칙:

- form 값 상태와 save 상태를 분리한다.
- autosave는 "지금 화면의 최신 snapshot"을 기준으로 동작해야 한다.
- 오래된 요청 응답이 늦게 돌아와 최신 내용을 덮지 않도록 request ordering guard가 필요하다.

권장 구현:

- 증가하는 `saveRequestId`를 둔다.
- 응답 반영 시 가장 최근 요청 id와 일치할 때만 `lastSavedAt`과 `saveStatus`를 갱신한다.

### 4.11 API 계약 방향

최소 변경안:

- 기존 `PATCH /posts/:postId`를 그대로 사용한다.
- autosave도 `SavePostRequest` payload를 그대로 보낸다.
- 프론트가 autosave일 때 `isPublic=false`로 보낸다.

권장 확장안:

- `PATCH /posts/:postId/draft` 또는 `PATCH /posts/:postId?mode=draft`
- autosave와 수동 발행 저장의 의도를 API 수준에서 분리

권장 이유:

- 백엔드가 autosave 요청에서 publish를 원천 차단할 수 있다.
- 감사 로그나 추후 저장 정책 분리에 유리하다.

첫 구현은 기존 `PATCH` 재사용으로 시작해도 되지만, 장기적으로는 draft 저장 endpoint 분리가 더 안전하다.

### 4.12 UI 상태 계획

상단 상태 UI 예시:

- `저장되지 않은 변경사항`
- `자동 저장 중...`
- `자동 저장됨`
- `저장 실패`
- `마지막 저장: 14:32`

현재 `EditorEditView`에는 자동저장 상태 영역의 주석 코드가 이미 있으므로, 이 영역을 실제 save state에 연결하는 방향이 자연스럽다.

버튼 정책:

- 자동저장 중에도 수동 임시저장 버튼은 비활성화하거나 요청을 합쳐야 한다.
- 발행 저장 버튼은 autosave in-flight 중이라도 최신 snapshot으로 즉시 재요청할 수 있어야 한다.
- 같은 시점에 autosave와 manual save를 동시에 보내지 않도록 직렬화가 필요하다.

### 4.13 요청 충돌 방지

문제:

- 사용자가 빠르게 입력하면 autosave debounce가 여러 번 예약될 수 있다.
- 이미지 업로드 직후 markdown 삽입이 일어나면 autosave 타이밍과 겹칠 수 있다.
- manual save가 눌린 순간 autosave 응답이 나중에 도착할 수 있다.

권장 규칙:

1. autosave timer는 마지막 입력 기준 하나만 유지한다.
2. autosave 요청 시작 전 이전 예약 timer는 모두 취소한다.
3. autosave in-flight 중 새 변경이 생기면 `dirtyAfterSave=true`로 표시한다.
4. 요청 종료 후 `dirtyAfterSave=true`면 바로 다음 autosave를 다시 예약한다.
5. manual save가 시작되면 pending autosave timer와 in-flight autosave 결과 반영을 무효화한다.

### 4.14 실패 처리

권장 처리:

- autosave 실패 시 `saveStatus=error`
- 다음 입력이 발생하면 다시 debounce 후 재시도
- 오류가 계속되면 수동 임시저장 버튼을 통해 명시 재시도 가능하게 유지

주의:

- autosave 실패를 toast로 매번 띄우면 소음이 크다.
- 상단 상태 영역에 에러를 고정 표시하고, 수동 저장 버튼 근처에 재시도 affordance를 두는 편이 낫다.

### 4.15 구현 순서

1. `EditorForm`을 controlled form 구조로 바꾼다.
2. markdown, thumbnail, tags, visibility를 한 곳에서 snapshot으로 수집할 수 있게 정리한다.
3. 임시저장 payload 생성 함수를 공통화한다.
4. `useEditorAutosave` 훅을 추가한다.
5. autosave status UI를 `EditorEditView` 상단에 연결한다.
6. pending upload와 autosave 충돌 가드를 넣는다.
7. manual save/auto save 동시 실행 방지 로직을 넣는다.

### 4.16 업로드 유효성 검사 설계

목표:

- 허용하지 않는 파일 형식과 과도한 용량 업로드를 초기에 차단한다.
- 프론트와 백엔드가 같은 제약을 공유하되, 최종 판정은 NestJS가 담당한다.

권장 정책:

- 1차 본문 이미지 허용 형식: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- 1차 썸네일 허용 형식: `image/jpeg`, `image/png`, `image/webp`
- 1차 비디오는 업로드 UI만 열어두지 말고 비활성화하거나 후속 범위로 분리
- 파일 크기 제한 예시
  - 썸네일: `5MB`
  - 본문 이미지: `10MB`

검사 위치:

1. 프론트 file picker 직후 1차 검사
2. Next.js `/api/storage/...` route는 그대로 전달만 수행
3. NestJS `uploadPostFile`에서 mime type, size를 최종 검증

이유:

- 프론트 검사는 UX 개선용이다.
- 실제 보안과 운영 제약은 백엔드 검증이 기준이어야 한다.

권장 env:

- `STORAGE_UPLOAD_MAX_IMAGE_BYTES`
- `STORAGE_UPLOAD_MAX_THUMBNAIL_BYTES`
- `STORAGE_UPLOAD_ALLOWED_IMAGE_MIME_TYPES`

## 5. 상태 전이 규칙

- 업로드 직후: `TEMP`
- 저장 payload에서 실제 참조됨: `ATTACHED`
- 이전에 참조되었지만 이번 저장에서 빠짐: `ORPHANED`
- 썸네일이 교체되거나 해제되어 더 이상 대표 이미지가 아님: `ORPHANED`
- 정리 크론에서 스토리지 삭제 성공: `DELETED`

주의:

- `TEMP -> ORPHANED`만 처리하면 부족하다.
- 이미 `ATTACHED`였던 파일이 다음 저장에서 빠질 수 있으므로 `ATTACHED -> ORPHANED`도 구현해야 한다.
- 썸네일도 본문 첨부와 동일하게 "현재 저장 기준 단 하나만 ATTACHED"라는 규칙을 가져야 한다.

## 6. 고아 파일 정리 크론 계획

### 6.1 목표

- 편집 도중 업로드되었지만 최종적으로 사용되지 않은 파일이 계속 누적되지 않게 한다.
- MinIO 오브젝트와 DB row를 함께 정리해 저장소 누수를 막는다.

### 6.2 권장 정책

- 대상 상태: `ORPHANED`
- 보존 기간: 예시 `24시간` 또는 `72시간`
- 실행 주기: 예시 `1시간마다`
- 배치 크기: 예시 `100개` 단위

보존 기간이 필요한 이유:

- 사용자가 저장 직후 다시 되돌리거나 재첨부할 수 있다.
- 업로드 직후 네트워크 오류나 저장 실패가 있어도 바로 삭제되면 복구가 어렵다.

### 6.3 구현 구조

권장 구성:

1. `@nestjs/schedule` 도입
2. `ScheduleModule.forRoot()`를 `AppModule`에 등록
3. `StorageCleanupService` 또는 `StorageOrphanCleanupService` 추가
4. `@Cron()` 메서드에서 삭제 후보 조회
5. 스토리지 오브젝트 삭제 성공 후 DB 상태를 `DELETED`로 갱신

예상 흐름:

```txt
Cron 실행
→ status=ORPHANED 이고 orphanedAt(or updatedAt)이 TTL 지난 파일 조회
→ N개씩 순회
→ MinIO object delete
→ 성공 시 DB status=DELETED, deletedAt 기록
→ 실패 시 로그 남기고 다음 배치에서 재시도
```

### 6.4 조회 조건

권장 조건:

- `status = ORPHANED`
- `orphanedAt <= now - retention`
- `take = batchSize`
- 오래된 순 정렬

`orphanedAt`이 없으면 임시로 `updatedAt`을 사용할 수 있지만, 장기적으로는 명시 필드가 낫다.

### 6.5 삭제 순서

권장 순서:

1. DB에서 후보 조회
2. object key 계산
3. MinIO delete 시도
4. 성공하면 DB `status=DELETED`
5. 실패하면 상태 유지

주의:

- DB 트랜잭션 안에서 외부 스토리지 삭제를 완전 원자적으로 묶을 수 없다.
- 그래서 "스토리지 삭제 성공 후 DB 마킹"의 보수적 순서가 낫다.
- 반대로 먼저 DB를 `DELETED`로 바꾸면 실제 object 삭제 실패 시 유실 추적이 어려워진다.

### 6.6 운영 고려사항

- 서버가 여러 인스턴스로 뜨면 동일 배치를 중복 실행할 수 있다.
- 멀티 인스턴스 운영 가능성이 있으면 DB advisory lock 또는 단일 worker 운영이 필요하다.
- 삭제 실패 로그에는 `fileId`, `postId`, `storedName`, `usage`를 남기는 편이 좋다.
- 너무 큰 배치를 한 번에 지우지 말고 작은 단위로 반복 실행하는 편이 안전하다.

## 7. 검증 체크리스트

- 본문에서 제거한 이미지가 저장 후 `ORPHANED`로 바뀌는지 확인
- 기존에 `ATTACHED`였던 본문 파일이 다음 저장에서 빠지면 `ORPHANED`로 바뀌는지 확인
- 썸네일을 교체하면 이전 썸네일이 `ORPHANED`로 바뀌는지 확인
- 썸네일을 제거하면 기존 썸네일이 `ORPHANED`로 바뀌는지 확인
- 이미지 업로드 성공 시 현재 커서 위치에 markdown가 삽입되는지 확인
- 업로드 중에는 저장 버튼이 비활성화되는지 확인
- draft 상태에서도 preview에서 방금 삽입한 이미지가 렌더링되는지 확인
- 입력 후 debounce 시간이 지나면 자동저장이 실행되는지 확인
- autosave는 항상 `DRAFT`로만 저장되고 발행되지 않는지 확인
- autosave 진행 중 추가 입력이 생기면 최신 snapshot으로 다시 저장되는지 확인
- autosave 실패 시 상단 상태가 에러로 바뀌고 다음 입력에서 재시도되는지 확인
- manual save 시작 시 pending autosave timer가 취소되는지 확인
- 임시 저장과 발행 저장이 `isPublic`, `status`, `publishedAt`을 올바르게 바꾸는지 확인
- 다른 사용자가 타인의 postId로 파일 업로드하지 못하는지 확인
- TTL 지난 `ORPHANED` 파일이 크론 실행 후 MinIO와 DB에서 정리되는지 확인
- 스토리지 삭제 실패 시 DB 상태가 성급하게 `DELETED`로 바뀌지 않는지 확인

## 8. 구현 순서 제안

1. 저장 시 본문/썸네일 상태 전이 규칙을 먼저 고친다.
2. `ATTACHED -> ORPHANED`와 썸네일 교체/해제 로직을 추가한다.
3. 필요하면 `orphanedAt`, `deletedAt` 필드를 migration으로 추가한다.
4. `@nestjs/schedule` 기반 cleanup service를 추가한다.
5. 배치 size, retention hour를 env로 뺀다.
6. markdown 이미지 삽입과 preview 라우팅을 연결한다.
7. 상태 전이 테스트와 크론 테스트를 추가한다.

## 9. 현재 로직 검토 후 추가 의견

### 9.1 `savePost`의 파일 상태 전이는 아직 불완전하다

현재 `apps/api/src/post/post.service.ts`의 `savePost`는 다음만 처리한다.

- 사용된 `CONTENT` 파일 중 `TEMP -> ATTACHED`
- 사용되지 않은 `CONTENT` 파일 중 `TEMP -> ORPHANED`
- 선택된 `THUMBNAIL` 파일 중 `TEMP -> ATTACHED`

빠진 부분:

- 기존 `ATTACHED CONTENT`가 markdown에서 제거됐을 때 `ORPHANED` 전환
- 이전 `ATTACHED THUMBNAIL`이 교체 또는 제거됐을 때 `ORPHANED` 전환

즉 지금 상태로는 고아 파일 정리 크론을 붙여도, 실제로는 `ATTACHED`에 남아 버린 파일이 계속 누적될 수 있다.

우선순위:

- 이 항목은 크론보다 먼저 고쳐야 한다.

### 9.2 `savePost`에도 작성자 권한 검증이 들어가야 한다

현재 `PATCH /posts/:postId`는 `ADMIN` 권한만 체크하고, `getEditablePostById`나 `uploadPostFile`처럼 작성자 소유 검증은 하지 않는다.

문서 기준 정책이 "기본 목록은 현재 로그인 사용자가 작성한 글만 조회"라면 저장도 같은 정책을 따라야 한다.

권장:

- `savePost`에도 `request.user`를 넘기고
- `post.authorId`와 로그인 사용자를 대조해 수정 가능 여부를 확인한다.

### 9.3 업로드 응답의 `publicUrl`은 재검토가 필요하다

현재 `apps/api/src/storage/storage.service.ts`는 업로드 직후 `publicUrl`을 응답으로 돌려준다.

우려:

- `TEMP`나 `ORPHANED` 파일도 직접 object URL로 접근 가능한 구조가 되면 권한 경계가 약해질 수 있다.
- 문서 목표는 드래프트 파일을 보호된 경로에서 다루는 방향과 더 잘 맞는다.

권장:

- 업로드 응답은 `fileId`, `storedName` 같은 식별자 중심으로 두고
- 실제 렌더링 URL은 `/api/storage/.../editable` 같은 보호 라우트에서 조합하는 편이 안전하다.

결론:

- `publicUrl`은 응답에서 제거하는 방향이 맞다.
- 파일 URL 조합은 앱 라우트 규칙에서 결정한다.
- 파일 조회는 항상 NestJS를 거쳐 MinIO에 접근하는 흐름으로 고정한다.

### 9.4 본문 첨부 업로드 규약을 먼저 고정해야 한다

현재 프론트에서는 썸네일 업로드만 일부 연결돼 있고, 본문 첨부 업로드 흐름은 아직 문서 수준에 가깝다.

그래서 먼저 아래를 고정하는 편이 좋다.

- 본문 첨부 업로드 API 호출 위치
- markdown에 삽입되는 URL 포맷
- 백엔드 `extractPostStorageStoredNamesFromMarkdown`가 파싱 가능한 URL 규칙

이 세 가지가 다르면 저장 시 참조 파일 추출이 실패하고, 정상 파일이 잘못 `ORPHANED`로 갈 수 있다.

### 9.5 크론 설정은 env로 분리하는 편이 낫다

운영 환경마다 보존 기간과 배치 크기가 다를 수 있으므로 아래 값은 env로 빼는 것을 권장한다.

- `STORAGE_ORPHAN_RETENTION_HOURS`
- `STORAGE_ORPHAN_CLEANUP_CRON`
- `STORAGE_ORPHAN_CLEANUP_BATCH_SIZE`

### 9.6 프론트 업로드 경로도 같이 정리해야 한다

현재 `apps/web/src/03_features/editor/ui/EditorThumbnail.tsx`는 업로드를 `/storage/${postId}/files`로 호출하고 있다.

확인할 점:

- 브라우저에서 직접 백엔드 `/storage/...`를 호출할지
- Next.js `/api/storage/...` 프록시를 통해 호출할지
- 인증 헤더와 쿠키 전달 방식을 어느 쪽에 맞출지

같은 디렉터리의 `apps/web/app/api/storage/[postId]/files/route.ts`는 아직 비어 있으므로, 실제 업로드 경로를 하나로 고정해 두는 편이 좋다.

결정:

- 브라우저는 무조건 Next.js `/api/storage/...`만 호출한다.
- Next.js API는 중간 레이어이고, 인증/권한/검증의 기준은 NestJS가 가진다.
- 업로드와 조회 모두 같은 원칙으로 맞춘다.

### 9.7 markdown state 소유권을 먼저 정리해야 한다

현재 `EditorMarkdownField`는 내부 `useState`로 markdown를 관리하고 있고, 하단 툴바 버튼은 `EditorForm` 바깥 레벨에서 렌더링된다.

이 구조에서는 아래가 어렵다.

- 현재 커서 위치 추적
- 업로드 성공 후 정확한 위치에 markdown 삽입
- 업로드 pending과 저장 버튼 상태 연동

권장:

- `EditorMarkdownField`를 controlled component로 바꾸고
- `EditorForm` 또는 별도 composer 훅이 markdown, selection, upload state를 함께 소유한다.

### 9.8 이미지부터 먼저 닫고, 비디오는 다음 단계로 미루는 편이 낫다

하단 툴바에는 이미지와 비디오 버튼이 모두 있지만, 현재 preview와 parser는 이미지 기준으로 먼저 맞추는 편이 안전하다.

이유:

- markdown image syntax는 ReactMarkdown 기본 렌더링과 바로 맞는다.
- 비디오는 raw HTML 허용 여부, preview 렌더링, 저장 parser 규칙을 추가로 정해야 한다.

그래서 1차 범위는 `image/*` 업로드와 markdown image 삽입으로 제한하고, video는 별도 후속 작업으로 분리하는 편이 낫다.

보완:

- 다만 video를 나중에 붙일 계획이라면 지금 object key 규칙, usage enum 확장성, parser 확장 지점은 미리 설계해 두는 편이 좋다.
- 즉 구현은 후속으로 미뤄도 인터페이스는 막히지 않게 남겨둔다.

### 9.9 자동저장은 임시저장과 publish를 분리해야 한다

현재 저장 payload는 `isPublic` 값 하나로 `DRAFT`와 `PUBLISHED`를 결정한다.

이 구조에서 autosave가 그대로 같은 payload를 사용하면 문제가 생긴다.

- 사용자가 발행 토글을 켠 상태에서 입력만 해도 자동 발행될 수 있다.
- autosave의 목적은 복구 지점 확보인데, publish까지 같이 일어나면 책임이 섞인다.

그래서 autosave는 아래 둘 중 하나가 필요하다.

- 프론트에서 autosave 시 무조건 `isPublic=false` 강제
- 백엔드에서 draft 전용 save endpoint 분리

둘 중 하나는 반드시 들어가야 한다.

1차 결정:

- autosave는 프론트에서 `isPublic=false` 강제로 간다.

### 9.10 자동저장과 업로드 pending은 같은 큐에서 봐야 한다

현재 문서 범위에는 이미지 업로드, 썸네일 업로드, markdown 삽입, 저장 상태 전이가 함께 들어간다.

따라서 autosave는 단순 form change 감지만 보면 안 된다.

- `pendingUploads > 0`이면 저장 보류
- 업로드 완료 후 markdown 삽입까지 끝난 snapshot에서만 저장
- 썸네일 업로드 후 `thumbnailId` state 반영까지 끝난 뒤 저장

이 가드가 없으면 파일은 `TEMP`인데 본문 snapshot은 저장된 상태가 되어 정합성이 흔들릴 수 있다.

#### 10. 기타 내 의견

파일의 확장자, 파일 크기 제한을 추가 해줘.

반영:

- 이 의견은 맞다.
- 다만 확장자만 보면 우회가 가능하므로 최종 검사는 mime type과 size 기준으로 해야 한다.
- 필요하면 확장자와 mime type을 둘 다 검사하되, 서버 판정은 mime type 우선으로 둔다.
