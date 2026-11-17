export default function AuthorContact({ item }) {
  if (!item.userName && !item.userPhone) return null
  return (
    <div className="author-contact">
      <p>작성자 {item.userName}</p>
      {item.userPhone && /^010-\d{4}-\d{4}$/.test(item.userPhone) && (
        <a href={'tel:' + item.userPhone.replaceAll('-', '')}>
          {item.userPhone}
        </a>
      )}
    </div>
  )
}
