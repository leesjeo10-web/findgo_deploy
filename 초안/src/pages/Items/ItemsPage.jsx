import Button from '../../components/common/Button';
import PageTitle, { BackLink } from '../../components/common/PageTitle';
import SearchBar from '../../components/item/SearchBar';
import ItemList from '../../components/item/ItemList';
import { Loading, ErrorState } from '../../components/common/Feedback';
import { useItemStore } from '../../stores/useItemStore';
import { useUIStore } from '../../stores/useUIStore';
import { matchesQuery } from '../../data/items';
export default function ItemsPage({ type }) {
  const { items, loading, error, fetchItems } = useItemStore();
  const query = useUIStore(state => state.query);
  const visible = items.filter(item => item.type === type && matchesQuery(item, query));
  return <main className="page flex flex-col gap-6"><BackLink />
    <PageTitle title={type === 'found' ? '주인을 기다리는 물건' : '친구들이 찾고 있는 물건'} description={type === 'found' ? '학교에서 발견된 물건을 한곳에 모았어요.' : '물건을 발견했다면 상세 정보를 확인해 주세요.'} />
    <SearchBar />
    <div className="list-filters"><nav aria-label="물건 종류" className="flex gap-3"><Button to="/items/found" variant={type === 'found' ? 'primary' : 'neutral'} aria-current={type === 'found' ? 'page' : undefined}>습득물 {items.filter(item => item.type === 'found').length}</Button><Button to="/items/lost" variant={type === 'lost' ? 'primary' : 'neutral'} aria-current={type === 'lost' ? 'page' : undefined}>분실물 {items.filter(item => item.type === 'lost').length}</Button></nav><p aria-live="polite">전체 {visible.length}개</p></div>
    {loading ? <Loading /> : error ? <ErrorState message={error} retry={fetchItems} /> : <ItemList items={visible} type={type} query={query} />}
  </main>;
}
