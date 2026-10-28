import { useUIStore } from '../../stores/useUIStore';
export default function SearchBar({ placeholder = '물건 이름이나 장소를 검색해 보세요' }) {
  const query = useUIStore(state => state.query);
  const setQuery = useUIStore(state => state.setQuery);
  return <div className="search-box" role="search">
    <img src="/assets/896a9.svg" alt="" />
    <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={placeholder} aria-label="물건 이름이나 장소 검색" />
    {query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기">×</button>}
  </div>;
}
