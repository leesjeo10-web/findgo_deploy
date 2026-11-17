import ItemCard from './ItemCard.jsx'
export default function ItemPreview({ item }) {
  return (
    <aside className="item-preview" aria-label="목록 미리보기">
      <p>목록에 이렇게 보여요</p>
      <ItemCard item={item} preview />
    </aside>
  )
}
