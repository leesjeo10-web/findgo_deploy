import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../../shared/layout/AppLayout.jsx'
import LoadingState from '../../../shared/ui/LoadingState.jsx'
import ErrorState from '../../../shared/ui/ErrorState.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'
import ItemForm from '../components/ItemForm.jsx'
import useItem from '../hooks/useItem.js'
import { updateItem } from '../api/itemRepository.js'
import { useAuth } from '../../auth/model/authContext.js'
import { canEditItem } from '../../auth/model/authModel.js'
import EmptyState from '../../../shared/ui/EmptyState.jsx'
import Button from '../../../shared/ui/Button.jsx'
export default function ItemEditPage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    location = useLocation(),
    notify = useToast()
  const { item, loading, error, retry } = useItem(id)
  const { user } = useAuth()
  return (
    <AppLayout title="물품 수정">
      <main className="wrap editor-page" id="main-content">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <>
            <ErrorState
              error={error}
              onRetry={error.name === 'ItemNotFoundError' ? undefined : retry}
            />
            <Link to="/" className="back-link">
              ← 목록으로
            </Link>
          </>
        ) : !canEditItem(user, item) ? (
          <EmptyState
            image="Locked"
            title="본인이 등록한 물품만 수정할 수 있어요"
            description="관리자는 다른 학생의 글을 삭제할 수 있지만 수정할 수는 없어요."
          >
            <Button to={'/items/' + id}>상세로 돌아가기</Button>
          </EmptyState>
        ) : (
          <ItemForm
            key={item.id}
            initialValues={item}
            editing
            cancelTo={'/items/' + id}
            cancelState={location.state}
            onSubmit={async (values) => {
              await updateItem(id, values)
              notify('물품 정보를 수정했어요.')
              navigate('/items/' + id, { replace: true, state: location.state })
            }}
          />
        )}
      </main>
    </AppLayout>
  )
}
