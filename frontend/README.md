# Finder · 찾Go

선배님이 제공한 chatgo-design을 React 18 + Vite로 옮긴 분실물·습득물 웹사이트다.
기존 Finder 저장소에서 개발했으며 새 프로젝트를 만들지 않았다.

## 현재 동작하는 기능

- 메인 안내 배너·빠른 메뉴·물품 목록.
- 검색어, 습득/분실 구분, 상태, 등록 최신순/오래된 순. 검색 조건을 URL에 보관.
- 목록을 20개씩 추가로 불러오기.
- 물품 등록·상세·수정·찾는 중/해결 완료 변경·삭제 확인.
- JPG/PNG 사진 1장(최대 5MB) 선택·미리보기·교체·제거.
- 등록/수정 공유 폼, 필수 항목·글자 수·미래 날짜 검사와 실시간 카드 미리보기.
- 내 물품 행 목록·필터·전체 습득물/분실물 개수.
- 로딩·빈 결과·실패 안내·완료 알림과 모바일 배치.

**이번 버전은 로그인·토큰·실제 서버 연결을 구현하지 않았다.**
물품과 사진은 현재 브라우저의 IndexedDB에 저장된다. 새로고침해도 유지되지만 다른 브라우저·주소·기기와 공유되지 않으며, 브라우저 데이터를 지우면 함께 지워진다.
내 물품은 이번 브라우저에서 등록한 항목을 뜻한다. 계정 사용자나 권한 검증을 흉내 내지 않는다.

초기 샘플 물품·가짜 이름·전화번호는 자동으로 넣지 않는다. 처음에는 빈 목록이다.
계정 연락처·프로필·비밀번호 변경·관리자 기능과 미확정 정책은 보류했다.
분실물 등록의 계정 연락처 확인과 사진 조회 인증도 나중의 인증·API 연결 단계에서 적용한다.

이 브랜치는 현재 프론트 프로젝트인 `frontend/`만 포함한다. 예전 루트 프론트 코드는 제거했다. 아래 명령은 `frontend/` 폴더에서 실행한다.

## 실행·검증

```bash
npm ci
npm run dev
npm test
npm run build
```

팀 저장소를 배포할 때는 프론트의 Root Directory를 `frontend`로 설정해야 한다.
개발 서버가 출력한 Local 주소로 접속한다. 기존 서버가 같은 포트를 사용하면 Vite가 다른 포트를 선택할 수 있다.
빌드 결과는 dist/에 생성되며 render.yaml의 정적 사이트 설정은 유지했다. 이번 작업에서 배포·커밋·푸시는 하지 않았다.

## 실제 구현 구조

```text
src/
├── main.jsx
├── app/
│   ├── App.jsx                     # 라우터·완료 알림 조립
│   └── router/AppRouter.jsx
├── features/
│   ├── auth/                       # 기존 뼈대 보존, 미사용
│   ├── items/
│   │   ├── pages/                  # 목록·상세·등록·수정
│   │   ├── components/             # 배너·검색·카드·공유 폼·사진·삭제 확인
│   │   ├── api/itemRepository.js    # 현재 브라우저 저장 구현
│   │   ├── hooks/                  # 목록·상세 조회 상태
│   │   ├── model/                  # 입력·사진 검사·검색·정렬
│   │   └── styles/
│   └── my-page/
│       ├── pages/MyPage.jsx
│       ├── components/             # 내 물품 행·전체 개수
│       └── styles/
└── shared/
    ├── layout/                     # Header·Footer·AppLayout
    ├── ui/                         # 버튼·필드·상태·확인창·알림
    ├── lib/                        # 브라우저 DB·날짜·자산
    ├── assets/                     # 제공된 로고·폰트·일러스트
    └── styles/                     # 폰트·디자인 값·공통 스타일
```

현재 주소는 /, /items/new, /items/:id, /items/:id/edit, /mypage다.
/home은 검색 조건을 유지해 /로 연결하고, 없는 주소도 목록으로 보낸다. 로그인·회원가입 주소는 연결하지 않았다.

## 이후 백엔드 연결

화면은 features/items/api/itemRepository.js를 통해 데이터를 읽고 저장한다.
나중에 이 경계를 실제 물품·사진·내 물품 API와 연결하고, 계정·권한·연락처 규칙을 추가한다.
imageBlob은 이번 브라우저 저장 전용 값이고 실제 서버의 imageUrl 필드와 구분한다.
VITE_API_BASE_URL은 아직 사용하지 않는 자리다. 환경 변수만 넣어도 서버에 자동 연결되는 방식은 아니다.

- [이번 구현 범위와 검증 기록](docs/frontend-implementation.md)
- [최신 결정 기록](docs/decisions.md)
- [폴더·컴포넌트 전체 계획](docs/frontend-structure.md)
- [재사용 부품 목록](docs/reusable-components.md)

Notion·원본 디자인·백엔드는 수정하지 않았다. 일러스트 라이선스는 public/licenses/에 포함했다.
