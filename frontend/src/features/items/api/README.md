# 물품 저장 경계

itemRepository.js가 listItems / getItem / createItem / updateItem / deleteItem / getItemCounts를 제공한다.
현재는 shared/lib/browserDatabase.js를 통해 브라우저 IndexedDB의 items에 저장한다. 실제 서버 요청은 없다.

물품 필드 이름은 기획을 참고하고 imageBlob만 로컬 사진 저장 전용으로 둔다.
나중에 실제 물품·사진·내 물품 API와 연결할 때 이 모듈을 서버 어댑터로 교체하고 imageUrl로 연결한다.
VITE_API_BASE_URL 설정만으로 연결되는 구조는 아직 아니다.
로그인·토큰·인증 헤더·API 권한 검사는 추가하지 않았다.
