import { Link } from 'react-router-dom';
import ItemCard, { StatusBadge } from './ItemCard';
import { EmptyState } from '../common/Feedback';
import { formatDate } from '../../data/items';
export default function ItemList({ items, type = 'found', compact = false, query = '' }) {
  if (!items.length) return <EmptyState query={query} />;
  if (type === 'found') return <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-6">{items.map(item => <ItemCard key={item.id} item={item} />)}</div>;
  return <div className={compact ? 'grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4' : 'lost-list'}>
    {items.map(item => <Link key={item.id} to={`/items/detail/${item.id}`} className={compact ? 'lost-summary' : 'lost-row'}>
      {!compact && <span className="list-pin"><img src="/assets/b5ded.svg" alt="" /></span>}
      <div className="min-w-0 flex-1"><h3>{item.name}</h3><p>{item.place} · {formatDate(item.date)}</p></div>
      {!compact && <><StatusBadge item={item} /><img src="/assets/7a4bc.svg" alt="" /></>}
    </Link>)}
  </div>;
}
