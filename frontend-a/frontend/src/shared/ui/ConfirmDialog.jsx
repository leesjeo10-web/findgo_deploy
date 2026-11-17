import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button.jsx'
export default function ConfirmDialog({
  open,
  title,
  children,
  onClose,
  onConfirm,
  busy = false,
  error,
  confirmLabel = '삭제하기',
  confirmVariant = 'danger-solid',
  busyLabel = '삭제 중...',
}) {
  const dialog = useRef(null)
  const cancel = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  useEffect(() => {
    if (!open) return
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    cancel.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])
  if (!open) return null
  return createPortal(
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <div id={descriptionId} className="dialog-description">
        {children}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error.message}
        </p>
      )}
      <div className="dialog-actions">
        <button
          ref={cancel}
          className="button button--outline"
          disabled={busy}
          type="button"
          onClick={onClose}
        >
          취소
        </button>
        <Button variant={confirmVariant} loading={busy} onClick={onConfirm}>
          {busy ? busyLabel : confirmLabel}
        </Button>
      </div>
    </dialog>,
    document.body,
  )
}
