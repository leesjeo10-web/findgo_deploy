import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTitle from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Header';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/item/ItemCard';
import DeleteDialog from '../../components/common/DeleteDialog';
import { EmptyState, ErrorState, Loading } from '../../components/common/Feedback';
import { useAuthStore } from '../../stores/useAuthStore';
import { useItemStore } from '../../stores/useItemStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatDate, typeLabel } from '../../data/items';
import { errorMessage } from '../../api/http';

export default function MyPage() {
  const { user, logout } = useAuthStore();
  const { items, loading, error, fetchItems, deleteItem } = useItemStore();
  const notify = useUIStore(state => state.notify);
  const [deleting, setDeleting] = useState(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const navigate = useNavigate();
  const mine = items.filter(item => String(item.ownerId) === String(user.id));
  const foundCount = mine.filter(item => item.type === 'found').length;
  const lostCount = mine.filter(item => item.type === 'lost').length;
  async function signOut() {
    setLogoutBusy(true); setLogoutError('');
    try { await logout(); notify('로그아웃했어요.'); navigate('/login', { replace: true }); }
    catch (error) { setLogoutError(errorMessage(error)); setLogoutBusy(false); }
  }
  return <main className="page my-page"><PageTitle title="내 물건과 활동을 한눈에" description="등록한 물건을 확인하고 정보를 관리해 보세요." />
    <section className="profile-panel"><Avatar large /><div className="min-w-0 flex-1"><h2>{user.name}님</h2><p className="break-all text-sm text-muted mt-1">{user.email}</p></div><Button variant="neutral" onClick={signOut} loading={logoutBusy}>로그아웃</Button></section>
    {logoutError && <p className="field-error" role="alert">{logoutError}</p>}
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-6" aria-label="내 활동">{[['등록한 습득물', foundCount], ['등록한 분실물', lostCount], ['주인을 찾은 물건', mine.filter(item => item.status === 'returned').length]].map(([label, value]) => <div className="activity-stat" key={label}><h2>{label}</h2><p>{value}</p></div>)}</section>
    <section><div className="section-heading"><h2>내가 등록한 물건</h2><p className="ml-auto text-sm text-muted">전체 {mine.length} · 습득물 {foundCount} · 분실물 {lostCount}</p></div>
      {loading ? <Loading /> : error ? <ErrorState message={error} retry={fetchItems} /> : !mine.length ? <EmptyState /> : <div className="my-items">{mine.map(item => <article className="my-item" key={item.id}>
        <Link to={`/items/detail/${item.id}`} className="my-item-main"><span className="my-pin"><img src="/assets/bd35a.svg" alt="" /></span><div className="min-w-0"><h3>{item.name}</h3><p>{typeLabel(item.type)} · {formatDate(item.date)}</p></div></Link>
        <StatusBadge item={item} /><div className="my-item-actions"><Link to={`/items/${item.id}/edit`} className="text-link">수정</Link><button type="button" onClick={() => setDeleting(item)} aria-label={`${item.name} 삭제`}>삭제</button></div>
      </article>)}</div>}
    </section>
    {deleting && <DeleteDialog onClose={() => setDeleting(null)} onDelete={async () => { await deleteItem(String(deleting.id), user); notify('물건을 삭제했어요.'); }} />}
  </main>;
}
