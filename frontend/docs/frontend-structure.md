# 찾Go 프론트엔드 구조안

> 2026-11-14 B 구현 변경은 이 문서 마지막 절에 기록했다. 그 전의 인증·전화번호·사진 정책과 ‘아직 구현하지 않았다’는 문장은 과거 계획이며 최신 백엔드 계약과 마지막 변경 기록을 우선한다.

현재는 사용자 요청으로 **로그인 없는 물품 기능 구현**을 시작했다. 이 문서는 인증까지 포함한 전체 계획이며, 실제 완료 범위는 [구현 기록](frontend-implementation.md)과 [최신 결정](decisions.md)을 우선한다. 아래의 "아직 만들지 않았다"는 구조 검토 당시 기록이다.

2026-11-12 개인 Notion의 새 기획서 12개와 API 표 16개를 대조해 갱신한 **구현 전 계획**이다.
기존 app / features / shared 구분을 유지하고, 비밀번호 변경·학생 관리 경계를 보완한다.
이번 작업은 Markdown만 수정했다. 아래 새 JSX·폴더·스타일·API는 아직 만들지 않았다.

## 기준과 우선순위

1. 사용자의 최신 지시와 [결정 기록](decisions.md).
2. 새 개인 Notion 기획서와 API. [검토 근거와 미해결 사항](spec-review-2026-11-12.md) 참고.
3. chatgo-design의 개별 HTML 5개: 시각 디자인 기준. 기획과 다른 동작은 새 기획을 따른다.
4. 이전 로컬 기획 문서와 chatgo-screens.html: 과거 기록이며 현재 기능 명세로 사용하지 않는다.

현재 문서의 계약은 아래와 같다. 실제 백엔드 구현과 일치하는지는 연동 전에 확인한다.

- 학생 아이디는 숫자 6자리(입학년도 2자리 + 1학년 때 학번 4자리, 예: 261109), 관리자 아이디는 admin.
- 로그인 요청은 loginId, password. 응답은 accessToken과 사용자 정보이며 role, mustChangePassword를 사용한다.
- 회원가입 없음. 모든 서비스 화면은 로그인 필요. 로그인 뒤에는 물품 목록으로 가며 이전 주소로 복귀하지 않는다.
- 학생의 첫 로그인·관리자 초기화 뒤에는 비밀번호 변경부터 완료한다.
- 학생은 비밀번호·전화번호를 변경하고, 선생님은 학생 추가·비밀번호 초기화·삭제와 게시물 삭제를 한다.
- 이번 대화에서 사진 원본도 로그인 필수, 분실물 등록 때 연락처 필수, JPG/PNG만 허용하고 변환 제외로 확정했다.
- 연락처는 마이페이지 계정 정보에 저장하고 작성자 연락처로 사용한다. 사용자 의견인 "수정 허용·삭제 금지"는 명시적으로 미확정이다. 사진 3시간 정리의 출시 범위·관리자 번호 형식도 답변 전에는 확정하지 않는다.

## 화면: 기본 6개 + 추가 제안 2개

| 화면 | 구성 | 디자인과의 관계 |
| --- | --- | --- |
| LoginPage | LoginForm, 계정 문의·오류·만료 안내 | 로그인 HTML. 비회원 둘러보기·8자리 예시·공통 초기 비밀번호 문구 조정 |
| PasswordChangePage | PasswordChangeForm, 강제 변경 안내·로그아웃 | 로그인 HTML의 변경 상태. 강제 변경을 주소로 관리하도록 별도 페이지 제안 |
| ItemListPage | HomeBanner, AccountPanel, 검색·필터·목록 | 메인 HTML. 비회원 배너·패널 상태 제외 |
| ItemDetailPage | 사진·정보·연락처·작성자/관리자 버튼·삭제 확인 | 상세 HTML. 관리자 역할 추가, 비회원 상태 제외 |
| ItemCreatePage | ItemForm, ItemImageInput, ItemPreview | 등록 HTML |
| ItemEditPage | 같은 ItemForm, 초기값·상태 선택·수정 처리 | 등록 HTML의 수정 모드 |
| MyPage | MyProfile, 연락처 편집, PasswordChangeForm, MyItemSummary, MyItemList | 마이페이지 HTML. 내 정보 수정은 우선 같은 페이지의 편집 영역으로 제안 |
| AdminStudentsPage | 학생 검색·목록·추가 폼·초기화·삭제 확인 | 새 기획에 필요하지만 제공된 최신 디자인에는 없음 |

8개는 프론트 구성 제안이다. 내 정보 수정·학생 추가를 각각 별도 주소로 나눠야 한다는 확정 요구는 없다.
관리자 게시물 전용 목록은 추가하지 않고 기존 물품 목록·상세와 삭제 흐름을 사용한다.

## 폴더·컴포넌트 제안

아래는 실제 파일 목록이 아닌 **앞으로의 구성안**이다. api / hooks / model 내부 파일은 필요해질 때 만든다.

```text
src/
├── main.jsx
├── index.css
├── app/
│   ├── App.jsx
│   ├── router/AppRouter.jsx
│   └── providers/AppProviders.jsx
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   └── PasswordChangePage.jsx
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── PasswordChangeForm.jsx
│   │   │   ├── RequireAuth.jsx
│   │   │   └── RequireAdmin.jsx
│   │   ├── api/
│   │   └── model/
│   ├── items/
│   │   ├── pages/
│   │   │   ├── ItemListPage.jsx
│   │   │   ├── ItemDetailPage.jsx
│   │   │   ├── ItemCreatePage.jsx
│   │   │   └── ItemEditPage.jsx
│   │   ├── components/
│   │   │   ├── HomeBanner.jsx
│   │   │   ├── AccountPanel.jsx
│   │   │   ├── ItemSearchForm.jsx
│   │   │   ├── ItemFilters.jsx
│   │   │   ├── ItemGrid.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   ├── ItemImage.jsx
│   │   │   ├── ItemBadges.jsx
│   │   │   ├── ItemForm.jsx
│   │   │   ├── ItemImageInput.jsx
│   │   │   ├── ItemPreview.jsx
│   │   │   ├── AuthorContact.jsx
│   │   │   └── DeleteItemDialog.jsx
│   │   ├── api/
│   │   ├── hooks/
│   │   └── model/
│   ├── my-page/
│   │   ├── pages/MyPage.jsx
│   │   ├── components/
│   │   │   ├── MyProfile.jsx
│   │   │   ├── MyItemSummary.jsx
│   │   │   └── MyItemList.jsx
│   │   └── api/
│   └── admin/
│       ├── pages/AdminStudentsPage.jsx
│       ├── components/
│       │   ├── StudentList.jsx
│       │   ├── StudentCreateForm.jsx
│       │   ├── ResetStudentPasswordDialog.jsx
│       │   └── DeleteStudentDialog.jsx
│       └── api/
└── shared/
    ├── layout/
    │   ├── AppLayout.jsx
    │   ├── Header.jsx
    │   └── Footer.jsx
    ├── ui/
    │   ├── Button.jsx
    │   ├── FormField.jsx
    │   ├── TextInput.jsx
    │   ├── PasswordInput.jsx
    │   ├── Dialog.jsx
    │   ├── ConfirmDialog.jsx
    │   ├── LoadingState.jsx
    │   ├── EmptyState.jsx
    │   ├── ErrorState.jsx
    │   ├── LoadMoreButton.jsx
    │   └── Toast.jsx
    ├── api/
    ├── assets/
    │   ├── brand/
    │   ├── illustrations/
    │   └── fonts/
    └── styles/
        ├── tokens.css
        ├── fonts.css
        └── global.css
```

## 각 영역의 책임

| 영역 | 맡을 일 | 연결 |
| --- | --- | --- |
| app | 주소·레이아웃·앱 전체 상태 조립 | 입력 검사·물품 저장 규칙은 각 기능에 둠 |
| auth | 로그인, 내 정보 조회로 인증 확인, 비밀번호 변경, 로그인·역할 검사 | my-page가 변경 폼과 인증 사용자 정보 재사용 |
| items | 물품 조회·검색·등록·수정·삭제·사진과 내 물품 조회 | my-page가 물품 API·이미지·배지 재사용 |
| my-page | 프로필·전화번호 편집, 전체 개수와 내 물품 행 목록 | 내 정보 조회는 auth, 물품 기능은 items 재사용 |
| admin | 학생 목록·추가·초기화·삭제 | auth 권한 검사, shared 입력·대화상자 사용 |
| shared | 공통 UI·레이아웃·HTTP 기본 설정·자산·스타일 | 기능 API를 직접 호출하거나 features를 역으로 가져오지 않음 |

전화번호 변경 API 주소가 /api/auth/me여도 화면 책임은 my-page에 둬도 된다.
내 정보는 하나의 인증 사용자 정보를 기준으로 갱신하며 화면마다 별도 복사본을 유지하지 않는다.
공통 HTTP 설정과 인증 상태는 app에서 연결해 shared가 features에 의존하지 않게 한다.

## 공유할 부분과 분리할 부분

- 등록·수정은 ItemForm, 입력 규칙, ItemImageInput, ItemPreview를 공유. API·초기값·상태 선택만 다르게 연결한다.
- 메인 목록과 ItemPreview는 ItemCard 공유. 미리보기 값은 폼에서 받고 별도 저장하지 않는다.
- 카드·상세·내 물품은 ItemImage의 기본 이미지·실패 표시와 ItemBadges의 구분·상태 표시를 공유한다.
- 첫 변경·일반 변경은 PasswordChangeForm 공유. 강제 변경에는 취소 대신 로그아웃, 관리자에게는 변경 폼 대신 불가 안내를 둔다.
- 분실물 등록과 FOUND→LOST 수정은 계정 연락처를 확인하고 없으면 입력을 안내한다. 서버도 최종 확인하며, 별도 게시물 전화번호 필드를 임의로 추가하지 않는다.
- 계정 전화번호가 현재 Notion에서 선택 입력이라는 점과 분실물 등록 조건을 구분한다. 번호 삭제 제한은 미확정이므로 MyProfile의 삭제 기능을 지금 제거하거나 정책을 확정하지 않는다.
- 학생·물품 삭제는 ConfirmDialog 공유. 문구·권한·API·완료 후 이동은 각 기능에서 처리한다.
- 메인 카드 격자와 마이페이지 가로 행은 각각 둔다. MyItemList의 행은 우선 같은 파일 안에 둔다.
- 메인·관리자 검색은 입력 부품만 공유한다. 학생 API는 검색 매개변수 없이 전체 배열이므로 우선 화면에서 필터하는 방식을 제안한다.
- FormField는 제목·오류 배치, TextInput은 실제 입력칸, PasswordInput은 보기/숨기기 담당. 필드마다 파일을 만들지 않는다.
- textarea·select는 우선 기본 HTML 요소와 공통 스타일을 사용한다.

개수와 사용 위치는 [재사용 부품 목록](reusable-components.md)에 정리했다.

## 화면 보호·권한·API 계획

- GET /api/auth/me로 로그인 상태·역할·mustChangePassword 확인. 확인 중에는 보호 화면을 먼저 보여주지 않는다.
- 토큰 없음·만료 → 로그인. STUDENT이고 변경 필요 → PasswordChangePage. 그 밖에는 목록.
- RequireAuth는 변경 화면 자체는 허용해 같은 화면으로 계속 이동하지 않게 한다. 서버의 변경 전 API 제한·실패 응답은 추가 합의가 필요하다.
- 비밀번호 변경은 204로 사용자 정보가 없다. 성공 후 내 정보를 재조회해 mustChangePassword=false를 반영하는 방식을 제안한다.
- 로그인 후 이전 주소 복귀는 하지 않는다. 목록 검색 조건을 URL에 보관하는 동작과 구분한다.
- 작성자·관리자를 별도 판단한다. 제안: 수정=isOwner, 삭제=isOwner 또는 isAdmin. 관리자 자기 글 수정 문구는 명확화 필요.
- 학생 삭제 확인은 게시물·사진도 함께 지운다고 안내한다. 관리자 계정은 삭제·화면 비밀번호 변경 대상에서 제외한다.
- 입력·칸별 오류는 폼, API·완료 후 이동은 페이지·훅. 공통 Button에 서버 요청을 넣지 않는다.
- 검색 조건은 URL, 입력은 폼, 조회 결과는 화면·훅, 인증은 앱 전체에서 관리한다.

## 기존 뼈대와 구현 대기 항목

- 기존 JSX 뼈대 33개와 main.jsx는 보존했다. 실제 UI·동작은 아직 없다.
- SignupPage / SignupForm은 보관만 하고 새 화면·라우트에서 제외한다.
- ItemStatusBadge / ItemOwnerActions도 보존한다. 통합·정리는 실제 구현 때 판단한다.
- Footer는 원본 메인에서만 확인된다. 전 화면에 임의로 추가하지 않는다.
- 배너 슬라이드·상세 문단·필드 하나마다 파일을 만들지 않는다.
- 관리자 디자인과 내 정보 수정의 최종 배치를 받으면 조정한다. 지금은 새 빈 JSX를 늘리지 않는다.

구현 시작 요청 뒤 자산·공통 스타일·부품 → 화면 조립 → 실제 API 연결 순서로 진행한다.
그전에 [최신 검토의 질문](spec-review-2026-11-12.md)에 답하고 추가 디자인을 받는다.
이번 검토는 코드 구현·Notion 편집·배포가 아니다.


## 2026-11-14 B 담당 백엔드 연결 변경 기록

이 절은 위의 구현 전 구조안보다 우선하는 현재 구현 기록이다. 기준은 팀 저장소 backend-jwt의 b00af01 및 해당 docs/API.md이다. 그 이후 서버 변경은 다시 대조해야 한다.

### 브랜치와 검토 방법

- `feat/item-api-images`: 물품 조회·등록·수정·삭제·내 물품·사진을 서버 API로 전환하는 하나의 연결 작업. 사진 업로드 응답을 등록 폼이 바로 사용하므로 같은 브랜치에서 검증한다.
- `feat/profile-settings`: 마이페이지 내 정보·비밀번호·전화번호 변경. 첫 로그인 강제 변경 화면과 학생 관리 화면은 A 범위이므로 만들지 않았다.
- 두 브랜치는 모두 `frontend---b`의 e0a6a67에서 시작했고, 별도 작업 폴더에서 검토했다. 2026-11-16 사용자가 두 브랜치의 커밋을 승인했다. 푸시·PR은 아직 진행하지 않는다.
- 공통 `shared/api/http.js`, `shared/api/currentUser.js`, 환경변수 예시, API 명세는 두 브랜치에 동일하다. 두 브랜치는 독립적으로 커밋하므로 공통 파일이 양쪽에 포함된다. PR을 합칠 때 동일한 공통 구현을 유지한다.
- `MyPage.jsx`는 한 브랜치에서는 내 물품 API 전환, 다른 브랜치에서는 설정 컴포넌트 삽입을 한다. 합칠 때 두 변경을 모두 유지한다. 이 문서의 변경 기록 역시 양쪽을 유지한다.

### 공통 API 요청 및 A와의 연결

- `shared/api/http.js`: fetch를 공통 경계로 사용한다. `VITE_API_BASE_URL`은 `/api`를 제외한 서버 주소다. 요청에는 Bearer 헤더를 붙이고 JSON·multipart·204 응답을 구분한다. multipart의 Content-Type은 브라우저가 boundary와 함께 설정한다.
- 사용자가 8080을 재확인했으므로 개발 기본값과 `.env.example`은 `http://localhost:8080`으로 설정한다. 단, 확인한 백엔드 application.properties 기본 포트와 docs/API.md 예시는 **8081**이다. 백엔드를 8081로 실행하면 환경변수를 8081로 바꿔야 한다. 운영에서는 서버 주소 미설정을 오류로 안내하며 방문자 localhost로 요청하지 않는다.
- 토큰 저장 위치는 사용자 확인상 미정이다. B는 토큰을 저장·조회·삭제할 위치를 가정하지 않고, 기본 getToken은 빈 값을 반환한다. A가 `configureApiAuth({getToken, onUnauthorized})`로 토큰 읽기와 인증 정리·이동을 연결한다. 로그인 성공·로그아웃·화면 보호·첫 로그인 분기는 A가 구현한다.
- 401: 등록된 `onBeforeUnauthorized` 임시 저장 처리를 기다림 → A의 onUnauthorized 호출 → A가 자신이 선택한 저장소의 토큰과 사용자 상태를 정리하고 로그인 화면으로 이동. A 핸들러 연결 전에는 `finder:unauthorized` 이벤트를 발생시키고 오류를 표시한다. 이 브랜치에는 로그인 화면·RequireAuth 구현이 없으므로 존재하지 않는 /login으로 강제 이동하는 루프를 만들지 않는다. A가 onUnauthorized에서 로그인 이동과 전역 인증 상태 정리를 연결해야 인증된 전체 흐름이 완성된다. 403은 로그아웃시키지 않고 서버 문구를 표시한다.
- 마이페이지 변경 후 `finder:user-updated` 이벤트로 갱신된 사용자 정보를 알린다. A는 인증 상태에 이 정보를 반영하거나 자신의 상태 갱신 함수와 연결해야 한다.
- 개발 브라우저 주소가 백엔드 CORS 허용 주소에 포함되어야 한다. 백엔드 기본 허용값은 http://localhost:5173이므로 5175 등으로 접속하면 서버 설정도 맞춰야 한다. 프론트에서 임의로 CORS를 우회하지 않는다.

### 달라진 정책

- 기존의 사진 조회 Bearer→Blob 방식 대신, 최신 백엔드 명세대로 사진은 **공개 GET**, 업로드만 인증한다. UUID 주소는 인증 수단이 아니므로 예전의 ‘사진도 로그인 필수’ 정책과 달라졌음을 팀에 공유해야 한다.
- 학생 아이디는 4자리, 관리자 0000, 회원가입 없음은 A가 로그인 화면에 반영할 사항이다. B에서 로그인·회원가입·관리자 기능을 새로 구현하지 않는다.
- 미연결 서버 사진 삭제는 최신 백엔드에서 **6시간**, 작성 임시 저장은 **3시간**이다. 프론트가 서버 사진 자동 삭제를 실행하는 것은 아니다.


### 물품·사진 브랜치에서 무엇을 어떻게 바꿨나

| 파일/영역 | 이전 | 변경 후와 이유 |
| --- | --- | --- |
| items/api/itemRepository.js | IndexedDB 읽기·쓰기 | `/api/items` GET/POST, `/api/items/{id}` GET/PUT/DELETE, 상태 PATCH를 호출한다. 서버 필드만 전송하고 id·userId는 서버가 결정한다. |
| items/hooks/useItemList.js | 로컬 목록 조회 | 서버 페이지의 content·page·last·totalElements 사용. 검색·정렬·종류·구분·상태와 다음 페이지를 서버에 보낸다. |
| my-page/pages/MyPage.jsx | 브라우저 전체 물품 | `mine: true`로 `/api/me/items`를 사용한다. 습득·분실 개수는 같은 API에 type과 size=1을 보내 totalElements 두 개로 계산한다. 별도 집계 API를 지어내지 않는다. |
| items/api/imageApi.js | 서버 업로드 없음 | 파일 형식·용량·헤더·디코딩 검사 후 POST `/api/images`, multipart 필드 `file` 사용. 선택 시 업로드하고 imageUrl만 폼에 보관한다. |
| ItemImageInput·ItemImage | Blob 저장 중심 | 업로드 진행·실패를 안내하고 받은 imageUrl로 미리보기한다. 서버 상대 경로는 API 서버 주소를 붙여 img src로 표시한다. URL에 토큰을 넣지 않는다. |
| ItemForm·itemModel | 로컬 입력 | itemCategory 선택·검사 추가. 등록·수정 시 서버에 imageUrl 첨부. 사진 제거는 imageUrl=null, LOST 보관 장소는 null로 전송한다. |
| AuthorContact·ItemDetailPage | 연락처 미표시 | 상세 응답의 userName·userPhone·userOfficePhone 표시. 목록에는 없는 필드이므로 상세 API 응답만 사용한다. |
| ItemOwnerActions | 누구에게나 수정·삭제 표시 | `/api/auth/me`의 id와 물품 userId를 비교해 작성자에게만 표시한다. 서버 403도 처리한다. 타인 글의 선생님 삭제 버튼은 A가 추가한다. |
| itemDraft·ItemForm·DraftResumeNotice | 만료 복원 없음 | 401 직전에 텍스트·종류·상태·이미지 URL을 localStorage에 3시간 저장한다. 계정 ID와 글 ID별로 분리하고 같은 계정에서 이어쓰기 링크를 통해 복원한다. 저장 성공 후 삭제한다. |
| shared/lib/browserDatabase.js | 물품 IndexedDB | 실행 경로에서 제거했다. 기존 브라우저 데이터는 서버로 자동 이관하지 않으며, 사용자 데이터를 임의 삭제하지 않는다. |

사진 업로드 실패·네트워크 실패 시 기존 글은 저장하지 않는다. 사진 업로드 성공 뒤 글 저장이 실패하면 받은 URL은 폼에 유지해서 재시도한다. 아직 서버에 올라가지 못한 파일은 만료 후 다시 선택해야 한다. 미연결 업로드는 서버가 6시간 뒤 정리한다.

임시 저장은 토큰·비밀번호·연락처를 저장하지 않는다. 3시간이 지나면 복원 대상에서 제외하고 다음 조회 때 브라우저 저장값을 제거한다. 브라우저가 닫혀 있는 동안 특정 시각에 데이터를 물리 삭제하는 예약 작업은 아니다. 저장소 사용 불가·용량 부족 시 저장 실패를 알린다.

서버 POST에 멱등성 계약이 없으므로 응답 유실 후 등록 재시도까지 중복 방지를 보장하지 않는다. 화면 내 동시 제출은 막지만, 네트워크 결과가 불확실하면 목록에서 등록 여부를 확인해야 한다. 클라이언트 UUID를 보내 서버가 중복 방지하는 것으로 가정하지 않는다.

### 검증과 남은 연결

- API 요청 모의 응답으로 Bearer·JSON·multipart·204·403·401 처리 순서, 목록 쿼리·내 물품·집계·작성 payload·사진 업로드 계약을 검사했다.
- 임시 저장의 3시간 만료·계정 및 글 구분·잘못된 저장값 처리와 입력·이미지 검사를 실행했다. Node 업로드 테스트에서는 브라우저 이미지 디코더 경계만 대체하므로 실제 사진 디코딩의 브라우저 검증을 대신하지 않는다.
- Vite 프로덕션 빌드를 확인한다. 실제 백엔드 로그인·DB·업로드·사진 자동 삭제·권한·CORS의 통합 검증은 A의 인증 코드와 실제 서버가 준비된 뒤 해야 한다.


### A 담당자가 연결할 최소 코드 예시

아래 함수 이름은 A의 실제 구현에 맞춰 연결한다. 토큰 저장소는 B가 지정하지 않는다.

```js
import { configureApiAuth } from './shared/api/http.js'
configureApiAuth({
  getToken: () => authState.getAccessToken(),
  onUnauthorized: () => {
    authState.clearSession()
    navigate('/login', { replace: true })
  },
})
```

현재 사용자가 8080을 확인했고 토큰 저장 위치는 미정이라고 답했으므로, 이 연결 전에는 B의 요청에 Bearer 토큰이 자동으로 생기지 않는다. 토큰을 URL에 넣거나 테스트 계정을 제품 코드에 추가하지 않았다.

### 2026-11-14 검토 결과

두 브랜치를 합친 임시 검토 폴더에서 테스트 11개와 빌드를 확인했다. 별도의 일회성 테스트 응답 서버를 사용한 브라우저 확인에서는 물품 목록·상세·사진 표시·사진 선택 및 업로드 응답·글 등록·수정 및 상태 반영·작성자 연락처·내 물품·설정 폼 표시를 확인했다. 401 응답 후 입력값 보존과 새로고침 후 같은 계정의 임시 저장 복원도 확인했다. 이는 실제 백엔드 인증·DB 저장·이미지 변환·자동 삭제 검증이 아니며, 테스트 응답 서버 코드는 프로젝트에 포함하지 않는다.

물품 브랜치와 마이페이지 브랜치는 2026-11-16 사용자 승인에 따라 각각 커밋한다. 브라우저 확인에 사용한 임시 폴더는 두 브랜치의 통합 검토용 복사본이며 별도 기능 브랜치나 배포본이 아니다.


### 마이페이지 브랜치에서 무엇을 어떻게 바꿨나

| 파일/영역 | 변경 내용과 이유 |
| --- | --- |
| my-page/api/profileApi.js | PATCH `/api/auth/me`에 phone·officePhone, PATCH `/api/auth/me/password`에 currentPassword·newPassword 전송. |
| my-page/components/ProfileSettings.jsx | GET `/api/auth/me`로 사용자 정보 표시. 연락처·비밀번호 폼과 로딩·성공·실패·재조회 UI 추가. 기존 MyPage에 삽입한다. |
| my-page/model/profileValidation.js | 전화번호 필수·삭제 불가, 서버가 허용하는 휴대전화 및 교무실 번호 형식 검사. 새 비밀번호 8~64자·확인 일치 검사. 비밀번호 공백을 임의 trim하지 않는다. |
| 비밀번호 변경 후 동기화 | 서버 204를 처리한 뒤 비밀번호 입력값을 지우고 내 정보를 재조회해 mustChangePassword를 갱신한다. 조회 실패 시 ‘비밀번호 변경은 성공했으나 재조회 실패’로 구분해 안내한다. |
| 사용자 상태 | 연락처 변경 응답 및 비밀번호 변경 후 조회 결과를 finder:user-updated로 알린다. A가 전역 인증 사용자 상태와 연결해야 한다. |
| 관리자 계정 | 비밀번호 변경 폼을 숨긴다. 내 연락처 변경에 필요한 교무실 번호만 함께 입력한다. 학생 추가·삭제 등 관리 화면은 구현하지 않는다. |

이 브랜치는 계정 설정 기능만 바꾸므로 단독 실행 시 기존 물품 IndexedDB 코드는 남아 있다. 물품·사진 브랜치를 합쳐야 서비스 전체 물품 데이터가 API로 전환된다.

### 검증과 남은 연결

- 연락처 필수·관리자 번호·비밀번호 길이·확인값과 PATCH 요청·204 응답을 테스트한다.
- 기존 테스트와 프로덕션 빌드를 확인한다. 로그인 화면·초기 비밀번호 강제 변경·전화번호 첫 입력 분기는 A 범위이며 실제 계정으로 통합 확인이 필요하다.


