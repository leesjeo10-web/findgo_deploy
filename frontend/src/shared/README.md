# 공통 요소

- ui/: Button, FormField, LoadingState, EmptyState, ErrorState, LoadMoreButton, ConfirmDialog, Toast.
- layout/: Header, Footer, AppLayout.
- lib/: 브라우저 DB, 날짜, 제공 자산의 경로.
- assets/: 서비스 로고, Paperlogy, Fluent Emoji 일러스트·라이선스.
- styles/: tokens.css, fonts.css, global.css.

공통 UI는 기능 API를 직접 호출하지 않는다.
물품 사진·배지·입력 폼은 items에서 공유한다.
인증·토큰·비밀번호 입력은 이번 범위에서 구현하지 않았다.
