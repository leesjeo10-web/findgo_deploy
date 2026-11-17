import { useEffect, useState } from 'react'
export default function ItemSearchForm({ keyword, onSearch, placeholder = '물품 이름, 장소로 검색', label = '물품 검색' }) {
  const [value, setValue] = useState(keyword)
  const [error, setError] = useState('')
  useEffect(() => {
    setValue(keyword)
    setError('')
  }, [keyword])
  return (
    <form
      className="item-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        if (value.trim().length > 100) {
          setError('검색어는 100자 이하로 입력하세요.')
          return
        }
        setError('')
        onSearch(value.trim())
      }}
    >
      <label className="sr-only" htmlFor="item-search">
        {label}
      </label>
      <input
        id="item-search"
        type="search"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setError('')
        }}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? 'search-error' : undefined}
        enterKeyHint="search"
      />
      <button type="submit" aria-label="검색">
        <span className="search-icon" aria-hidden="true" />
      </button>
      {error && (
        <p className="search-error" id="search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
