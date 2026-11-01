import { Link } from 'react-router-dom';
import { formatDate, statusLabel } from '../../data/items';
export function StatusBadge({ item }) {
  return <span className={`badge ${item.type === 'lost' ? 'badge-neutral' : ''} ${item.status === 'returned' ? 'badge-success' : ''}`}>{statusLabel(item)}</span>;
}
export default function ItemCard({ item }) {
  return <Link className="item-card" to={`/items/detail/${item.id}`}>
    <div className="item-art">{item.image ? <img className="uploaded-photo" src={item.image} alt={item.name} /> : <img src="/assets/26cbb.svg" alt="지갑 일러스트" />}</div>
    <div className="card-details">
      <StatusBadge item={item} />
      <h3>{item.name}</h3>
      <p className="card-location"><img src="/assets/6101d.svg" alt="" />{item.place}</p>
      <div className="card-meta"><time dateTime={item.date}>{formatDate(item.date)}</time><img src="/assets/7a4bc.svg" alt="" /></div>
    </div>
  </Link>;
}
