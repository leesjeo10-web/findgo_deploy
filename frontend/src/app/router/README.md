# 현재 라우터

| 주소 | 화면 |
| --- | --- |
| / | ItemListPage |
| /home | 검색·해시를 유지해 /로 이동 |
| /items/new | ItemCreatePage |
| /items/:id | ItemDetailPage |
| /items/:id/edit | ItemEditPage |
| /mypage | MyPage |
| 그 밖의 주소 | /로 이동 |

사용자의 최신 지시대로 로그인·회원가입·토큰·접근 보호는 연결하지 않았다.
모든 항목은 이번 브라우저에서 등록한 데이터다. 최종 작성자·관리자 권한은 실제 계정/API 연결 때 적용한다.
상세로 갈 때 목록 주소를 state로 전달해 검색 조건을 유지한다.
