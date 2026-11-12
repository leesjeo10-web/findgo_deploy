import ItemStatusBadge from './ItemStatusBadge.jsx'
export default function ItemBadges({ item }) {
  return (
    <div className="item-badges">
      <span className={'item-kind item-kind--' + item.type.toLowerCase()}>
        {item.type === 'FOUND' ? '습득물' : '분실물'}
      </span>
      <ItemStatusBadge status={item.status} />
    </div>
  )
}
