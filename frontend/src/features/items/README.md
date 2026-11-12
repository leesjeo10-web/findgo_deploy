# 물품 기능

목록·상세·등록·수정·상태 변경·삭제가 브라우저 저장으로 동작한다.

- pages/: 주소별 화면 조립과 저장 후 이동.
- components/: 배너·빠른 메뉴·검색·필터·사진·카드·공유 폼·미리보기·삭제 확인.
- api/itemRepository.js: 현재 브라우저 저장 접근. 실제 API 연결 시 교체할 경계.
- hooks/: useItemList(검색·더 보기·오래된 결과 무시), useItem(상세·실패·재시도).
- model/: 입력 검사·사진 확인·검색·정렬·페이지 구분.
- styles/: 원본 디자인을 반영한 목록·상세·폼 스타일.

등록·수정은 ItemForm·ItemImageInput, 목록·미리보기는 ItemCard, 카드·상세·내 물품은 ItemImage·배지를 공유한다.
ItemStatusBadge·ItemOwnerActions도 기존 파일을 구현해 활용한다.
AuthorContact는 계정 연결 전까지 비워 두고 가짜 이름·연락처를 표시하지 않는다.
로그인·계정 연락처 확인·사진 인증은 이번 범위에서 보류한다.
[구현·검증 기록](../../../docs/frontend-implementation.md) 참고.
