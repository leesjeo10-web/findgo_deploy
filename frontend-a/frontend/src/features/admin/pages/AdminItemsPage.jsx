import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout.jsx'
import ItemSearchForm from '../../items/components/ItemSearchForm.jsx'
import ItemFilters, {
  ItemTypeFilters,
} from '../../items/components/ItemFilters.jsx'
import useItemList from '../../items/hooks/useItemList.js'
import MyItemList from '../../my-page/components/MyItemList.jsx'
import DeleteItemDialog from '../../items/components/DeleteItemDialog.jsx'
import LoadingState from '../../../shared/ui/LoadingState.jsx'
import ErrorState from '../../../shared/ui/ErrorState.jsx'
import EmptyState from '../../../shared/ui/EmptyState.jsx'
import LoadMoreButton from '../../../shared/ui/LoadMoreButton.jsx'
import Button from '../../../shared/ui/Button.jsx'
import '../../items/styles/items.css'
import '../../my-page/styles/my-page.css'
export default function AdminItemsPage() {
  const [params, setParams] = useSearchParams(),
    [deleting, setDeleting] = useState(null)
  const filters = {
    keyword: (params.get('keyword') || '').slice(0, 100),
    type: ['FOUND', 'LOST'].includes(params.get('type'))
      ? params.get('type')
      : '',
    status: ['OPEN', 'RESOLVED'].includes(params.get('status'))
      ? params.get('status')
      : '',
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'latest',
  }
  const list = useItemList(filters)
  function update(key, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      value ? next.set(key, value) : next.delete(key)
      return next
    })
  }
  const listUrl = '/admin/items' + (params.size ? '?' + params : '')
  return (
    <AdminLayout
      title="전체 물품 관리"
      description="학생 화면과 같은 물품 목록이에요. 관리자는 작성자에 관계없이 삭제할 수 있어요."
      action={<Button to="/items/new">물품 등록</Button>}
    >
      <div className="admin-item-tools">
        <ItemSearchForm
          keyword={filters.keyword}
          onSearch={(value) => update('keyword', value)}
        />
        <ItemTypeFilters
          compact
          value={filters.type}
          onChange={(value) => update('type', value)}
        />
      </div>
      <div className="list-toolbar admin-list-toolbar">
        <p className="result-count">
          전체 <b>{list.loading ? '–' : list.totalElements}</b>건
        </p>
        <ItemFilters {...filters} onChange={update} />
      </div>
      {list.loading ? (
        <LoadingState />
      ) : list.error && !list.items.length ? (
        <ErrorState error={list.error} onRetry={list.retry} />
      ) : !list.items.length ? (
        <EmptyState
          title="등록된 물품이 없어요"
          description="등록된 물품이 있으면 여기에서 함께 관리할 수 있어요."
        >
          <Button variant="outline" onClick={() => setParams({})}>
            검색·필터 초기화
          </Button>
          <Button to="/items/new">물품 등록하기</Button>
        </EmptyState>
      ) : (
        <>
          <MyItemList
            items={list.items}
            listUrl={listUrl}
            renderActions={(item) => (
              <div className="admin-row-actions">
                <Link
                  to={'/items/' + item.id}
                  state={{ listUrl }}
                  className="button button--outline button--small"
                >
                  상세
                </Link>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => setDeleting(item)}
                >
                  삭제
                </Button>
              </div>
            )}
          />
          {list.error && (
            <p className="inline-error" role="alert">
              {list.error.message}
            </p>
          )}
          {!list.last && (
            <LoadMoreButton
              loading={list.loadingMore}
              onClick={list.loadMore}
            />
          )}
        </>
      )}
      {deleting && (
        <DeleteItemDialog
          key={deleting.id}
          open
          item={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            list.retry()
          }}
        />
      )}
    </AdminLayout>
  )
}
