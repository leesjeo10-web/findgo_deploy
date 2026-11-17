export default function LoadingState({
  label = '불러오는 중...',
  cards = false,
}) {
  return (
    <div
      className={cards ? 'item-grid loading-grid' : 'loading-state'}
      role="status"
      aria-label={label}
    >
      {cards ? (
        Array.from({ length: 8 }, (_, index) => (
          <div className="skeleton-card" key={index}>
            <div />
            <span />
            <span />
          </div>
        ))
      ) : (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
      {cards && <span className="sr-only">{label}</span>}
    </div>
  )
}
