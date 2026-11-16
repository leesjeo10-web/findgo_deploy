import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../../../shared/layout/AppLayout.jsx';
import Button from '../../../shared/ui/Button.jsx';
import EmptyState from '../../../shared/ui/EmptyState.jsx';
import ErrorState from '../../../shared/ui/ErrorState.jsx';
import LoadingState from '../../../shared/ui/LoadingState.jsx';
import LoadMoreButton from '../../../shared/ui/LoadMoreButton.jsx';
import { illustration } from '../../../shared/lib/assets.js';
import { ItemTypeFilters } from '../../items/components/ItemFilters.jsx';
import { ITEM_STATUSES } from '../../items/model/itemModel.js';
import useItemList from '../../items/hooks/useItemList.js';
import { getItemCounts } from '../../items/api/itemRepository.js';
import ProfileSettings from '../components/ProfileSettings.jsx';
import MyItemSummary from '../components/MyItemSummary.jsx';
import MyItemList from '../components/MyItemList.jsx';
import '../styles/my-page.css';
export default function MyPage() {
  const [params, setParams] = useSearchParams();
  const type = ['FOUND', 'LOST'].includes(params.get('type')) ? params.get('type') : '';
  const status = ['OPEN', 'RESOLVED'].includes(params.get('status')) ? params.get('status') : '';
  const list = useItemList({
    type,
    status
  });
  const [counts, setCounts] = useState(null),
    [countError, setCountError] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    getItemCounts().then(result => {
      if (active) {
        setCounts(result);
        setCountError(false);
      }
    }).catch(() => {
      if (active) setCountError(true);
    });
    return () => {
      active = false;
    };
  }, [revision]);
  const update = (key, value) => setParams(previous => {
    const next = new URLSearchParams(previous);
    value ? next.set(key, value) : next.delete(key);
    return next;
  });
  return <AppLayout title="내 물품">
      <main id="main-content" className="wrap my-page">
        <section className="my-overview">
          <div className="my-intro">
            <div className="profile-illustration">
              <img src={illustration('Bust in silhouette')} alt="" width="40" height="40" />
            </div>
            <div>
              <small>MY FINDER</small>
              <h1>내가 등록한 물품</h1>
              <p>등록한 물품을 확인하고 관리해 보세요.</p>
            </div>
          </div>
          <div className="my-overview-right">
            <MyItemSummary counts={counts} onRetry={countError ? () => setRevision(value => value + 1) : undefined} />
            <div className="my-overview-actions">
              <Button to="/items/new">물품 등록하기</Button>
              <Button variant="outline" to="/">
                물품 조회하기
              </Button>
            </div>
          </div>
        </section>
        <ProfileSettings />
        <section aria-labelledby="my-list-title">
          <div className="my-list-heading">
            <h2 id="my-list-title">
              내 물품 <span>{list.loading ? '–' : list.totalElements}</span>
            </h2>
            <div className="my-filters">
              <ItemTypeFilters compact value={type} onChange={value => update('type', value)} />
              <div className="status-chips" role="group" aria-label="물품 상태">
                {ITEM_STATUSES.map(option => <button type="button" key={option.value} aria-pressed={status === option.value} onClick={() => update('status', option.value)}>
                    {option.label}
                  </button>)}
              </div>
            </div>
          </div>
          {list.loading ? <LoadingState /> : list.error && !list.items.length ? <ErrorState error={list.error} onRetry={list.retry} /> : !list.items.length ? <EmptyState title={type || status ? '조건에 맞는 내 물품이 없어요' : '아직 등록한 물품이 없어요'} description={type || status ? '다른 조건으로 다시 찾아보세요.' : '분실하거나 주운 물품을 등록해 보세요.'}>
              {type || status ? <Button variant="outline" onClick={() => setParams({})}>
                  필터 초기화
                </Button> : <Button to="/items/new">물품 등록하기</Button>}
            </EmptyState> : <>
              <MyItemList items={list.items} listUrl={'/mypage' + (params.size ? '?' + params.toString() : '')} />
              {list.error && <p className="inline-error" role="alert">
                  {list.error.message}
                </p>}
              {!list.last && <LoadMoreButton loading={list.loadingMore} onClick={list.loadMore} />}
            </>}
        </section>
      </main>
    </AppLayout>;
}
