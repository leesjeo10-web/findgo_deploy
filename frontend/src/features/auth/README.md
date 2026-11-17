# 인증

학생 4자리 학번·관리자 0000, 공통 로그인 화면, 회원가입 없음. 로그인·내 정보·초기 비밀번호·전화번호 설정은 백엔드 API를 사용한다.

A의 기존 sessionStorage 수명 범위를 유지하고 서버 accessToken만 finder-access-token 키에 보관한다. 브라우저에서 관리자·학생 계정이나 비밀번호를 생성/검증하지 않는다. AuthProvider가 shared/api/http.js의 토큰 읽기와 401 처리에 연결된다. 로그인 실패 401은 폼에 표시하고, 보호 API의 401은 작성 임시 저장 후 토큰·사용자 상태를 지우고 로그인으로 이동한다.

STUDENT의 mustChangePassword, 모든 계정의 phone, ADMIN의 officePhone을 확인한 후 서비스 화면으로 이동한다. ADMIN은 학생 관리·타인 글 삭제만 허용하고 타인 글 수정은 허용하지 않는다. 관리자 초기 비밀번호는 서버 ADMIN_INITIAL_PASSWORD로 정하며 기본 비밀번호를 프론트에 넣지 않는다.
