import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../../shared/api/currentUser.js';
import { findDrafts } from '../model/itemDraft.js';
export default function DraftResumeNotice() {
  const [drafts, setDrafts] = useState([]);
  useEffect(() => {
    let active = true;
    getCurrentUser().then(user => {
      if (!active) return;
      try {
        setDrafts(findDrafts(localStorage, user.id));
      } catch {/* 브라우저 저장소를 사용할 수 없으면 안내를 생략한다. */}
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!drafts.length) return null;
  return <aside className="wrap" aria-label="임시 저장한 물품"><p>로그인 만료 전에 작성하던 내용이 있어요. 임시 저장 후 3시간 안에 이어서 작성할 수 있어요.</p><ul>{drafts.map(draft => <li key={draft.href}><Link to={draft.href}>{draft.name} 이어서 작성</Link></li>)}</ul></aside>;
}
