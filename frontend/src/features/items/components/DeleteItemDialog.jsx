import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../../../shared/ui/ConfirmDialog.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'
import { deleteItem } from '../api/itemRepository.js'
export default function DeleteItemDialog({ item, open, onClose }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null)
  const pending = useRef(false),
    navigate = useNavigate(),
    notify = useToast()
  const remove = async () => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      await deleteItem(item.id)
      notify('삭제되었습니다.')
      navigate('/mypage', { replace: true })
    } catch (failure) {
      setError(failure)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <ConfirmDialog
      open={open}
      title="정말 삭제하시겠어요?"
      busy={busy}
      error={error}
      onClose={onClose}
      onConfirm={remove}
    >
      <p>‘{item.name}’과 사진이 함께 삭제돼요.</p>
      <p>삭제하면 되돌릴 수 없어요.</p>
    </ConfirmDialog>
  )
}
