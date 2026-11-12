import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../../../shared/layout/AppLayout.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'
import ItemForm from '../components/ItemForm.jsx'
import { createItem } from '../api/itemRepository.js'
export default function ItemCreatePage() {
  const [params] = useSearchParams(),
    navigate = useNavigate(),
    notify = useToast()
  return (
    <AppLayout title="물품 등록">
      <main className="wrap editor-page" id="main-content">
        <ItemForm
          key={params.get('type')?.toUpperCase() || 'FOUND'}
          initialType={params.get('type')?.toUpperCase()}
          onSubmit={async (values, submissionId) => {
            const item = await createItem(values, submissionId)
            notify('물품을 등록했어요.')
            navigate('/items/' + item.id, { replace: true })
          }}
        />
      </main>
    </AppLayout>
  )
}
