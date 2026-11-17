import { useState } from 'react'
export default function PasswordInput({ label, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="auth-password">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        aria-label={label + (visible ? ' 숨기기' : ' 보기')}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible(!visible)}
      >
        {visible ? '숨김' : '보기'}
      </button>
    </div>
  )
}
