import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { illustration } from '../../../shared/lib/assets.js'
import { todayLocal } from '../../../shared/lib/date.js'
import Button from '../../../shared/ui/Button.jsx'
import FormField from '../../../shared/ui/FormField.jsx'
import ItemImageInput from './ItemImageInput.jsx'
import ItemPreview from './ItemPreview.jsx'
import { emptyItem, validateItem } from '../model/itemModel.js'
import '../styles/form.css'

export default function ItemForm({
  initialValues,
  initialType,
  onSubmit,
  cancelTo = '/',
  cancelState,
  editing = false,
}) {
  const [values, setValues] = useState(() => ({
    ...emptyItem(initialType),
    ...initialValues,
    storageLocation: initialValues?.storageLocation || '',
  }))
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [submissionId] = useState(() => crypto.randomUUID())
  const submitting = useRef(false)
  const form = useRef(null)
  const found = values.type === 'FOUND'
  const update = (key, value) => {
    setValues((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'type' && value === 'LOST' ? { storageLocation: '' } : {}),
    }))
    setErrors((previous) => ({
      ...previous,
      [key]: '',
      ...(key === 'type' ? { storageLocation: '' } : {}),
    }))
    setFailure('')
  }
  const checkField = (key) =>
    setErrors((previous) => ({
      ...previous,
      [key]: validateItem(values)[key] || '',
    }))
  const fieldProps = (key) => ({
    id: key,
    name: key,
    value: values[key],
    disabled: busy,
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key]
      ? key + '-error'
      : ['lostFoundAt', 'storageLocation'].includes(key)
        ? key + '-hint'
        : undefined,
    onChange: (event) => update(key, event.target.value),
    onBlur: () => checkField(key),
  })
  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current || photoBusy) return
    const nextErrors = validateItem(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || photoError) {
      const first = Object.keys(nextErrors)[0]
      if (first) form.current.elements.namedItem(first)?.focus()
      else document.getElementById('item-photo')?.focus()
      return
    }
    submitting.current = true
    setBusy(true)
    setFailure('')
    try {
      await onSubmit(values, submissionId)
    } catch (error) {
      setFailure(error.message || '저장하지 못했어요. 다시 시도해주세요.')
      if (error.fields) setErrors(error.fields)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }
  return (
    <div className="item-editor">
      <h1 className="sr-only">{editing ? '물품 수정' : '물품 등록'}</h1>
      <div
        className="registration-tabs"
        role="radiogroup"
        aria-label="물품 구분"
      >
        {[
          ['FOUND', 'Package', '습득물'],
          ['LOST', 'Magnifying glass tilted left', '분실물'],
        ].map(([type, image, label]) => (
          <label key={type}>
            <input
              type="radio"
              name="itemType"
              checked={values.type === type}
              disabled={busy}
              onChange={() => update('type', type)}
            />
            <span>
              <img src={illustration(image)} alt="" width="30" height="30" />
              {label} {editing ? '수정' : '등록'}
            </span>
          </label>
        ))}
      </div>
      <div className="editor-layout">
        <form ref={form} onSubmit={submit} noValidate className="item-form">
          {failure && (
            <p className="form-alert" role="alert">
              {failure} 입력한 내용은 그대로 남아 있어요.
            </p>
          )}
          {editing && (
            <section className="form-group">
              <h2>상태</h2>
              <div
                className="status-options"
                role="radiogroup"
                aria-label="물품 상태"
              >
                {[
                  ['OPEN', '찾는 중', '아직 주인을 찾고 있어요'],
                  ['RESOLVED', '해결 완료', '물건이 주인에게 돌아갔어요'],
                ].map(([status, title, description]) => (
                  <label key={status}>
                    <input
                      type="radio"
                      name="itemStatus"
                      checked={values.status === status}
                      disabled={busy}
                      onChange={() => update('status', status)}
                    />
                    <span>
                      <b>{title}</b>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}
          <section className="form-group">
            <h2>
              사진 <small>선택</small>
            </h2>
            <ItemImageInput
              value={values.imageBlob}
              disabled={busy}
              onChange={(value) => update('imageBlob', value)}
              error={photoError || errors.imageBlob}
              onError={setPhotoError}
              onBusyChange={setPhotoBusy}
            />
          </section>
          <section className="form-group">
            <h2>물품 정보</h2>
            <FormField
              id="name"
              label={found ? '습득물 명' : '분실물 명'}
              required
              count={values.name.length + '/100'}
              error={errors.name}
            >
              <input
                {...fieldProps('name')}
                maxLength={120}
                placeholder="예: 에어팟 프로, 남색 지갑"
                required
              />
            </FormField>
            <FormField
              id="description"
              label="특징·상세 설명"
              required
              count={values.description.length + '/2000'}
              error={errors.description}
            >
              <textarea
                {...fieldProps('description')}
                maxLength={2100}
                placeholder="색상, 브랜드, 스티커처럼 주인만 알 만한 특징을 적어 주세요"
                required
                onInput={(event) => {
                  event.currentTarget.style.height = 'auto'
                  event.currentTarget.style.height =
                    Math.min(event.currentTarget.scrollHeight + 3, 360) + 'px'
                }}
              />
            </FormField>
            <div className="form-two">
              <FormField
                id="location"
                label={found ? '습득 장소' : '분실 장소'}
                required
                error={errors.location}
              >
                <input
                  {...fieldProps('location')}
                  maxLength={120}
                  placeholder="예: 급식실, 기숙사 3층 휴게실"
                  required
                />
              </FormField>
              <FormField
                id="lostFoundAt"
                label={found ? '습득 날짜' : '분실 날짜'}
                required
                error={errors.lostFoundAt}
                hint="오늘 이후 날짜는 고를 수 없어요"
              >
                <input
                  {...fieldProps('lostFoundAt')}
                  type="date"
                  max={todayLocal()}
                  required
                />
              </FormField>
            </div>
            {found && (
              <FormField
                id="storageLocation"
                label="보관 장소"
                required
                error={errors.storageLocation}
                hint="물건을 맡겨 둔 곳을 적어 주세요. 찾는 학생이 바로 갈 수 있어요."
              >
                <input
                  {...fieldProps('storageLocation')}
                  maxLength={120}
                  placeholder="예: 학생부실, 행정실"
                  required
                />
              </FormField>
            )}
          </section>
          <div className="form-actions">
            {busy ? (
              <Button variant="outline" disabled>
                취소
              </Button>
            ) : (
              <Link
                to={cancelTo}
                state={cancelState}
                className="button button--outline"
              >
                취소
              </Link>
            )}
            <Button type="submit" loading={busy} disabled={photoBusy}>
              {busy
                ? editing
                  ? '수정 중...'
                  : '등록 중...'
                : editing
                  ? '수정하기'
                  : '등록하기'}
            </Button>
          </div>
        </form>
        <ItemPreview item={values} />
      </div>
    </div>
  )
}
