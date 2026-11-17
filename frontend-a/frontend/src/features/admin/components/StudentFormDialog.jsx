import { useRef, useState } from 'react'
import Dialog from '../../../shared/ui/Dialog.jsx'
import FormField from '../../../shared/ui/FormField.jsx'
import Button from '../../../shared/ui/Button.jsx'
import { createStudent, validateStudent } from '../api/adminRepository.js'
export const initialPassword = () =>
  crypto.randomUUID().replaceAll('-', '').slice(0, 14)
export default function StudentFormDialog({ onClose, onCreated }) {
  const [values, setValues] = useState(() => ({
      loginId: '',
      name: '',
      password: initialPassword(),
    })),
    [errors, setErrors] = useState({}),
    [failure, setFailure] = useState(''),
    [busy, setBusy] = useState(false)
  const lock = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const fields = validateStudent(values)
    setErrors(fields)
    if (Object.keys(fields).length)
      return document
        .getElementById('student-' + Object.keys(fields)[0])
        ?.focus()
    lock.current = true
    setBusy(true)
    setFailure('')
    try {
      const student = await createStudent(values)
      onCreated({
        loginId: student.loginId,
        name: student.name,
        password: values.password,
      })
    } catch (error) {
      setFailure(error.message)
      if (error.fields) setErrors(error.fields)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <Dialog open title="학생 계정 추가" onClose={onClose} busy={busy}>
      <p className="dialog-description">
        학생에게 지급할 계정을 만들어요. 첫 로그인 시 비밀번호 변경과 전화번호
        입력이 필요해요.
      </p>
      <form className="student-form" noValidate onSubmit={submit}>
        {[
          ['loginId', '학생 아이디', '예: 261101'],
          ['name', '학생 이름', '이름을 입력해 주세요'],
          ['password', '초기 비밀번호', '8~64자 초기 비밀번호'],
        ].map(([key, label, placeholder]) => (
          <FormField
            key={key}
            id={'student-' + key}
            label={label}
            required
            error={errors[key]}
          >
            <input
              id={'student-' + key}
              name={key}
              autoComplete="off"
              inputMode={key === 'loginId' ? 'numeric' : undefined}
              maxLength={key === 'loginId' ? 6 : key === 'name' ? 40 : 64}
              value={values[key]}
              placeholder={placeholder}
              disabled={busy}
              required
              aria-invalid={!!errors[key]}
              aria-describedby={
                errors[key] ? 'student-' + key + '-error' : undefined
              }
              onChange={(event) => {
                setValues({ ...values, [key]: event.target.value })
                setErrors({ ...errors, [key]: '' })
              }}
            />
          </FormField>
        ))}
        <button
          className="text-button"
          type="button"
          disabled={busy}
          onClick={() => setValues({ ...values, password: initialPassword() })}
        >
          초기 비밀번호 다시 생성
        </button>
        {failure && (
          <p className="form-alert" role="alert">
            {failure}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            취소
          </Button>
          <Button type="submit" loading={busy}>
            {busy ? '추가 중...' : '계정 추가'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
