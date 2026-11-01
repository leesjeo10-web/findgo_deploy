export const demoUser = { id: 'demo-user', name: '건주', email: 'user@example.com' };
export const seedItems = [
  { id: '1', type: 'found', name: '검은색 반지갑', place: '학생회관', date: '2026-09-03', storagePlace: '학생회관 1층 분실물 보관함', description: '검은색 반지갑이에요.\n학생회관에서 발견해 분실물 보관함에 두었어요.' },
  { id: '2', type: 'found', name: '카드지갑', place: '도서관', date: '2026-09-02', storagePlace: '도서관 안내 데스크', description: '도서관에서 발견한 카드지갑이에요.' },
  { id: '3', type: 'found', name: '브라운 장지갑', place: '운동장', date: '2026-09-01', storagePlace: '교무실 분실물 보관함', description: '운동장 벤치에서 발견한 브라운 장지갑이에요.' },
  { id: '4', type: 'found', name: '지갑 (검정)', place: '기숙사', date: '2026-08-31', storagePlace: '기숙사 사감실', description: '기숙사 입구에서 발견했어요.' },
  { id: '101', type: 'lost', name: '검정색 에어팟', place: '급식실', date: '2026-09-03', description: '검정색 케이스를 씌운 에어팟을 찾고 있어요.' },
  { id: '102', type: 'lost', name: '아이폰 케이스', place: '도서관', date: '2026-09-03', description: '도서관에서 아이폰 케이스를 잃어버렸어요.' },
  { id: '103', type: 'lost', name: '파란색 우산', place: '정문', date: '2026-09-03', description: '정문 근처에서 파란색 우산을 잃어버렸어요.' },
  { id: '104', type: 'lost', name: '무선 이어폰', place: '강의실', date: '2026-09-03', description: '강의실에서 무선 이어폰을 마지막으로 봤어요.' },
].map(item => ({ ...item, createdAt: item.date, ownerId: demoUser.id, ownerName: demoUser.name, status: item.type === 'found' ? 'stored' : 'searching', image: null }));
export const formatDate = value => {
  if (!value) return '날짜 미정';
  const date = value.includes('T') ? new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) : value.slice(0, 10);
  return date.replaceAll('-', '.');
};
export const typeLabel = type => type === 'found' ? '습득물' : '분실물';
export const statusLabel = item => item.status === 'returned' ? '주인을 찾았어요' : item.type === 'found' ? '보관 중' : '찾고 있어요';
export function matchesQuery(item, query) {
  const normalized = query.trim().toLocaleLowerCase();
  return !normalized || [item.name, item.place, item.description, item.storagePlace].some(value => value?.toLocaleLowerCase().includes(normalized));
}
