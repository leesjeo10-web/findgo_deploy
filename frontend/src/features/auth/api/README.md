# 인증 API 자리

2026-11-12 개인 Notion API 표 기준이며 실제 백엔드와 일치하는지는 연동 전에 확인한다.

- POST /api/auth/login: JSON loginId, password → accessToken, user(id, loginId, name, phone, role, mustChangePassword).
- GET /api/auth/me: 토큰으로 최신 사용자 정보·역할·변경 필요 여부 확인.
- PATCH /api/auth/me/password: currentPassword, newPassword → 204. 성공 후 내 정보 재조회 제안.

회원가입·서버 로그아웃 요청은 없다. 로그아웃은 저장한 인증 정보를 지우고 로그인 화면으로 이동한다.
로그인 401(입력 불일치)과 보호 API의 401(토큰 없음·만료)을 구별한다.
첫 비밀번호 변경 전 허용 API·실패 응답, 오류 객체 형식, 토큰 수명·저장 방식은 실제 계약과 추가 확인한다.
전화번호 PATCH /api/auth/me는 my-page의 편집 API 자리에서 계획하며 내 정보 상태는 auth와 함께 갱신한다.
현재 요청 함수·토큰 저장·서버 통신은 없다.
