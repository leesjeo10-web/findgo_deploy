export default function AuthorContact({
  item
}) {
  if (!item) return null;
  return <section className="detail-description" aria-label="작성자 연락처">
    <h2>작성자 연락처</h2>
    <p>{item.userName || '작성자'}</p>
    {item.userPhone ? <p>휴대전화: <a href={'tel:' + item.userPhone.replace(/[^0-9+]/g, '')}>{item.userPhone}</a></p> : <p>등록된 연락처가 없어요.</p>}
    {item.userOfficePhone && <p>교무실: <a href={'tel:' + item.userOfficePhone.replace(/[^0-9+]/g, '')}>{item.userOfficePhone}</a></p>}
  </section>;
}
