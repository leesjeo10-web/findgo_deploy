# Finder · 찾Go 통합 프론트

`frontend---b`에 물품·사진 API와 마이페이지 설정, A의 로그인·초기 설정·선생님 관리 화면을 통합했다. 실행할 프론트 프로젝트는 이 `frontend/` 하나다. 중복 `frontend-a/`와 이전 초안은 포함하지 않는다. 원본 `frontend---a` 브랜치는 변경하지 않았다.

## 실행

이 폴더에서 다음 명령을 실행한다.

```bash
npm ci
npm run dev
```

서버 기본 주소는 `http://localhost:8080`이다. 다른 서버는 `.env.local`의 `VITE_API_BASE_URL`에 `/api`를 제외한 주소를 지정한다. 운영 빌드에서는 서버 주소가 필수다. 프론트 접속 주소와 백엔드의 `FRONTEND_ORIGINS`가 같아야 한다. 예: `http://localhost:5173`.

배포 Root Directory는 `frontend`, Build Command는 `npm ci && npm run build`, Publish Directory는 `dist`다.

## 로그인 및 저장

- 학생은 4자리 학번, 선생님 아이디는 `0000`이다. 같은 로그인 화면을 사용하고 서버 `role`로 권한을 구분한다. 회원가입은 없다.
- 선생님 계정과 초기 비밀번호는 백엔드에서 준비한다. 브라우저에 테스트 계정을 자동 생성하지 않는다.
- A의 sessionStorage 기반 수명 범위를 유지하고, 서버 JWT만 `finder-access-token` 키에 보관한다. `AuthProvider`가 공통 API 요청의 토큰과 401 처리를 연결한다.
- 첫 로그인 비밀번호 변경 후 연락처를 설정한다. 선생님은 휴대전화와 교무실 번호가 필요하며 화면에서 관리자 비밀번호를 변경하지 않는다.
- 물품·사진·학생·계정 정보는 실제 API를 사용한다. 기존 로컬 IndexedDB 데이터는 서버로 자동 이관하거나 임의 삭제하지 않는다.
- 사진은 먼저 업로드하고 받은 imageUrl을 글에 첨부한다. 사진 조회는 공개 GET이며 업로드와 물품 API는 인증한다.
- 작성 중 보호 API가 401을 반환하면 입력 내용을 3시간 임시 저장한 뒤 로그아웃한다. 같은 계정으로 로그인한 후 목록의 이어쓰기 안내로 복원한다. 미연결 서버 사진은 백엔드가 6시간 뒤 정리한다.

## 검증

```bash
npm test
npm run build
```

최신 계약은 [API 명세](docs/api-spec.md), 통합 내역은 [프론트 구조안 마지막 절](docs/frontend-structure.md)을 참고한다. 실제 운영 서버의 계정·배포 주소·CORS 설정은 팀에서 확인해야 한다.
