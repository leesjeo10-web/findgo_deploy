import { useEffect } from 'react';
import Button from './Button';
import { useUIStore } from '../../stores/useUIStore';
export function Loading() { return <div className="empty-state" role="status"><span className="spinner text-primary" />물건을 불러오고 있어요.</div>; }
export function ErrorState({ message, retry }) {
  return <div className="empty-state" role="alert"><p>{message}</p>{retry && <Button variant="neutral" onClick={retry}>다시 시도</Button>}</div>;
}
export function EmptyState({ query }) {
  return <div className="empty-state"><p>{query ? `“${query}” 검색 결과가 없어요.` : '아직 등록된 물건이 없어요.'}</p><p className="text-sm text-muted">다른 검색어를 입력하거나 새로운 물건을 등록해 보세요.</p></div>;
}
export function Toast() {
  const toast = useUIStore(state => state.toast);
  const clearToast = useUIStore(state => state.clearToast);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 4000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);
  return toast && <div className="toast" role="status">{toast.message}<button type="button" onClick={clearToast} aria-label="알림 닫기">×</button></div>;
}
