export default function ItemStatusBadge({ status }) {
  return (
    <span
      className={
        'item-status' + (status === 'RESOLVED' ? ' item-status--resolved' : '')
      }
    >
      {status === 'RESOLVED' ? '해결 완료' : '찾는 중'}
    </span>
  )
}
