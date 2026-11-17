import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../model/authContext.js'
import { formatPhone, validPhone } from '../model/authModel.js'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../../../shared/ui/FormField.jsx'
import Button from '../../../shared/ui/Button.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'
export default function PhoneSetupPage() {
  const { user, savePhone, signOut } = useAuth(),
    navigate = useNavigate(),
    notify = useToast(),
    lock = useRef(false)
  const [officePhone, setOfficePhone] = useState(user.officePhone || '')
  const [phone, setPhone] = useState(user.phone || ''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  if (user.role !== 'ADMIN' && user.mustChangePassword) return <Navigate to="/auth/password" replace />
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    if (!validPhone(phone)) {
      setError('010으로 시작하는 휴대전화 번호 11자리를 입력해 주세요.')
      document.getElementById('phone')?.focus()
      return
    }
    lock.current = true
    setBusy(true)
    try {
      await savePhone(phone, user.role === 'ADMIN' ? officePhone : undefined)
      notify('연락처를 저장했어요. 찾Go를 시작해 보세요.')
      navigate('/', { replace: true })
    } catch (failure) {
      setError(failure.message)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <AuthLayout
      title={user.phone ? '연락처 수정' : '전화번호를 입력해 주세요'}
      description="물품을 찾거나 돌려드릴 때 연락할 수 있는 번호를 알려주세요."
      image="Speech balloon"
      step={user.phone ? undefined : 2}
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormField
          id="phone"
          label="휴대전화 번호"
          required
          error={error}
          hint="숫자만 입력하면 하이픈(-)이 자동으로 들어가요."
        >
          <input
            id="phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="010-0000-0000"
            maxLength={13}
            required
            disabled={busy}
            value={phone}
            aria-invalid={!!error}
            aria-describedby={error ? 'phone-error phone-hint' : 'phone-hint'}
            onChange={(event) => {
              setPhone(formatPhone(event.target.value))
              setError('')
            }}
          />
        </FormField>
        {user.role === 'ADMIN' && <FormField id="officePhone" label="교무실 번호" required><input id="officePhone" type="tel" value={officePhone} required disabled={busy} placeholder="02-123-4567" onChange={event => setOfficePhone(event.target.value)} /></FormField>}
        <div className="auth-info">
          <strong>물품 연락을 위해 사용해요</strong>
          <p>
            내 게시물의 작성자 연락처로 표시돼요.
            <br />
            연락처는 언제든 내 정보에서 수정할 수 있어요.
          </p>
        </div>
        <Button type="submit" loading={busy} className="button--full">
          {busy ? '저장 중...' : user.phone ? '연락처 저장' : '찾Go 시작하기'}
        </Button>
      </form>
      {user.phone && (
        <Button to="/mypage" variant="outline" className="auth-cancel">
          돌아가기
        </Button>
      )}
      <button
        className="auth-signout"
        type="button"
        onClick={() => signOut().catch(() => {})}
      >
        로그아웃
      </button>
    </AuthLayout>
  )
}
