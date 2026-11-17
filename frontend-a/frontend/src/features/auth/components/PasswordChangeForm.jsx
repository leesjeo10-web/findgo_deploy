import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../model/authContext.js'
import { nextAuthPath, validatePassword } from '../model/authModel.js'
import FormField from '../../../shared/ui/FormField.jsx'
import Button from '../../../shared/ui/Button.jsx'
import { useToast } from '../../../shared/ui/Toast.jsx'
import PasswordInput from './PasswordInput.jsx'
export default function PasswordChangeForm() {
  const { changePassword } = useAuth(),
    navigate = useNavigate(),
    notify = useToast(),
    lock = useRef(false)
  const [values, setValues] = useState({
      currentPassword: '',
      newPassword: '',
      confirmation: '',
    }),
    [errors, setErrors] = useState({}),
    [failure, setFailure] = useState(''),
    [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const fields = validatePassword(values)
    setErrors(fields)
    if (Object.keys(fields).length)
      return document.getElementById(Object.keys(fields)[0])?.focus()
    lock.current = true
    setBusy(true)
    setFailure('')
    try {
      const next = await changePassword(values)
      setValues({ currentPassword: '', newPassword: '', confirmation: '' })
      notify('비밀번호를 변경했어요.')
      navigate(nextAuthPath(next), { replace: true })
    } catch (error) {
      setFailure(error.message)
      if (error.fields) setErrors(error.fields)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <form className="auth-form" noValidate onSubmit={submit}>
      {[
        [
          'currentPassword',
          '현재 비밀번호',
          '처음 받은 비밀번호를 입력해 주세요',
        ],
        ['newPassword', '새 비밀번호', '8~64자의 새 비밀번호'],
        [
          'confirmation',
          '새 비밀번호 확인',
          '새 비밀번호를 한 번 더 입력해 주세요',
        ],
      ].map(([key, label, placeholder]) => (
        <FormField key={key} id={key} label={label} error={errors[key]}>
          <PasswordInput
            id={key}
            label={label}
            required
            name={key}
            maxLength={64}
            autoComplete={
              key === 'currentPassword' ? 'current-password' : 'new-password'
            }
            disabled={busy}
            placeholder={placeholder}
            value={values[key]}
            aria-invalid={!!errors[key]}
            aria-describedby={errors[key] ? key + '-error' : undefined}
            onChange={(event) => {
              setValues({ ...values, [key]: event.target.value })
              setErrors({ ...errors, [key]: '' })
            }}
            onBlur={() =>
              setErrors((previous) => ({
                ...previous,
                [key]: validatePassword(values)[key],
              }))
            }
          />
        </FormField>
      ))}
      <p className="auth-field-note">
        현재 비밀번호와 다른 8~64자의 비밀번호로 설정해 주세요.
      </p>
      {failure && (
        <p className="form-alert" role="alert">
          {failure}
        </p>
      )}
      <Button type="submit" loading={busy} className="button--full">
        {busy ? '변경 중...' : '비밀번호 변경하기'}
      </Button>
    </form>
  )
}
