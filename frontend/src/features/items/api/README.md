# 물품 API

itemRepository.js는 실제 백엔드의 물품 CRUD·검색·상태 변경·내 물품을 호출한다. imageApi.js는 multipart file 업로드 후 imageUrl을 반환한다. 공통 토큰·401 처리는 shared/api/http.js와 AuthProvider에 연결되어 있다. IndexedDB 물품 저장 구현은 사용하지 않는다.
