# API 명세서

> **📖 작성 가이드**
>
> **이 문서의 목적**
>
> 프론트엔드와 백엔드가 데이터를 주고받을 때 사용할 요청과 응답을 같은 기준으로 정의합니다.

---

## 공통 규칙

- 모든 API는 `/api` 아래에 둡니다.
- 접근 조건이 **토큰 필요**인 API는 요청 헤더에 `Authorization: Bearer {accessToken}`을 넣습니다. `accessToken`은 로그인 응답으로 받은 JWT 토큰입니다. 쿠키와 CSRF 토큰은 쓰지 않습니다.
- 토큰이 없거나 만료되면 401로 응답합니다. 단, 물품 상세는 토큰 없이도 조회할 수 있고 작성자 연락처(`userPhone`)만 `null`로 보냅니다.

---

## 1. API가 필요한 행동 찾기

- **화면 안에서만 바뀌는 상태**
  - **로그아웃:** 저장된 토큰과 사용자 정보 삭제 → 물품 목록으로 이동
  - **입력 검사:** 입력 중인 폼 값, 칸별 1차 검사, 비밀번호 확인 칸 일치 검사
  - **보관 장소 칸:** 구분이 습득물일 때만 보여 줌. 분실물이면 숨기고 값을 비움
  - **표시 상태:** 사진 미리보기, 로딩 표시, 버튼, 값이 없는 선택 항목 숨기기, 사진이 없을 때 기본 이미지, 비회원에게 연락처 대신 로그인 안내
  - **화면 전환:** 삭제 확인창, 취소, 뒤로 가기
  - **목록 조건:** 검색창에 입력 중인 글자, 주소에 담아 두는 검색 조건
  - **로그인 만료 시 보관:** 작성 중 입력값, 돌아올 주소
- **서버에 보관해야 하는 데이터**
  - **저장**
    - **회원가입** — 이메일, 이름, 비밀번호, 전화번호(선택)
    - **사진 올리기** — 사진 파일을 보내고 사진 경로를 받음
    - **물품 등록** — 구분, 이름, 설명, 장소, 날짜, 보관 장소(습득물일 때 필수), 사진 경로(선택)
  - **조회**
    - **로그인** — 이메일, 비밀번호를 보내고 토큰과 사용자 정보를 받음
    - **로그인 확인** — 새로고침 후 토큰으로 내 정보 조회
    - **물품 목록·검색** — 검색어, 구분, 상태, 정렬(등록 일시 기준), 페이지
    - **물품 상세** — 물품 id. 토큰이 있으면 작성자 연락처도 받음
    - **마이페이지** — 토큰, 구분·상태(선택)
  - **수정**
    - **물품 수정·상태 변경** — 물품 id, 등록 항목 전체, 상태. '해결 완료'도 이 API로 status를 바꿔 저장합니다.
  - **삭제**
    - **물품 삭제** — 물품 id
- **API가 없는 행동**
  - **소유 확인·물건 전달** — 보관 장소에서 직접 하거나 작성자에게 연락해서 하므로 서버에 기록하지 않습니다.
  - **올리기만 한 사진 정리** — 글에 연결되지 않은 사진은 서버가 3시간 뒤 자동으로 지웁니다.
  - **채팅, 물품 종류** — 후속 기능이라 첫 버전 API에 넣지 않습니다.

---

## 2. API마다 정할 항목

| API | Method | 경로 | 설명 | 접근 조건 | 요청 형식 | 요청 데이터 | 성공 응답 | 실패 응답 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 회원가입 | POST | /api/auth/signup | 새 계정 만들기 | 누구나 | JSON | **필수** email, name, password<br>**선택** phone | **HTTP_201_created**<br>{"id": 1, "name": "테스트 학생", "email": "student@example.com", "phone": "010-1234-5678"} | **HTTP_400_bad_request**<br>{"message": "입력값을 확인해 주세요.", "errors": ["email: 이메일 형식이 올바르지 않습니다."]}<br>**HTTP_409_conflict**<br>{"message": "이미 가입된 이메일입니다. 로그인해주세요."} |
| 로그인 | POST | /api/auth/login | 토큰과 사용자 정보 발급 | 누구나 | JSON | **필수** email, password | **HTTP_200_ok**<br>{"accessToken": "eyJhbGciOiJIUzI1NiJ9...", "tokenType": "Bearer", "expiresIn": 3600, "user": {"id": 1, "name": "테스트 학생", "email": "student@example.com"}} | **HTTP_401_unauthorized**<br>{"message": "이메일 또는 비밀번호가 올바르지 않습니다. 다시 입력해주세요."} |
| 내 정보 | GET | /api/auth/me | 토큰으로 회원 조회 | 토큰 필요 | X | X | **HTTP_200_ok**<br>{"id": 1, "name": "테스트 학생", "email": "student@example.com", "phone": null} | **HTTP_401_unauthorized**<br>토큰 없음: {"message": "로그인이 필요한 기능입니다."}<br>토큰 만료: {"message": "로그인이 만료되었습니다. 다시 로그인해주세요."} |
| 물품 목록 | GET | /api/items | 검색·필터·페이지 조회 | 누구나 | 쿼리 파라미터 | **선택** keyword, type, status, sort, page, size | **HTTP_200_ok**<br>{"content": [{"id": 1, "userId": 1, "type": "FOUND", "name": "검정 우산", "description": "손잡이에 파란 스티커가 있습니다.", "status": "OPEN", "location": "도서관", "storageLocation": "학생회실", "imageUrl": null, "lostFoundAt": "2026-10-01", "createdAt": "2026-10-01T09:00:00"}],<br>"page": 0, "size": 20, "totalElements": 1, "totalPages": 1, "first": true, "last": true} | **HTTP_400_bad_request**<br>{"message": "검색어는 100자 이하로 입력하세요."} |
| 물품 상세 | GET | /api/items/{id} | 물품 1건 조회 | 누구나 (연락처는 토큰 필요) | 경로 변수 | **필수** id<br>**선택** Authorization 헤더 (연락처를 받을 때) | **HTTP_200_ok**<br>{"id": 1, "userId": 1, "userName": "테스트 학생", "userPhone": "010-1234-5678", "type": "FOUND", "name": "검정 우산", "description": "손잡이에 파란 스티커가 있습니다.", "status": "OPEN", "location": "도서관", "storageLocation": "학생회실", "imageUrl": "/api/images/123e4567-e89b-12d3-a456-426614174000.jpg", "lostFoundAt": "2026-10-01", "createdAt": "2026-10-01T09:00:00"}<br>토큰 없음: "userPhone": null | **HTTP_404_not_found**<br>{"message": "해당 물품을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다."} |
| 내 물품 목록 | GET | /api/me/items | 마이페이지 내 물품·개수 | 토큰 필요 | 쿼리 파라미터 | **선택** type, status, page, size | **HTTP_200_ok**<br>{"content": [{"id": 1, "userId": 1, "type": "FOUND", "name": "검정 우산", "description": "손잡이에 파란 스티커가 있습니다.", "status": "OPEN", "location": "도서관", "storageLocation": "학생회실", "imageUrl": null, "lostFoundAt": "2026-10-01", "createdAt": "2026-10-01T09:00:00"}], "page": 0, "size": 20, "totalElements": 1, "totalPages": 1, "first": true, "last": true} | **HTTP_401_unauthorized**<br>토큰 없음: {"message": "로그인이 필요한 기능입니다."}<br>토큰 만료: {"message": "로그인이 만료되었습니다. 다시 로그인해주세요."} |
| 사진 업로드 | POST | /api/images | 사진 저장 후 경로 반환 | 토큰 필요 | multipart/form-data | **필수** file | **HTTP_201_created**<br>{"imageUrl": "/api/images/123e4567-e89b-12d3-a456-426614174000.jpg"} | **HTTP_400_bad_request**<br>{"message": "사진을 처리하지 못했습니다. 다른 사진을 선택해주세요."}<br>**HTTP_401_unauthorized**<br>토큰 없음: {"message": "로그인이 필요한 기능입니다."}<br>토큰 만료: {"message": "로그인이 만료되었습니다. 다시 로그인해주세요."}<br>**HTTP_413_payload_too_large**<br>{"message": "JPG/PNG, 5MB 이하 사진만 올릴 수 있습니다. 다른 사진을 선택해주세요."} |
| 물품 등록 | POST | /api/items | 분실물·습득물 등록 | 토큰 필요 | JSON | **필수** type, name, description, location, lostFoundAt<br>**습득물(FOUND)일 때 필수** storageLocation<br>**선택** imageUrl | **HTTP_201_created**<br>{"id": 1, "userId": 1, "type": "FOUND", "name": "검정 우산", "description": "손잡이에 파란 스티커가 있습니다.", "status": "OPEN", "location": "도서관", "storageLocation": "학생회실", "imageUrl": "/api/images/123e4567-e89b-12d3-a456-426614174000.jpg", "lostFoundAt": "2026-10-01", "createdAt": "2026-10-01T09:00:00"} | **HTTP_400_bad_request**<br>미입력: {"message": "이름을 입력해주세요."}<br>보관 장소 미입력(습득물): {"message": "보관 장소를 입력해주세요."}<br>글자 수 초과: {"message": "이름·장소는 100자, 설명은 2000자 이하로 입력하세요."}<br>**HTTP_401_unauthorized**<br>토큰 없음: {"message": "로그인이 필요한 기능입니다."}<br>토큰 만료: {"message": "로그인이 만료되었습니다. 다시 로그인해주세요."} |
| 물품 수정 | PUT | /api/items/{id} | 물품 전체 수정·상태 변경 | 토큰 필요, 작성자만 | 경로 변수 + JSON | **필수** id, type, name, description, status, location, lostFoundAt<br>**습득물(FOUND)일 때 필수** storageLocation<br>**선택** imageUrl | **HTTP_200_ok**<br>{"id": 1, "userId": 1, "type": "FOUND", "name": "검정 우산", "description": "손잡이에 파란 스티커가 있습니다.", "status": "RESOLVED", "location": "도서관", "storageLocation": "학생회실", "imageUrl": "/api/images/123e4567-e89b-12d3-a456-426614174000.jpg", "lostFoundAt": "2026-10-01", "createdAt": "2026-10-01T09:00:00"} | **HTTP_400_bad_request**<br>미입력: {"message": "이름을 입력해주세요."}<br>보관 장소 미입력(습득물): {"message": "보관 장소를 입력해주세요."}<br>글자 수 초과: {"message": "이름·장소는 100자, 설명은 2000자 이하로 입력하세요."}<br>**HTTP_401_unauthorized**<br>토큰 없음: {"message": "로그인이 필요한 기능입니다."}<br>토큰 만료: {"message": "로그인이 만료되었습니다. 다시 로그인해주세요."}<br>**HTTP_403_forbidden**<br>{"message": "본인이 등록한 물품만 수정·삭제할 수 있습니다."}<br>**HTTP_404_not_found**<br>{"message": "해당 물품을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다."} |
| 물품 삭제 | DELETE | /api/items/{id} | 물품 삭제 | 토큰 필요, 작성자만 | 경로 변수 | **필수** id | **HTTP_204_no_content** | **HTTP_401_unauthorized**<br>토큰 없음: {"message": "로그인이 필요한 기능입니다."}<br>토큰 만료: {"message": "로그인이 만료되었습니다. 다시 로그인해주세요."}<br>**HTTP_403_forbidden**<br>{"message": "본인이 등록한 물품만 수정·삭제할 수 있습니다."}<br>**HTTP_404_not_found**<br>{"message": "해당 물품을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다."} |

**요청·응답 데이터 참고**

- `sort` : 등록 일시(`createdAt`) 기준으로 정렬합니다. 기본은 최신순이고, 오래된 순을 고를 수 있습니다. 분실·습득 날짜(`lostFoundAt`)는 정렬에 쓰지 않습니다. 미해결 물품만 보려면 `status=OPEN`을 씁니다.
- `storageLocation` : 습득물(`FOUND`)일 때만 화면에서 입력받고 필수입니다. 백엔드도 습득물일 때만 필수로 검사합니다. 분실물(`LOST`)이면 보내지 않습니다.
- `phone` : 입력했다면 `010-0000-0000` 형식입니다.
- `userName`, `userPhone` : 물품 상세에만 있는 작성자 이름과 연락처(작성자의 전화번호)입니다. 토큰 없이 조회하면 `userPhone`은 `null`입니다. 작성자가 전화번호를 입력하지 않았으면 토큰이 있어도 `null`입니다.
- 물품 삭제나 사진 변경(`imageUrl`을 바꾸거나 비움) 시 예전 사진 파일은 백엔드가 지웁니다.

---

## 3. 화면과 맞춰 확인하기

응답을 기다리는 동안 어떤 로딩 상태를 보여줄지, 결과가 비어 있을 때 어떻게 표시할지, 요청이 실패하면 입력값을 유지할지 정합니다.

API의 필드 이름은 **ERD의 데이터 이름**과 비교합니다. 서로 다른 이름이 같은 뜻으로 사용되고 있다면 하나의 기준으로 맞춥니다.

### 로딩과 빈 결과

- **로딩** — 조회 중일 때 표시
- **빈 결과**
  - 목록: "아직 등록된 물품이 없습니다. 첫 물품을 등록해 보세요."
  - 검색: "검색 결과가 없습니다. 다른 검색어로 찾아보거나 분실물로 등록해 두세요."
  - 마이페이지: "아직 등록한 물품이 없습니다."
- **더 보기** — `last`가 true면 버튼을 숨김
- **값이 없는 칸** — `storageLocation`, `phone`, `userPhone`이 `null`이면 칸을 표시하지 않음. 비회원에게는 연락처 자리에 "로그인하면 작성자 연락처를 볼 수 있습니다."를 표시. `imageUrl`이 `null`이면 기본 이미지

### 요청 실패

| 응답 | 상황 | 입력값 | 이후 |
| --- | --- | --- | --- |
| 400 | 입력 오류, 검색어 초과, 사진 처리 실패 | 유지 | 고친 뒤 다시 요청 |
| 401 | 로그인 실패 | 이메일 유지, 비밀번호 비움 | 다시 입력 |
| 401 | 토큰 없음 | — | 로그인 화면 → 로그인 후 원래 화면으로 이동 |
| 401 | 토큰 만료 | 작성 중 입력값 임시 보관 | 토큰 삭제 → 로그인 화면 → 로그인 후 원래 화면에서 입력값 복원 |
| 403 | 작성자가 아님 | 바뀐 것 없음 | 상세 화면 |
| 404 | 물품 없음 | — | 목록 화면 |
| 409 | 이미 가입된 이메일 | 유지 | 이메일이 채워진 로그인 화면 |
| 413 | 사진 형식·용량 초과 | 사진만 비우고 나머지 유지 | 다른 사진 선택 |

### ERD ↔ API 필드명

동일 : id, type, name, description, status, location, email, phone

| ERD (DB) | API |
| --- | --- |
| user_id | userId |
| storage_location | storageLocation |
| image_url | imageUrl |
| lost_found_at | lostFoundAt |
| created_at | createdAt |
| members.name (작성자) | userName (물품 상세) |
| members.phone (작성자) | userPhone (물품 상세, 토큰 없으면 null) |

### ✅ 작성 완료 확인

- [x] 핵심 사용자 행동에 필요한 API가 있습니다.
- [x] 요청·성공·실패의 데이터 형식이 구분됩니다.
- [x] 화면 상태와 API 응답이 연결됩니다.
