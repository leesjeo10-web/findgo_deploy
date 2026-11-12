# 찾Go 프론트엔드 구조안

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
