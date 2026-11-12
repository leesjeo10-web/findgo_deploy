import { ITEM_TYPES } from '../model/itemModel.js'
export function ItemTypeFilters({ value, onChange, compact = false }) {
  return (
    <div
      className={'type-filters' + (compact ? ' type-filters--compact' : '')}
      role="group"
      aria-label="물품 구분"
    >
      {ITEM_TYPES.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
export default function ItemFilters({ status, sort, onChange }) {
  return (
    <div className="list-filters">
      <label>
        <span className="sr-only">물품 상태</span>
        <select
          aria-label="물품 상태"
          value={status}
          onChange={(event) => onChange('status', event.target.value)}
        >
          <option value="">전체 상태</option>
          <option value="OPEN">찾는 중</option>
          <option value="RESOLVED">해결 완료</option>
        </select>
      </label>
      <label>
        <span className="sr-only">정렬</span>
        <select
          aria-label="정렬"
          value={sort}
          onChange={(event) => onChange('sort', event.target.value)}
        >
          <option value="latest">최신순</option>
          <option value="oldest">오래된 순</option>
        </select>
      </label>
    </div>
  )
}
