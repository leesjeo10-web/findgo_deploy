import Button from './Button.jsx'
export default function LoadMoreButton({ onClick, loading }) {
  return (
    <div className="load-more">
      <Button variant="outline" onClick={onClick} loading={loading}>
        {loading ? '불러오는 중...' : '더 보기'}
      </Button>
    </div>
  )
}
