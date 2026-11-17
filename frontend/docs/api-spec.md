> 동기화 기준: webisnoteasy/finder backend-jwt b00af01, docs/API.md (2026-11-14 확인). 아래는 해당 원문이며 B의 구현 범위와 연결 주의사항은 프론트 구조안 마지막 절 참고. 원문 예시 8081과 사용자 전달 주소 8080의 차이는 환경변수로 설정한다.

# 찾GO API

기본 경로는 `/api`입니다. JSON 요청에는 `Content-Type: application/json`을 씁니다.
자세한 필드 설명과 예시는 Swagger(`/swagger-ui/index.html`)에 있습니다.

## 인증

- `POST /api/auth/login`과 사진 보기(`GET /api/images/{filename}`)를 뺀 **모든 API**에 `Authorization: Bearer {accessToken}` 헤더가 필요합니다.
- 세션·쿠키·CSRF는 쓰지 않습니다. 로그아웃 API는 없고 프론트가 저장한 토큰을 지우면 됩니다.
- 토큰 유효 시간은 `expiresIn`초(기본 3600)입니다.
- `mustChangePassword`가 true면 프론트가 비밀번호 변경 화면으로 보냅니다. `phone`이 null이면 전화번호 입력 화면으로 보냅니다. 서버는 이 상태에서도 다른 API를 막지 않습니다.

| 상황 | 응답 |
| --- | --- |
| 토큰 없음·잘못된 토큰·삭제된 회원 | 401 `{"message": "로그인이 필요한 기능입니다."}` |
| 토큰 만료 | 401 `{"message": "로그인이 만료되었습니다. 다시 로그인해주세요."}` |
| 학생이 `/api/admin/**` 호출 | 403 `{"message": "관리자만 사용할 수 있는 기능입니다."}` |

**글 작성 중 토큰이 만료되면(프론트엔드 처리)**: 등록·수정 화면에서 401 만료 응답을 받으면 입력 중인 내용을 브라우저(localStorage)에 저장하고 로그아웃한 뒤 로그인 화면으로 보냅니다. 다시 로그인하면 저장한 내용을 불러옵니다. 저장 내용은 **3시간** 동안만 유지하고 지난 것은 버립니다.
- 업로드만 하고 물품에 연결하지 않은 사진은 업로드 6시간 뒤 서버에서 지워집니다. 임시 저장(3시간)보다 길어서 불러온 사진도 그대로 쓸 수 있습니다.

## 오류 형식

모든 오류는 `{"message": "..."}` 형식입니다. 로그인 요청의 빈 칸 오류만 아래 형식입니다.

```json
{"message": "입력값을 확인해 주세요.", "errors": ["loginId: 아이디를 입력해주세요."]}
```

## API 목록

| API | Method | 경로 | 접근 | 성공 |
| --- | --- | --- | --- | --- |
| 로그인 | POST | `/api/auth/login` | 누구나 | 200 `{accessToken, tokenType, expiresIn, user}` |
| 내 정보 | GET | `/api/auth/me` | 토큰 | 200 `{id, loginId, name, phone, officePhone, role, mustChangePassword}` |
| 비밀번호 변경 | PATCH | `/api/auth/me/password` | 토큰(학생) | 204 |
| 연락처 변경 | PATCH | `/api/auth/me` | 토큰 | 200 내 정보 |
| 물품 목록·검색 | GET | `/api/items` | 토큰 | 200 페이지 |
| 물품 상세 | GET | `/api/items/{id}` | 토큰 | 200 물품 + `userName, userPhone, userOfficePhone` |
| 내 물품 목록 | GET | `/api/me/items` | 토큰 | 200 페이지 |
| 비슷한 물품 추천 | GET | `/api/items/similar` | 토큰 | 200 물품 최대 3건 |
| 사진 업로드 | POST | `/api/images` | 토큰 | 201 `{imageUrl}` |
| 사진 보기 | GET | `/api/images/{filename}` | 누구나 | 200 JPEG |
| 물품 등록 | POST | `/api/items` | 토큰 | 201 물품 |
| 물품 수정 | PUT | `/api/items/{id}` | 작성자 | 200 물품 |
| 해결 상태 변경 | PATCH | `/api/items/{id}/status` | 작성자 | 200 물품 |
| 물품 삭제 | DELETE | `/api/items/{id}` | 작성자·관리자 | 204 |
| 학생 목록 | GET | `/api/admin/members` | 관리자 | 200 `[{id, loginId, name}]` |
| 학생 추가 | POST | `/api/admin/members` | 관리자 | 201 `{id, loginId, name}` |
| 비밀번호 초기화 | PATCH | `/api/admin/members/{id}/password` | 관리자 | 204 |
| 학생 삭제 | DELETE | `/api/admin/members/{id}` | 관리자 | 204 |

### 로그인·내 정보

- 로그인 `{loginId, password}`
  - 학생 아이디는 숫자 4자리, 관리자는 `0000`입니다. 학생과 관리자는 같은 로그인 화면을 쓰고 응답의 `user.role`(`STUDENT`/`ADMIN`)로 구분합니다.
  - 틀리면 401 "아이디 또는 비밀번호가 올바르지 않습니다. 다시 입력해주세요."입니다. 어느 쪽이 틀렸는지는 알려 주지 않습니다.
- 비밀번호 변경 `{currentPassword, newPassword}`
  - 성공하면 `mustChangePassword`가 false가 됩니다.
  - 400 "비밀번호는 8~64자로 입력해주세요." / 400 "현재 비밀번호가 올바르지 않습니다." / 관리자 계정은 403 "관리자 계정의 비밀번호는 화면에서 변경할 수 없습니다."
- 연락처 변경 `{phone, officePhone}`
  - `phone`은 필수이며 지울 수 없습니다. 비우면 400 "전화번호를 입력해주세요."입니다.
  - 관리자는 `officePhone`(교무실 번호, 예: `02-123-4567`)도 필수입니다. 학생이 보낸 `officePhone`은 무시합니다.
  - 형식이 틀리면 400 "전화번호 형식을 확인해 주세요." / "교무실 번호 형식을 확인해 주세요."입니다.

### 물품

물품 JSON 필드는 `id, userId, type(LOST/FOUND), itemCategory, name, description, status(OPEN/RESOLVED), location, storageLocation, imageUrl, lostFoundAt(YYYY-MM-DD), createdAt(YYYY-MM-DDTHH:mm:ss)`입니다.
상세에만 `userName`, `userPhone`, `userOfficePhone`(관리자 글만, 학생 글은 null)이 추가됩니다.

- **목록 쿼리**: `keyword`(100자 이하), `type`, `status`, `itemCategory`, `sort`(`latest` 기본/`oldest`), `page`(0부터), `size`(1~100, 기본 20)
  - 등록 일시(`createdAt`) 순으로 정렬하고, 같은 시각이면 id 순입니다.
  - 응답은 `{content, page, size, totalElements, totalPages, first, last}`입니다.
- **등록·수정**
  - 필수: `type, name, description, location, lostFoundAt`. 습득물(FOUND)은 `storageLocation`도 필수입니다.
  - 선택: `storageLocation`(분실물), `imageUrl`, `itemCategory`
  - `itemCategory`(물품 종류)는 `전자기기`, `지갑/카드`, `의류`, `가방`, `필기구`, `기타` 중 하나이거나 비워 둡니다. 다른 값은 400 "물품 종류를 확인해주세요."입니다. 목록에서 같은 값으로 거를 수 있습니다.
  - 수정은 `status`도 필수이고, 선택 항목을 비우면 기존 값도 지웁니다.
  - 분실물(LOST)은 `storageLocation`을 보내도 null로 저장합니다.
  - 글자 수는 앞뒤 공백을 지운 뒤 셉니다. 이름·장소·보관 장소는 100자, 설명은 2000자까지입니다.
  - 오늘(Asia/Seoul) 이후 날짜는 400입니다.
- **주요 오류**
  - 미입력은 "이름을 입력해주세요."처럼 항목별 문구입니다. 습득물 보관 장소를 비우면 "보관 장소를 입력해주세요."입니다.
  - 403 "본인이 등록한 물품만 수정·삭제할 수 있습니다."
  - 404 "해당 물품을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다."

### 사진

1. `POST /api/images`에 multipart `file`(JPG/PNG, 5MB 이하)로 올립니다. 응답의 `imageUrl`을 물품 등록·수정의 `imageUrl`에 넣습니다.
2. 본인이 올린 사진만 첨부할 수 있습니다. 다른 학생의 사진이면 400입니다.
3. 6시간 안에 물품에 연결하지 않으면 사진이 자동으로 지워집니다.

| 오류 | 응답 |
| --- | --- |
| 5MB 초과 | 413 "JPG/PNG, 5MB 이하 사진만 올릴 수 있습니다. 다른 사진을 선택해주세요." |
| GIF 등 다른 형식 | 400 (같은 문구) |
| 사진이 아니거나 읽을 수 없음 | 400 "사진을 처리하지 못했습니다. 다른 사진을 선택해주세요." |

### 관리자

- 학생 추가 `{loginId, name, phone(선택), password}`
  - 400 "아이디는 숫자 4자리로 입력해주세요." / 409 "이미 등록된 아이디입니다."
  - 추가된 학생은 `mustChangePassword=true`입니다.
- 비밀번호 초기화 `{password}`(8~64자): 학생은 `mustChangePassword=true`가 됩니다. 대상이 관리자면 403입니다.
- 학생 삭제: 그 학생의 물품·사진도 함께 지웁니다. 대상이 관리자면 403 "관리자 계정은 삭제할 수 없습니다."입니다.
- 없는 회원은 404 "해당 학생을 찾을 수 없습니다."입니다.

## 프론트엔드 연결 예시

```js
const API = 'http://localhost:8081/api';

async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem('accessToken'); // 만료 또는 로그인 필요 → 로그인 화면으로
  }
  if (!res.ok) throw new Error((await res.json()).message);
  return res.status === 204 ? null : res.json();
}

// 로그인
const { accessToken, user } = await api('/auth/login', { method: 'POST', body: { loginId: '1109', password: '...' } });
localStorage.setItem('accessToken', accessToken);
```

사진은 `imageUrl`을 `<img src>`에 그대로 넣으면 됩니다. 사진 보기는 토큰이 필요 없습니다(파일 이름은 무작위 UUID). 사진 올리기(`POST /api/images`)는 토큰이 필요합니다.

```jsx
<img src={`http://localhost:8081${item.imageUrl}`} alt={item.name} />
```
