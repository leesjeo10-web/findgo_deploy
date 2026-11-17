import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
export default function Dialog({
  open,
  title,
  children,
  onClose,
  busy = false,
}) {
  const dialog = useRef(null),
    titleId = useId()
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement,
      element = dialog.current,
      overflow = document.body.style.overflow
    element.showModal()
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
      className="confirm-dialog form-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="form-dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          aria-label="닫기"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>,
    document.body,
  )
}
