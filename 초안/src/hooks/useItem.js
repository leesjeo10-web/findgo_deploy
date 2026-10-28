import { useEffect, useState } from 'react';
import { itemsApi } from '../api/services';
import { errorMessage } from '../api/http';
export function useItem(id) {
  const [state, setState] = useState({ item: null, loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ item: null, loading: true, error: '' });
    itemsApi.get(id).then(item => {
      if (active) setState({ item, loading: false, error: '' });
    }).catch(error => {
      if (active) setState({ item: null, loading: false, error: errorMessage(error) });
    });
    return () => { active = false; };
  }, [id, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
