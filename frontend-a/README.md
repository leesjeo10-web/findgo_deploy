# 찾Go · Finder Frontend

학교의 분실물·습득물을 조회하고 관리하는 React + Vite 프론트엔드입니다. 애플리케이션 소스는 `frontend/`에 있습니다.

## 실행

Node.js와 npm이 필요합니다. 저장소 루트에서 실행합니다.

```bash
cd frontend
npm ci
npm run dev
```

개발 서버가 표시하는 Local 주소로 접속합니다.

## 기능

- 로그인, 첫 로그인 비밀번호 변경, 전화번호 입력·수정
- 물품 조회·검색·필터·등록·상세·수정·상태 변경·삭제
- 내 정보와 내 물품 관리
- 관리자용 전체 물품 관리와 학생 계정 추가·검색·비밀번호 초기화·삭제

| 계정 | 최초 아이디 | 개발용 초기 비밀번호 | 권한 |
| --- | --- | --- | --- |
| 선생님 | `0000` | `0000` | ADMIN |
| 학생 | 관리자가 지급하는 숫자 6자리 | 관리자가 발급 | STUDENT |

선생님 계정이 곧 관리자 계정입니다. 별도의 `admin` 아이디는 생성하지 않습니다. 선생님 `0000` 계정으로 학생·물품 관리 기능을 사용합니다. 모든 계정은 첫 로그인 시 비밀번호 변경과 전화번호 입력이 필요합니다.

## 저장 방식

현재 버전은 브라우저 IndexedDB에 계정·물품을 저장하는 로컬 개발 버전입니다. 서버 API는 연결하지 않았으며 실제 운영에는 서버 인증·권한 검사와 데이터 저장 API 연결이 필요합니다. `.env.example`은 설정 항목 안내용이며 환경 변수를 채우는 것만으로 서버에 연결되지는 않습니다.

## 검증과 빌드

`frontend/`에서 실행합니다.

```bash
npm test
npm run build
```

빌드 결과는 `frontend/dist/`에 생성됩니다. 호스팅 서비스에서 프로젝트 경로를 지정해야 한다면 `frontend`로 설정합니다.

## GitHub 업로드

이 축소본은 전체 98개 파일로 구성됩니다. 압축을 푼 뒤 이 README와 `.gitignore`, `frontend/`를 저장소 루트에 올립니다. 바깥 폴더 이름은 저장소 안에 추가하지 않습니다.

실행 소스, 폰트, 테스트, `package-lock.json`, `.env.example`, Render 배포 설정은 유지했습니다. 내부 설명용 README, 과거 설계 문서·도표, 화면 검증 이미지, 빈 폴더 유지용 파일과 중복 설정은 제외했습니다. 로고·일러스트 24개는 `frontend/src/shared/lib/assets.js`에 원본 PNG 바이트를 data URL로 합쳤습니다. 개발 서버에서는 data URL을 사용하고, 프로덕션 빌드에서는 Vite 설정이 원본 PNG를 개별 이미지로 복원합니다. 에셋 라이선스는 `frontend/public/licenses/fluentui-emoji.txt`에 있습니다.

`npm ci`나 빌드를 실행하면 파일 수가 늘어납니다. 웹 업로드에는 `node_modules/`, `dist/`, 실제 `.env` 파일을 포함하지 않습니다.

## 협업 순서

기존 팀 저장소에서는 `main`을 최신화한 뒤 작업별 브랜치를 만듭니다.

```bash
git checkout main
git pull origin main
git checkout -b chore/frontend-upload
```

작업 성격에 따라 `feat/`, `fix/`, `refactor/`, `style/`, `chore/`를 사용하고 `main`에서 직접 개발하지 않습니다. 완료한 작업 단위로 변경사항과 민감정보를 확인하고 커밋·Push합니다.

```bash
git status
git diff
git add <확인한-파일-경로>
git diff --cached
git commit -m "chore: 프론트엔드 업로드 파일 정리"
git push -u origin chore/frontend-upload
```

같은 브랜치에서 다음 Push는 `git push`로 실행합니다. Push 후 팀장이나 담당자에게 완료를 알립니다.
