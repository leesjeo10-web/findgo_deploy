import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../shared/api/currentUser.js';
import Button from '../../../shared/ui/Button.jsx';
import DeleteItemDialog from './DeleteItemDialog.jsx';
export default function ItemOwnerActions({
  item,
  navigationState
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    let active = true;
    getCurrentUser().then(value => {
      if (active) setUser(value);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!user || String(user.id) !== String(item.userId)) return null;
  return <div className="item-owner-actions">
      <div>
        <Button to={'/items/' + item.id + '/edit'} state={navigationState}>
          수정
        </Button>
        <Button variant="danger" onClick={() => setOpen(true)}>
          삭제
        </Button>
      </div>
      <p>
        {item.status === 'RESOLVED' ? '이미 해결 완료된 물품이에요.' : '물건이 주인에게 돌아갔다면 수정에서 상태를 ‘해결 완료’로 바꿔 주세요.'}
      </p>
      <DeleteItemDialog key={String(open)} item={item} open={open} onClose={() => setOpen(false)} />
    </div>;
}
