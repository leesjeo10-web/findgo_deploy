import { useEffect, useState } from 'react'
import { illustration } from '../../../shared/lib/assets.js'
function BlobImage({ blob, alt, ...props }) {
  const [source, setSource] = useState('')
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    setSource(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])
  return source ? <img {...props} src={source} alt={alt} /> : null
}
export default function ItemImage({
  item,
  className = '',
  decorative = false,
}) {
  const [failed, setFailed] = useState(false)
  const blob = item.imageBlob
  const source = item.imageUrl
  useEffect(() => {
    setFailed(false)
  }, [blob, source])
  const hasPhoto = (blob || source) && !failed
  return (
    <div
      className={
        'item-image ' +
        (hasPhoto ? 'item-image--photo ' : 'item-image--empty ') +
        className
      }
      aria-hidden={decorative || undefined}
    >
      {hasPhoto ? (
        blob ? (
          <BlobImage
            blob={blob}
            alt={decorative ? '' : item.name + ' 사진'}
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={source}
            alt={decorative ? '' : item.name + ' 사진'}
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <>
          <img src={illustration('Package')} alt="" width="72" height="72" />
          <span>
            {failed ? '사진을 불러올 수 없어요' : '등록된 사진이 없어요'}
          </span>
        </>
      )}
    </div>
  )
}
