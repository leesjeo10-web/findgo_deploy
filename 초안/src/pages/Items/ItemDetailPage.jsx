import { useParams } from 'react-router-dom';
import { BackLink } from '../../components/common/PageTitle';
import { StatusBadge } from '../../components/item/ItemCard';
import { ErrorState, Loading } from '../../components/common/Feedback';
import { useItem } from '../../hooks/useItem';
import { formatDate, typeLabel } from '../../data/items';
export default function ItemDetailPage() {
  const { id } = useParams();
  const { item, loading, error, retry } = useItem(id);
  if (loading) return <main className="page"><Loading /></main>;
  if (error) return <main className="page"><BackLink /><ErrorState message={error} retry={retry} /></main>;
  const found = item.type === 'found';
  return <main className="page"><BackLink to={`/items/${item.type}`}>{typeLabel(item.type)} 목록</BackLink>
    <div className="detail-layout"><div className="detail-photo">{item.image ? <img className="uploaded-photo" src={item.image} alt={item.name} /> : found ? <img src="/assets/20eec.svg" alt="지갑 일러스트" /> : <span className="list-pin"><img src="/assets/b5ded.svg" alt="위치 표시" /></span>}</div>
      <section className="detail-content"><StatusBadge item={item} /><div><h1>{item.name}</h1><p className="text-sm text-muted mt-2">{item.ownerName} · {formatDate(item.createdAt || item.date)} 등록</p></div>
        <dl className="item-information"><div><dt>{found ? '습득' : '분실'} 장소</dt><dd>{item.place}</dd></div><div><dt>{found ? '습득' : '분실'} 날짜</dt><dd>{formatDate(item.date)}</dd></div>{found && <div><dt>보관 장소</dt><dd>{item.storagePlace}</dd></div>}</dl>
        <hr /><div><h2 className="text-[17px]">물건의 특징</h2><p className="mt-2 whitespace-pre-wrap text-body">{item.description || '등록된 설명이 없어요.'}</p></div>
        <aside className="guide-panel"><h2>{found ? '내 물건이라면' : '이 물건을 발견했다면'}</h2><p>{found ? '보관 장소에서 물건의 특징을 확인한 뒤 찾아가 주세요.' : '습득물로 등록하고 보관 장소를 알려주세요.'}</p></aside>
      </section>
    </div>
  </main>;
}
