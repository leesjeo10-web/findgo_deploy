# Render 배포 체크리스트 (Spring Boot + MySQL)

## 1. Render Web Service
- Repository: `leesjeo10-web/wine-finder`
- Branch: `main`
- Language: **Docker**
- Root Directory: `findgo-backend`
- Dockerfile Path: `./Dockerfile` (Root Directory 기준)
- Region: Singapore
- Compute: **Free ($0/month)** 를 직접 선택하고 최종 요금 표시를 확인하세요.
- Java 21 이미지를 사용하는 Dockerfile은 GitHub에 포함되어 있습니다.

## 2. MySQL
Render 컨테이너의 `localhost`는 사용자의 MacBook이 아닙니다.
Render에서 접근 가능한 외부 MySQL 호스트를 준비하고 네트워크 접근과 TLS 요구사항을 확인하세요.
필요한 DB와 사용자 권한을 생성한 후 다음 환경 변수를 Render의 **Environment** 화면에서 설정합니다.
실제 비밀번호를 GitHub, README, 스크린샷에 넣지 마세요.

| Key | Value |
| --- | --- |
| `DB_URL` | `jdbc:mysql://HOST:PORT/wine_finder` (호스팅 제공자의 TLS 요구사항 반영) |
| `DB_USERNAME` | DB 계정 |
| `DB_PASSWORD` | DB 비밀번호 |
| `FRONTEND_ORIGINS` | 프론트엔드 배포 origin, 예: `https://example.vercel.app` |
| `JWT_SECRET` | 32바이트 이상 무작위 문자열 (필수, 없으면 서버가 시작되지 않음) |
| `JWT_EXPIRES_SECONDS` | 토큰 유효 시간(초), 생략하면 3600 |
| `ADMIN_INITIAL_PASSWORD` | 첫 배포 때 admin 계정 비밀번호 (admin이 이미 있으면 무시) |
| `UPLOAD_DIR` | 사진 저장 폴더 (영구 디스크를 쓸 때 그 경로) |

`PORT`는 Render가 자동 제공하므로 별도로 설정할 필요가 없습니다.

## 3. 프론트 연결 주의
- API 기본 경로는 `/api`, Swagger는 `/swagger-ui/index.html`입니다.
- 로그인 응답의 `accessToken`을 `Authorization: Bearer {accessToken}` 헤더로 보냅니다. 쿠키를 쓰지 않으므로 Vercel과 Render처럼 서로 다른 사이트에서도 `FRONTEND_ORIGINS`만 맞으면 직접 호출할 수 있습니다.
- 사진 보기는 토큰 없이 되므로 `imageUrl` 앞에 백엔드 주소를 붙여 `<img src>`로 표시합니다. 자세한 내용은 [API.md](API.md)를 보세요.

## 4. 무료 플랜 주의
- Render Free 인스턴스는 유휴 시 중지되고 다시 시작할 때 지연될 수 있습니다.
- 무료 인스턴스의 로컬 디스크는 영구 저장소가 아닙니다. 현재 `UPLOAD_DIR`에 저장하는 사진은 재배포/재시작 시 유실될 수 있으므로 실제 운영 전 객체 스토리지로 옮겨야 합니다.
- DB가 외부 서비스라면 해당 서비스의 무료 제공 여부와 한도를 별도로 확인하세요.

## 5. 배포 확인
1. Render Logs에서 Docker 빌드와 Spring Boot 기동을 확인합니다.
2. `https://<your-render-host>/v3/api-docs` 또는 `/swagger-ui/index.html`에 접속합니다.
3. DB 접속 오류가 발생하면 `DB_URL`, 계정, TLS, 방화벽/허용 IP를 점검합니다.
4. Swagger에서 `admin` 계정으로 로그인해 토큰을 받고, 학생 추가·물품 API를 테스트합니다.
5. 첫 배포가 끝나 admin 계정이 생겼으면 `ADMIN_INITIAL_PASSWORD`는 지워도 됩니다.
