import { Link, useLocation } from 'react-router-dom'
import ItemBadges from './ItemBadges.jsx'
import ItemImage from './ItemImage.jsx'
import { formatDate } from '../../../shared/lib/date.js'
export default function ItemCard({ item, preview = false }) {
  const location = useLocation()
  const body = (
    <>
      <div className="item-card-photo">
        <ItemImage
          key={item.imageBlob?.name || item.imageUrl || item.id || 'preview'}
          item={item}
          decorative
        />
        <span
          className={'photo-kind item-kind--' + item.type.toLowerCase()}
          aria-hidden="true"
        >
          {item.type === 'FOUND' ? '습득물' : '분실물'}
        </span>
      </div>
      <div className="item-card-body">
        <ItemBadges item={item} />
        <h3>{item.name || '물품 이름'}</h3>
        <p>{item.location || '장소'}</p>
        <small>
          {formatDate(item.lostFoundAt, true)}{' '}
          {item.type === 'FOUND' ? '습득' : '분실'}
        </small>
      </div>
    </>
  )
  const classes =
    'item-card' +
    (item.status === 'RESOLVED' ? ' item-card--resolved' : '') +
    (preview ? ' item-card--preview' : '')
  return preview ? (
    <div className={classes}>{body}</div>
  ) : (
    <Link
      to={'/items/' + item.id}
      state={{ listUrl: location.pathname + location.search }}
      className={classes}
    >
      {body}
    </Link>
  )
}
