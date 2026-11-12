import { useCallback, useEffect, useRef, useState } from 'react'
import { listItems } from '../api/itemRepository.js'
export default function useItemList({
  keyword = '',
  type = '',
  status = '',
  sort = 'latest',
}) {
  const [state, setState] = useState({
    items: [],
    loading: true,
    loadingMore: false,
    error: null,
    page: 0,
    last: true,
    totalElements: 0,
  })
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  const busy = useRef(false)
  useEffect(() => {
    const current = ++generation.current
    busy.current = true
    setState({
      items: [],
      loading: true,
      loadingMore: false,
      error: null,
      page: 0,
      last: true,
      totalElements: 0,
    })
    listItems({ keyword, type, status, sort })
      .then((result) => {
        if (current === generation.current)
          setState({
            ...result,
            items: result.content,
            loading: false,
            loadingMore: false,
            error: null,
          })
      })
      .catch((error) => {
        if (current === generation.current)
          setState((previous) => ({ ...previous, loading: false, error }))
      })
      .finally(() => {
        if (current === generation.current) busy.current = false
      })
    return () => {
      generation.current += 1
    }
  }, [keyword, type, status, sort, revision])
  const loadMore = async () => {
    if (busy.current || state.last) return
    busy.current = true
    const current = generation.current
    setState((previous) => ({ ...previous, loadingMore: true, error: null }))
    try {
      const result = await listItems({
        keyword,
        type,
        status,
        sort,
        page: state.page + 1,
      })
      if (current === generation.current)
        setState((previous) => ({
          ...result,
          items: [...previous.items, ...result.content],
          loading: false,
          loadingMore: false,
          error: null,
        }))
    } catch (error) {
      if (current === generation.current)
        setState((previous) => ({ ...previous, loadingMore: false, error }))
    } finally {
      if (current === generation.current) busy.current = false
    }
  }
  const retry = useCallback(() => setRevision((value) => value + 1), [])
  return { ...state, loadMore, retry }
}
