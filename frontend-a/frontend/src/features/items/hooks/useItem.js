import { useEffect, useState } from 'react'
import { getItem } from '../api/itemRepository.js'
export default function useItem(id) {
  const [state, setState] = useState({ item: null, loading: true, error: null })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    setState({ item: null, loading: true, error: null })
    getItem(id)
      .then((item) => {
        if (active) setState({ item, loading: false, error: null })
      })
      .catch((error) => {
        if (active) setState({ item: null, loading: false, error })
      })
    return () => {
      active = false
    }
  }, [id, revision])
  return { ...state, retry: () => setRevision((value) => value + 1) }
}
