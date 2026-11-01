import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { errorMessage } from '../../api/http';
export default function DeleteDialog({ onClose, onDelete }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  async function confirm() {
    setBusy(true); setError('');
    try { await onDelete(); onClose(); }
    catch (error) { setError(errorMessage(error)); setBusy(false); }
  }
  return <dialog ref={dialog} className="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <h2 id="delete-title">이 물건을 삭제할까요?</h2><p id="delete-description">삭제한 물건은 목록에서 사라져요.<br />이 작업은 되돌릴 수 없어요.</p>
    {error && <p className="field-error" role="alert">{error}</p>}
    <div className="grid grid-cols-[1fr_1.65fr] gap-3"><Button variant="neutral" onClick={onClose} disabled={busy} autoFocus>취소</Button><Button variant="danger" onClick={confirm} loading={busy}>삭제하기</Button></div>
  </dialog>;
}
