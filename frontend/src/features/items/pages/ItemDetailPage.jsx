import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import AppLayout from '../../../shared/layout/AppLayout.jsx'
import Button from '../../../shared/ui/Button.jsx'
import LoadingState from '../../../shared/ui/LoadingState.jsx'
import ErrorState from '../../../shared/ui/ErrorState.jsx'
import EmptyState from '../../../shared/ui/EmptyState.jsx'
import { illustration } from '../../../shared/lib/assets.js'
import { formatDate } from '../../../shared/lib/date.js'
import ItemImage from '../components/ItemImage.jsx'
import ItemBadges from '../components/ItemBadges.jsx'
import ItemOwnerActions from '../components/ItemOwnerActions.jsx'
import ItemGrid from '../components/ItemGrid.jsx'
import useItem from '../hooks/useItem.js'
import { listItems } from '../api/itemRepository.js'
import '../styles/detail.css'

export default function ItemDetailPage() {
  const { id } = useParams(),
    location = useLocation()
  const { item, loading, error, retry } = useItem(id)
  const [others, setOthers] = useState([])
  useEffect(() => {
    let active = true
    listItems({ size: 5 })
      .then((result) => {
        if (active)
          setOthers(
            result.content.filter((value) => value.id !== id).slice(0, 4),
          )
      })
      .catch(() => {
        if (active) setOthers([])
      })
    return () => {
      active = false
    }
  }, [id])
  const back = location.state?.listUrl || '/'
  return (
    <AppLayout title={item?.name || '물품 상세'}>
      <main id="main-content" className="wrap detail-page">
        <Link className="back-link" to={back}>
          ← {back.startsWith('/mypage') ? '내 물품으로' : '목록으로'}
        </Link>
        {loading ? (
          <LoadingState />
        ) : error ? (
          error.name === 'ItemNotFoundError' ? (
            <EmptyState
              title="해당 물품을 찾을 수 없어요"
              description={error.message}
            >
              <Button to="/">목록으로</Button>
            </EmptyState>
          ) : (
            <ErrorState error={error} onRetry={retry} />
          )
        ) : (
          <>
            <section
              className={
                'detail-hero' +
                (item.status === 'RESOLVED' ? ' detail-hero--resolved' : '')
              }
            >
              <ItemImage key={item.id} item={item} className="detail-stage" />
              <div className="detail-summary">
                <ItemBadges item={item} />
                <h1>{item.name}</h1>
                <p className="registered-date">
                  {formatDate(item.createdAt)} 등록
                </p>
                <div className="item-facts">
                  {[
                    [
                      'Round pushpin',
                      item.type === 'FOUND' ? '습득 장소' : '분실 장소',
                      item.location,
                    ],
                    [
                      'Spiral calendar',
                      item.type === 'FOUND' ? '습득 날짜' : '분실 날짜',
                      formatDate(item.lostFoundAt),
                    ],
                    ...(item.type === 'FOUND'
                      ? [
                          [
                            'Classical building',
                            '보관 장소',
                            item.storageLocation,
                          ],
                        ]
                      : []),
                  ].map(([image, label, value]) => (
                    <div
                      className={
                        'item-fact' +
                        (label === '보관 장소' ? ' item-fact--key' : '')
                      }
                      key={label}
                    >
                      <img
                        src={illustration(image)}
                        alt=""
                        width="30"
                        height="30"
                      />
                      <div>
                        <small>{label}</small>
                        <b>{value}</b>
                      </div>
                    </div>
                  ))}
                </div>
                <ItemOwnerActions
                  item={item}
                  navigationState={{ listUrl: back }}
                />
              </div>
            </section>
            <section className="detail-description">
              <h2>특징·상세 설명</h2>
              <p>{item.description}</p>
            </section>
            <section className="detail-section">
              <h2>
                {item.type === 'FOUND'
                  ? '물건을 돌려받는 방법'
                  : '비슷한 물건을 발견했다면'}
              </h2>
              <ol className="return-steps">
                <li>
                  <img src={illustration('Speech balloon')} alt="" />
                  <small>STEP 1</small>
                  <h3>내 물건인지 확인</h3>
                  <p>
                    {item.type === 'FOUND'
                      ? '보관 장소에 가서 물건의 특징을 말하고 내 물건이 맞는지 확인해요.'
                      : '물품 사진과 특징을 살펴보고, 같은 물건인지 확인해 주세요.'}
                  </p>
                </li>
                <li>
                  <img src={illustration('Package')} alt="" />
                  <small>STEP 2</small>
                  <h3>물건 전달</h3>
                  <p>
                    {item.type === 'FOUND'
                      ? '소유 확인이 끝나면 보관 장소에서 물건을 받아 가요.'
                      : '주운 물건은 보관 장소에 맡긴 뒤 습득물로 등록해 주세요.'}
                  </p>
                </li>
                <li>
                  <img src={illustration('Check mark button')} alt="" />
                  <small>STEP 3</small>
                  <h3>해결 완료</h3>
                  <p>물건이 돌아가면 작성자가 상태를 ‘해결 완료’로 바꿔요.</p>
                </li>
              </ol>
            </section>
            {!!others.length && (
              <section className="detail-section related-items">
                <div className="section-title">
                  <h2>다른 물품도 살펴보세요</h2>
                  <Link to="/">전체 보기 →</Link>
                </div>
                <ItemGrid items={others} />
              </section>
            )}
          </>
        )}
      </main>
    </AppLayout>
  )
}
