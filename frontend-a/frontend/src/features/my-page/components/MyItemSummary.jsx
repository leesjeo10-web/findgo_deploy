import { illustration } from '../../../shared/lib/assets.js'
export default function MyItemSummary({ counts, onRetry }) {
  return (
    <div className="my-item-summary">
      {[
        ['FOUND', 'Package', '등록한 습득물'],
        ['LOST', 'Magnifying glass tilted left', '등록한 분실물'],
      ].map(([type, image, label]) => (
        <div className="my-stat" key={type}>
          <img src={illustration(image)} alt="" width="38" height="38" />
          <div>
            <small>{label}</small>
            <b>
              {counts ? counts[type] : '–'}
              {counts && <span>건</span>}
            </b>
          </div>
        </div>
      ))}
      {onRetry && (
        <button className="text-button" type="button" onClick={onRetry}>
          등록 개수 다시 불러오기
        </button>
      )}
    </div>
  )
}
