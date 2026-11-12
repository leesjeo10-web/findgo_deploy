import { useEffect, useRef, useState } from 'react'
import { illustration } from '../../../shared/lib/assets.js'
import { IMAGE_ERROR } from '../model/itemModel.js'
import { validateImageFile } from '../model/imageFile.js'
import ItemImage from './ItemImage.jsx'
import Button from '../../../shared/ui/Button.jsx'

export default function ItemImageInput({
  value,
  onChange,
  error,
  onError,
  onBusyChange,
  disabled,
}) {
  const input = useRef(null)
  const active = useRef(true)
  const selecting = useRef(false)
  const [over, setOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const select = async (files) => {
    if (disabled || selecting.current) return
    if (files.length !== 1) {
      onError(IMAGE_ERROR)
      return
    }
    selecting.current = true
    setProcessing(true)
    onBusyChange(true)
    try {
      await validateImageFile(files[0])
      if (active.current) {
        onChange(files[0])
        onError('')
      }
    } catch (failure) {
      if (active.current) onError(failure.message)
    } finally {
      selecting.current = false
      if (active.current) {
        setProcessing(false)
        onBusyChange(false)
      }
    }
  }
  return (
    <div>
      <div
        className={
          'image-drop' +
          (over ? ' image-drop--over' : '') +
          (error ? ' image-drop--error' : '')
        }
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setOver(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOver(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          if (event.dataTransfer.files.length) select(event.dataTransfer.files)
        }}
      >
        <div className="upload-thumbnail">
          {value ? (
            <ItemImage item={{ name: '선택한', imageBlob: value }} decorative />
          ) : (
            <img
              src={illustration('Framed picture')}
              alt=""
              width="40"
              height="40"
            />
          )}
        </div>
        <div className="upload-copy">
          <b>
            {processing
              ? '사진을 확인하는 중이에요'
              : value
                ? value.name || '선택한 사진'
                : '사진을 끌어 놓거나 파일에서 선택하세요'}
          </b>
          <small>JPG/PNG, 5MB 이하 사진 1장</small>
          <div className="upload-actions">
            <Button
              variant="outline"
              size="small"
              disabled={disabled || processing}
              onClick={() => input.current.click()}
            >
              파일에서 선택하기
            </Button>
            {value && (
              <Button
                variant="danger"
                size="small"
                disabled={disabled || processing}
                onClick={() => {
                  onChange(null)
                  onError('')
                  input.current.value = ''
                }}
              >
                사진 삭제
              </Button>
            )}
          </div>
        </div>
        <input
          ref={input}
          id="item-photo"
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png"
          disabled={disabled || processing}
          aria-label="물품 사진"
          aria-describedby={error ? 'photo-error' : undefined}
          onChange={(event) => {
            const files = [...event.target.files]
            event.target.value = ''
            if (files.length) select(files)
          }}
        />
      </div>
      {error && (
        <p className="field-error" id="photo-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
