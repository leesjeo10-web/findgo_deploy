import { useState } from 'react'
import Button from '../../../shared/ui/Button.jsx'
import DeleteItemDialog from './DeleteItemDialog.jsx'
import { useAuth } from '../../auth/model/authContext.js'
import { canEditItem, canDeleteItem } from '../../auth/model/authModel.js'
export default function ItemOwnerActions({ item, navigationState }) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const editable = canEditItem(user, item)
  if (!canDeleteItem(user, item)) return null
  return (
    <div className="item-owner-actions">
      <div>
        {editable && (
          <Button to={'/items/' + item.id + '/edit'} state={navigationState}>
            수정
          </Button>
        )}
        <Button variant="danger" onClick={() => setOpen(true)}>
          삭제
        </Button>
      </div>
      <p>
        {!editable
          ? '관리자는 작성자에 관계없이 물품을 삭제할 수 있어요.'
          : item.status === 'RESOLVED'
            ? '이미 해결 완료된 물품이에요.'
            : '물건이 주인에게 돌아갔다면 수정에서 상태를 ‘해결 완료’로 바꿔 주세요.'}
      </p>
      <DeleteItemDialog
        key={String(open)}
        item={item}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
