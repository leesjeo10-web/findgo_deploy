import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../model/authContext.js'
import { nextAuthPath, validateLogin } from '../model/authModel.js'
import FormField from '../../../shared/ui/FormField.jsx'
import Button from '../../../shared/ui/Button.jsx'
import PasswordInput from './PasswordInput.jsx'
export default function LoginForm() {
  const { signIn } = useAuth(),
    navigate = useNavigate(),
    lock = useRef(false)
  const [values, setValues] = useState({ loginId: '', password: '' }),
    [errors, setErrors] = useState({}),
    [failure, setFailure] = useState(''),
    [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const fields = validateLogin(values)
    setErrors(fields)
    setFailure('')
    if (Object.keys(fields).length)
      return document.getElementById(Object.keys(fields)[0])?.focus()
    lock.current = true
    setBusy(true)
    try {
      const user = await signIn(values)
      setValues({ loginId: '', password: '' })
      navigate(nextAuthPath(user), { replace: true })
    } catch (error) {
      setFailure(error.message)
      setValues((previous) => ({ ...previous, password: '' }))
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <FormField id="loginId" label="아이디" error={errors.loginId}>
        <input
          id="loginId"
          name="username"
          autoComplete="username"
          required
          disabled={busy}
          placeholder="지급받은 아이디를 입력해 주세요"
          value={values.loginId}
          maxLength={4}
          inputMode="numeric"
          aria-invalid={!!errors.loginId}
          aria-describedby={errors.loginId ? 'loginId-error' : undefined}
          onChange={(event) =>
            setValues({ ...values, loginId: event.target.value })
          }
        />
      </FormField>
      <FormField id="password" label="비밀번호" error={errors.password}>
        <PasswordInput
          id="password"
          label="비밀번호"
          name="password"
          autoComplete="current-password"
          required
          disabled={busy}
          placeholder="비밀번호를 입력해 주세요"
          value={values.password}
          maxLength={64}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          onChange={(event) =>
            setValues({ ...values, password: event.target.value })
          }
        />
      </FormField>
      {failure && (
        <p className="form-alert" role="alert">
          {failure}
        </p>
      )}
      <Button type="submit" loading={busy} className="button--full">
        {busy ? '로그인 중...' : '로그인'}
      </Button>
      <p className="auth-help">
        아이디나 비밀번호를 잊으셨나요?
        <br />
        담당 선생님에게 문의해 주세요.
      </p>
    </form>
  )
}
