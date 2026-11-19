# Render 배포 체크리스트 (Spring Boot + Neon Postgres + 프론트)

## 0. DB 준비 (Neon)
1. neon.tech 가입 → 프로젝트 생성 (Region: AWS Asia Pacific, Singapore 권장)
2. Connect → 언어/형식에서 **Java (JDBC)** 선택
3. `jdbc:postgresql://...` 주소, User, Password를 메모 (GitHub·채팅·스크린샷에 올리지 않기)
   - JDBC 주소에 `?sslmode=require`가 붙어 있어야 합니다.
   - 주소 안에 user/password가 들어 있다면 빼고, `DB_USERNAME`·`DB_PASSWORD`로 따로 넣습니다.

## 1. 백엔드: Render Web Service
- Repository: `webisnoteasy/finder`, Branch: `main`
- Language: **Docker**
- Root Directory: 비움 (저장소 맨 위에 `Dockerfile`이 있음)
- Region: Singapore, Instance: **Free**

Environment 화면에 넣을 값:

| Key | Value |
| --- | --- |
| `DB_URL` | Neon의 `jdbc:postgresql://...?sslmode=require` |
| `DB_USERNAME` | Neon User |
| `DB_PASSWORD` | Neon Password |
| `JWT_SECRET` | Render의 **Generate** 버튼으로 만든 무작위 값 (32바이트 이상, 필수) |
| `ADMIN_INITIAL_PASSWORD` | 관리자(0000) 첫 비밀번호, 8자 이상 |
| `FRONTEND_ORIGINS` | 프론트 배포 주소 (3단계 후 입력, 끝에 `/` 없이) |

`PORT`는 Render가 자동으로 넣어 주므로 설정하지 않습니다.
배포 후 `https://<백엔드주소>/swagger-ui/index.html`이 열리면 성공입니다.

## 2. 프론트: Render Static Site
- Repository: `webisnoteasy/finder`, Branch: `main`
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment: `VITE_API_BASE_URL` = 백엔드 주소 (`/api` 없이, 끝에 `/` 없이)
- Redirects/Rewrites: Source `/*` → Destination `/index.html`, Action **Rewrite**

`VITE_API_BASE_URL`은 빌드할 때 들어가므로, 값을 바꾸면 프론트를 다시 배포해야 합니다.

## 3. 서로 연결
1. 프론트 주소(`https://...onrender.com`)를 백엔드 `FRONTEND_ORIGINS`에 넣고 저장 → 백엔드가 다시 배포됩니다.
2. 프론트 주소로 접속 → `0000` / `ADMIN_INITIAL_PASSWORD`로 로그인 → 연락처 입력 → 학생 추가.
3. 관리자 계정이 생겼으면 `ADMIN_INITIAL_PASSWORD`는 지워도 됩니다.

## 4. 무료 플랜 주의
- Render Free 서버는 15분 동안 요청이 없으면 잠들고, 첫 요청 때 깨어나는 데 시간이 걸립니다.
- Render Free 서버의 디스크는 잠들거나 재배포될 때 지워집니다. 계정·글은 Neon에 남지만, `UPLOAD_DIR`에 저장한 **사진은 사라질 수 있습니다.** 오래 보관하려면 객체 저장소로 옮겨야 합니다.
- 학생 일괄 등록 CSV(`STUDENTS_CSV`)는 로컬용입니다. 배포 서버에서는 선생님 화면에서 학생을 추가합니다.
