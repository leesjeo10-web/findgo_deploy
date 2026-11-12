import EmptyState from './EmptyState.jsx'
import Button from './Button.jsx'
export default function ErrorState({
  error,
  onRetry,
  title = '불러오지 못했어요',
}) {
  return (
    <div role="alert">
      <EmptyState
        image="Electric plug"
        title={title}
        description={error?.message || '잠시 후 다시 시도해주세요.'}
      >
        {onRetry && <Button onClick={onRetry}>다시 시도</Button>}
      </EmptyState>
    </div>
  )
}
