import { useSearchParams } from 'react-router-dom';
import AppLayout from '../../../shared/layout/AppLayout.jsx';
import Button from '../../../shared/ui/Button.jsx';
import EmptyState from '../../../shared/ui/EmptyState.jsx';
import ErrorState from '../../../shared/ui/ErrorState.jsx';
import LoadingState from '../../../shared/ui/LoadingState.jsx';
import LoadMoreButton from '../../../shared/ui/LoadMoreButton.jsx';
import DraftResumeNotice from '../components/DraftResumeNotice.jsx';
import HomeBanner from '../components/HomeBanner.jsx';
import AccountPanel from '../components/AccountPanel.jsx';
import ItemSearchForm from '../components/ItemSearchForm.jsx';
import ItemFilters, { ItemTypeFilters } from '../components/ItemFilters.jsx';
import ItemGrid from '../components/ItemGrid.jsx';
import { ITEM_CATEGORIES } from '../model/itemModel.js';
import useItemList from '../hooks/useItemList.js';
import '../styles/items.css';
export default function ItemListPage() {
  const [params, setParams] = useSearchParams();
  const filters = {
    itemCategory: ITEM_CATEGORIES.includes(params.get('itemCategory')) ? params.get('itemCategory') : '',
    keyword: (params.get('keyword') || '').slice(0, 100),
    type: ['FOUND', 'LOST'].includes(params.get('type')) ? params.get('type') : '',
    status: ['OPEN', 'RESOLVED'].includes(params.get('status')) ? params.get('status') : '',
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'latest'
  };
  const list = useItemList(filters);
  const update = (key, value) => setParams(previous => {
    const next = new URLSearchParams(previous);
    value ? next.set(key, value) : next.delete(key);
    return next;
  });
  const filtered = !!(filters.keyword || filters.type || filters.status || filters.itemCategory);
  return <AppLayout footer search={<ItemSearchForm keyword={filters.keyword} onSearch={value => update('keyword', value)} />}>
      <main id="main-content">
        <DraftResumeNotice />
        <div className="wrap">
          <div className="home-hero">
            <HomeBanner />
            <AccountPanel />
          </div>
        </div>
        <section className="wrap item-list-page" id="list" aria-labelledby="list-title">
          <div className="list-heading">
            <div>
              <small>LOST &amp; FOUND</small>
              <h2 id="list-title">등록된 물품</h2>
            </div>
            <ItemTypeFilters value={filters.type} onChange={value => update('type', value)} />
          </div>
          <div className="list-toolbar">
            <p className="result-count">
              전체 <b>{list.loading ? '–' : list.totalElements}</b>건
              {filters.keyword && <span>
                  {' '}
                  ‘{filters.keyword}’ 검색 결과
                  <button type="button" onClick={() => update('keyword', '')}>
                    초기화
                  </button>
                </span>}
            </p>
            <ItemFilters {...filters} onChange={update} />
          </div>
          {list.loading ? <LoadingState cards /> : list.error && !list.items.length ? <ErrorState error={list.error} onRetry={list.retry} /> : !list.items.length ? <EmptyState title={filtered ? '검색 결과가 없어요' : '아직 등록된 물품이 없어요'} image={filtered ? 'Magnifying glass tilted left' : 'Package'} description={filtered ? '다른 검색어로 찾아보거나 분실물로 등록해 두세요.' : '첫 물품을 등록해 보세요.'}>
              {filtered ? <Button variant="outline" onClick={() => setParams({})}>
                  전체 보기
                </Button> : <Button to="/items/new?type=FOUND">습득물 등록하기</Button>}
              <Button variant={filtered ? 'primary' : 'outline'} to="/items/new?type=LOST">
                분실물 등록하기
              </Button>
            </EmptyState> : <>
              <ItemGrid items={list.items} />
              {list.error && <p className="inline-error" role="alert">
                  {list.error.message}
                </p>}
              {!list.last && <LoadMoreButton loading={list.loadingMore} onClick={list.loadMore} />}
            </>}
        </section>
      </main>
    </AppLayout>;
}
