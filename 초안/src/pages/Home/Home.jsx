import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import SearchBar from '../../components/item/SearchBar';
import ItemList from '../../components/item/ItemList';
import { Loading, ErrorState } from '../../components/common/Feedback';
import { useItemStore } from '../../stores/useItemStore';
import { useUIStore } from '../../stores/useUIStore';
import { matchesQuery } from '../../data/items';
export default function Home() {
  const { items, loading, error, fetchItems } = useItemStore();
  const query = useUIStore(state => state.query);
  const found = items.filter(item => item.type === 'found' && matchesQuery(item, query));
  const lost = items.filter(item => item.type === 'lost' && matchesQuery(item, query));
  return <main className="page home-page">
    <section className="home-intro"><p className="eyebrow">우리 학교 분실물 찾기</p><h1>잃어버린 물건,<br />가까이에서 찾아요</h1><p className="home-description">누군가 찾고 있는 물건이 여기 있을지도 몰라요.</p></section>
    <section className="search-registration" aria-label="검색과 등록"><SearchBar placeholder="어떤 물건을 찾고 있나요?" /><Button to="/items/new/found">습득물 등록</Button><Button to="/items/new/lost" variant="outline">분실물 등록</Button></section>
    {loading ? <Loading /> : error ? <ErrorState message={error} retry={fetchItems} /> : <>
      <section className="home-section"><div className="section-heading"><h2>주인을 기다리는 물건</h2><span className="badge">습득물</span><Link to="/items/found" className="view-all">전체 보기 <span aria-hidden="true">→</span></Link></div><ItemList items={found.slice(0, 4)} query={query} /></section>
      <section className="home-section"><div className="section-heading"><h2>친구들이 찾고 있어요</h2><span className="badge badge-neutral">분실물</span><Link to="/items/lost" className="view-all">전체 보기 <span aria-hidden="true">→</span></Link></div><ItemList items={lost.slice(0, 4)} type="lost" compact query={query} /></section>
    </>}
  </main>;
}
