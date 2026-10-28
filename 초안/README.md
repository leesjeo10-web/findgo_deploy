# 찾Go Frontend

Figma의 찾Go 디자인을 바탕으로 구현한 학교 분실물·습득물 서비스입니다.

## 실행

Node.js 22.12 이상 또는 24 이상을 사용하세요.

```sh
npm install
npm run dev
```

개발 서버: http://127.0.0.1:5173

```sh
npm run build     # dist/에 정적 배포 파일 생성
npm run preview   # 빌드 결과 확인
npm test          # 데모 CRUD·권한 및 Axios 요청 계약 검증
```

## 구성

- React + Vite
- React Router: URL 라우팅, 뒤로 가기, 인증이 필요한 화면 보호
- Tailwind CSS v4: 토큰, 공통 컴포넌트와 반응형 스타일
- Zustand: 인증 세션, 물건 목록, 검색어, 알림
- Axios: API 인스턴스, Bearer 토큰, 타임아웃 및 오류 처리
- Noto Sans KR Variable: 로컬 번들 폰트

`src/pages/`는 화면, `src/components/`는 공통 UI, `src/stores/`는 상태,
`src/api/`는 서버 연동을 담당합니다. Figma 원본 SVG는 `public/assets/`에 저장했습니다.

## 구현 화면

| 주소 | 기능 |
| --- | --- |
| `/` | 메인, 통합 검색, 최근 습득물·분실물 |
| `/login` | 로그인, 비로그인 탐색 |
| `/signup` | 회원가입 |
| `/items/found` | 습득물 전체 목록·검색 |
| `/items/lost` | 분실물 전체 목록·검색 |
| `/items/detail/:id` | 물건 상세 |
| `/items/new/found` | 습득물 등록·사진 업로드 |
| `/items/new/lost` | 분실물 등록·사진 업로드 |
| `/items/:id/edit` | 내 물건 수정·상태 변경 |
| `/mypage` | 내 활동 집계·목록·수정·삭제 확인 다이얼로그 |

등록·수정·마이페이지는 로그인이 필요합니다. 로그인 후 원래 요청한 화면으로 돌아갑니다.
사진은 JPG/PNG/WEBP, 최대 5MB이며, 선택 즉시 미리보기를 제공합니다.

## 데모 모드

백엔드 주소 없이도 바로 실행됩니다. 형식에 맞는 이메일과 비어 있지 않은 비밀번호로
데모 로그인할 수 있습니다. 회원가입 비밀번호는 8자 이상이어야 합니다.
**실제 인증·계정 생성은 하지 않으며 비밀번호는 저장·전송하지 않습니다.**

데모 사용자 ID는 하나이며, 원본 디자인의 샘플 물건 8개가 이 사용자에 연결됩니다.
데모의 등록·수정·삭제는 브라우저 `localStorage`의 `chatgo-demo-items-v1`에 저장됩니다.
새로고침 후에도 유지되고, 해당 키를 삭제하면 원본 샘플로 초기화됩니다.
인증 정보는 탭의 `sessionStorage`에 유지됩니다.

## 백엔드 연결

아직 실제 백엔드 주소나 API 명세가 제공되지 않았습니다. 아래는 프론트에서 정의한
**예상 API 계약**이며, 실제 서버 명세에 맞춰 `src/api/services.js`를 조정해야 합니다.

`.env.example`을 `.env.local`로 복사하고 다음 값을 설정한 뒤 개발 서버를 재시작하세요.

```dotenv
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080/api
```

| Method | 경로 | 요청 / 응답 |
| --- | --- | --- |
| POST | `/auth/login` | JSON `{email,password}` → `{user,accessToken}` |
| POST | `/auth/signup` | JSON `{name,email,password}` → `{user,accessToken}` |
| POST | `/auth/logout` | 로그아웃 |
| GET | `/items` | 물건 배열 또는 `{items: [...]}` |
| GET | `/items/:id` | 물건 객체 |
| POST | `/items` | multipart/form-data → 생성한 물건 객체 |
| PATCH | `/items/:id` | multipart/form-data → 수정한 물건 객체 |
| DELETE | `/items/:id` | 2xx 성공 |

사용자: `{ id, name, email }`

물건:

```json
{
  "id": "1",
  "type": "found",
  "name": "검은색 반지갑",
  "description": "검은색 반지갑이에요.",
  "place": "학생회관",
  "date": "2026-09-03",
  "createdAt": "2026-09-03T01:00:00Z",
  "storagePlace": "학생회관 1층 분실물 보관함",
  "status": "stored",
  "image": "/uploads/wallet.jpg",
  "ownerId": "user-id",
  "ownerName": "건주"
}
```

`type`: `found` / `lost`. `status`: `stored` / `searching` / `returned`.
사진은 multipart의 `image` 필드로 원본 File을 보냅니다. 수정 시 새 사진이 없으면 기존 사진을 유지해야 합니다.
`image` 응답은 프론트에서 접근 가능한 절대 URL 또는 동일 출처의 경로여야 합니다.

토큰은 `Authorization: Bearer ...`로 전달하며 쿠키 요청도 허용합니다.
서버에서 프론트 출처에 대한 CORS 및 credentials 설정과 소유권 검증이 필요합니다.
실패 응답은 `{message: "안내 문구"}`를 사용할 수 있습니다.
401은 세션을 초기화하고, 보호된 화면에서는 다시 로그인으로 이동합니다.
프론트 환경 변수에는 비밀 키를 넣지 마세요.

## 배포

`dist/`를 정적 호스팅으로 배포하고 모든 앱 경로를 `index.html`로 재작성하세요.
실제 서버 로그인·CORS·DB·파일 저장소는 아직 연결되지 않았습니다.

디자인 출처: https://www.figma.com/design/PxgQpOLb4qpkOX0dkEb7Ec?node-id=2-76
