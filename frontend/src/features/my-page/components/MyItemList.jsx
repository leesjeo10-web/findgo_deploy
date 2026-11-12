import { Link } from 'react-router-dom'
import ItemImage from '../../items/components/ItemImage.jsx'
import ItemBadges from '../../items/components/ItemBadges.jsx'
import { formatDate } from '../../../shared/lib/date.js'
export default function MyItemList({ items, listUrl }) {
  return (
    <ul className="my-item-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={
            item.status === 'RESOLVED'
              ? 'my-item-row my-item-row--resolved'
              : 'my-item-row'
          }
        >
          <Link
            to={'/items/' + item.id}
            state={{ listUrl }}
            className="my-item-thumbnail"
            tabIndex={-1}
            aria-hidden="true"
          >
            <ItemImage item={item} decorative />
          </Link>
          <div className="my-item-text">
            <ItemBadges item={item} />
            <Link
              to={'/items/' + item.id}
              state={{ listUrl }}
              className="my-item-name"
            >
              {item.name}
            </Link>
            <p>
              {item.location} · {formatDate(item.createdAt)} 등록
            </p>
          </div>
          <Link
            className="button button--outline button--small"
            to={'/items/' + item.id + '/edit'}
            state={{ listUrl }}
          >
            수정
          </Link>
        </li>
      ))}
    </ul>
  )
}
