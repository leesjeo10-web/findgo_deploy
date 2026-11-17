import { illustration } from '../lib/assets.js'
export default function EmptyState({
  title = '아직 등록된 물품이 없어요',
  description,
  image = 'Package',
  children,
}) {
  return (
    <div className="empty-state">
      <img src={illustration(image)} alt="" width="80" height="80" />
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  )
}
