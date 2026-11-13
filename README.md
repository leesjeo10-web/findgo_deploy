# 찾GO 백엔드

교내 분실물·습득물 서비스 찾GO의 Spring Boot 백엔드입니다.
Java 21, Spring Boot 4.1.1, Spring Security(JWT Bearer, HS256), Spring Data JPA, springdoc(Swagger)를 사용합니다.
DB는 운영 MySQL, 로컬·테스트는 H2입니다.

## 구현 범위

- **로그인**: 아이디·비밀번호로 로그인하면 JWT `accessToken`을 줍니다. 세션·CSRF·회원가입·로그아웃 API는 없습니다(로그아웃은 프론트가 토큰을 지움).
- **계정**
  - 학생: 아이디는 숫자 4자리 학번(예: `1109` = 1학년 1반 9번)
  - 선생님(관리자): 아이디 `admin`
  - 앱이 시작될 때 admin 계정이 없으면 만들고, CSV로 학생을 일괄 등록할 수 있습니다.
- **내 정보**
  - 비밀번호 변경(현재 비밀번호 확인)과 전화번호 변경을 할 수 있습니다. 전화번호는 지울 수 없고 바꾸기만 합니다.
  - 관리자는 휴대전화와 교무실 번호를 함께 등록합니다.
- **물품**
  - 등록·검색·목록·상세·수정·해결 상태 변경·삭제를 할 수 있습니다.
  - 수정·상태 변경은 작성자만, 삭제는 작성자 또는 관리자가 할 수 있습니다.
  - 상세에는 작성자 이름과 연락처가 나옵니다.
- **사진**
  - 물품당 1장, JPG/PNG 5MB 이하를 받아 JPEG로 다시 저장합니다. 올리기는 토큰이 필요하고, 보기(`<img src>`)는 토큰 없이 됩니다.
  - 물품을 삭제하거나 사진을 바꾸거나 비우면 예전 사진을 지웁니다. 어떤 물품에도 연결되지 않은 사진은 3시간 뒤 자동으로 지웁니다.
- **관리자**: 학생 목록·추가·비밀번호 초기화·삭제를 할 수 있습니다. 학생을 삭제하면 그 학생의 물품·사진도 함께 지웁니다.

API 전체 목록과 프론트엔드 연결 방법은 [docs/API.md](docs/API.md)와 Swagger를 보세요.

## 실행

1. Java 21을 준비합니다. MySQL 없이도 내장 H2 DB로 바로 실행됩니다.
2. `.env.example`을 `.env`로 복사하고 값을 채웁니다. 서버가 프로젝트 루트의 `.env`를 자동으로 읽습니다(git 제외).
   - `JWT_SECRET`은 **필수**입니다. 없거나 32바이트보다 짧으면 서버가 시작되지 않습니다.
   - 처음 실행할 때 `ADMIN_INITIAL_PASSWORD`를 넣으면 admin 계정이 만들어집니다.
3. 서버를 실행합니다.

```bash
./gradlew bootRun
```

- API: `http://localhost:8081/api`
- Swagger 화면: `http://localhost:8081/swagger-ui/index.html` (오른쪽 위 **Authorize**에 로그인으로 받은 `accessToken`을 넣으면 다른 API를 바로 호출할 수 있습니다)
- OpenAPI 문서: `http://localhost:8081/v3/api-docs`
- 테이블은 JPA `ddl-auto=update`로 만들고 고칩니다.

### 환경 변수

| 환경 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `JWT_SECRET` | JWT 서명 비밀키. 32바이트 이상 무작위 문자열 | **필수** |
| `JWT_EXPIRES_SECONDS` | 토큰 유효 시간(초) | `3600` |
| `ADMIN_INITIAL_PASSWORD` | admin 계정이 없을 때 만들 첫 비밀번호. 비우면 만들지 않고 경고 로그만 남김 | 빈 값 |
| `STUDENTS_CSV` | 학생 일괄 등록 CSV 경로. 비우면 아무것도 하지 않음 | 빈 값 |
| `DB_URL` | JDBC 주소 | 내장 H2 `./data/wine_finder` |
| `DB_USERNAME` | DB 사용자 | `sa` (H2) |
| `DB_PASSWORD` | DB 비밀번호 | 빈 값 (H2) |
| `PORT` | 서버 포트 | `8081` |
| `FRONTEND_ORIGINS` | 허용할 프론트 origin. 여러 개면 쉼표 구분 | `http://localhost:5173` |
| `UPLOAD_DIR` | 사진 저장 폴더 | `./uploads` |

### `.env` 예시

```properties
# 필수: openssl rand -base64 48 로 만든 값 등
JWT_SECRET=여기에_32바이트_이상_무작위_문자열
JWT_EXPIRES_SECONDS=3600

# 처음 실행할 때만 필요(admin 계정이 이미 있으면 무시)
ADMIN_INITIAL_PASSWORD=여기에_관리자_첫_비밀번호

# 학생 일괄 등록(선택)
STUDENTS_CSV=./students.csv

# MySQL을 쓸 때만
# DB_URL=jdbc:mysql://localhost:3306/wine_finder?createDatabaseIfNotExist=true&serverTimezone=Asia/Seoul
# DB_USERNAME=root
# DB_PASSWORD=여기에_MySQL_비밀번호
```

실제 비밀키·비밀번호는 `.env`에만 두고 GitHub, README, 스크린샷에 넣지 마세요.

### 학생 CSV 일괄 등록

`STUDENTS_CSV`에 경로를 넣으면 앱이 시작될 때 읽어 **아직 없는 아이디만** 학생으로 추가합니다.

```csv
loginId,name,phone,initialPassword
1109,김민수,010-1234-5678,초기비밀번호1
1110,이영희,,초기비밀번호2
```

- 첫 줄 제목은 있어도 되고 없어도 됩니다. UTF-8(엑셀 BOM 포함)로 저장합니다.
- `loginId`는 숫자 4자리입니다. `phone`은 비워도 되고, 비우면 학생이 첫 로그인 때 입력합니다. 비밀번호는 8~64자이며 쉼표를 넣어도 됩니다.
- 형식이 맞지 않는 줄은 건너뛰고 경고 로그를 남깁니다. 로그에 비밀번호는 남기지 않습니다.
- 추가된 학생은 첫 로그인 후 비밀번호를 바꿔야 합니다(`mustChangePassword=true`).
- CSV에는 초기 비밀번호가 들어 있으니 git에 올리지 마세요(`students*.csv`는 `.gitignore`에 있음).

## 테스트·빌드

```bash
./gradlew build
```

테스트는 `test` 프로필의 H2 DB와 임시 사진 폴더를 쓰므로 실제 MySQL 데이터에 접근하지 않습니다.
로그인·토큰 만료, 권한(학생·관리자·작성자), 검증 문구, 검색·정렬, 사진 처리·정리, 관리자 API, CORS, Swagger 문서를 확인합니다.

## 기존 MySQL DB 정리

예전 설계(이메일 회원가입·세션)로 만든 DB를 그대로 쓰면 `ddl-auto=update`가 컬럼을 추가만 하고 지우거나 NOT NULL로 바꾸지는 않습니다.
그래서 예전 `members.email` NOT NULL 컬럼 때문에 저장이 실패할 수 있습니다.
예전 계정은 새 로그인 방식(4자리 학번)으로 쓸 수 없으므로 **테이블을 지우고 다시 만드는 방법**을 권장합니다.

```sql
-- 백업 후 실행하세요. 앱을 다시 시작하면 테이블이 새로 만들어지고 admin 계정이 생깁니다.
DROP TABLE IF EXISTS item_image;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS members;
```

물품 데이터를 남겨야 한다면 아래처럼 정리합니다. 작성자가 없는 물품은 새 설계에서 둘 수 없습니다.

```sql
ALTER TABLE members DROP COLUMN email;
ALTER TABLE members DROP COLUMN student_id;   -- 있을 때만
DELETE FROM items WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM members);
ALTER TABLE items MODIFY user_id BIGINT NOT NULL;
```

그다음 예전 회원에게는 `login_id`(4자리 학번)와 `role`을 직접 채워야 합니다.
로컬 H2는 `./data` 폴더를 지우면 새로 만들어집니다.

## 운영 시 알아 둘 점

- 4자리 학번은 해마다 새 학생과 겹칠 수 있습니다. 아이디는 바꿀 수 없고 중복될 수 없습니다. 다음 해에 같은 학번을 쓰려면 관리자가 기존 계정을 먼저 삭제해야 하고, 그 학생의 게시물·사진도 함께 지워집니다.
- 관리자 비밀번호는 화면(API)에서 바꾸거나 초기화할 수 없습니다. DB에서 직접 바꿉니다.
- 비밀번호를 바꾸거나 초기화해도 이미 발급된 토큰은 만료될 때까지 쓸 수 있습니다.
- 사진은 `UPLOAD_DIR` 디스크에 저장됩니다. 재배포 때 디스크가 지워지는 환경이라면 영구 저장 폴더를 지정하세요.
- 배포는 [docs/RENDER_DEPLOY.md](docs/RENDER_DEPLOY.md)를 참고하세요.
