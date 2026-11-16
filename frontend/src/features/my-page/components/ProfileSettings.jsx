import { useEffect, useRef, useState } from 'react';
import { getCurrentUser } from '../../../shared/api/currentUser.js';
import { changePassword, updateContact } from '../api/profileApi.js';
import { validateContact, validatePassword } from '../model/profileValidation.js';
import Button from '../../../shared/ui/Button.jsx';
import FormField from '../../../shared/ui/FormField.jsx';
import LoadingState from '../../../shared/ui/LoadingState.jsx';
import '../styles/profile-settings.css';
const emptyPassword = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};
export default function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [contact, setContact] = useState({
    phone: '',
    officePhone: ''
  });
  const [password, setPassword] = useState(emptyPassword);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({});
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState('');
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    getCurrentUser().then(value => {
      if (active) {
        setUser(value);
        setContact({
          phone: value.phone || '',
          officePhone: value.officePhone || ''
        });
        setNotice({});
      }
    }).catch(error => {
      if (active) setNotice({
        loadError: error.message
      });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [revision]);
  const publish = value => {
    setUser(value);
    // A는 이 이벤트 또는 자신의 사용자 상태 갱신 함수로 인증 정보를 동기화한다.
    window.dispatchEvent(new CustomEvent('finder:user-updated', {
      detail: value
    }));
  };
  const submitContact = async event => {
    event.preventDefault();
    if (submitting.current) return;
    const next = validateContact(contact, user.role);
    setErrors(next);
    setNotice({});
    if (Object.keys(next).length) return;
    submitting.current = true;
    setBusy('contact');
    try {
      const value = await updateContact({
        phone: contact.phone,
        ...(user.role === 'ADMIN' ? {
          officePhone: contact.officePhone
        } : {})
      });
      publish(value);
      setContact({
        phone: value.phone || '',
        officePhone: value.officePhone || ''
      });
      setNotice({
        success: '연락처를 수정했어요.'
      });
    } catch (error) {
      setNotice({
        error: error.message
      });
    } finally {
      submitting.current = false;
      setBusy('');
    }
  };
  const submitPassword = async event => {
    event.preventDefault();
    if (submitting.current) return;
    const next = validatePassword(password);
    setErrors(next);
    setNotice({});
    if (Object.keys(next).length) return;
    submitting.current = true;
    setBusy('password');
    try {
      await changePassword(password);
      // 서버가 204를 반환하므로 mustChangePassword를 임의로 추측하지 않고 다시 조회한다.
      setPassword(emptyPassword);
      try {
        publish(await getCurrentUser());
        setNotice({
          success: '비밀번호를 변경했어요.'
        });
      } catch (error) {
        setNotice({
          error: '비밀번호는 변경됐지만 계정 정보를 다시 확인하지 못했어요. ' + error.message
        });
      }
    } catch (error) {
      setNotice({
        error: error.message
      });
    } finally {
      submitting.current = false;
      setBusy('');
    }
  };
  if (loading) return <LoadingState />;
  if (notice.loadError) return <section className="profile-settings"><p role="alert">{notice.loadError}</p><Button onClick={() => setRevision(value => value + 1)}>내 정보 다시 불러오기</Button></section>;
  if (!user) return null;
  const field = (name, label, type = 'text') => {
    const isPassword = type === 'password';
    const value = isPassword ? password[name] : contact[name];
    return <FormField id={'profile-' + name} label={label} required error={errors[name]}>
      <input id={'profile-' + name} name={name} type={type} value={value} disabled={!!busy} required autoComplete={isPassword ? name === 'currentPassword' ? 'current-password' : 'new-password' : 'tel'} maxLength={isPassword ? 64 : 20} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? 'profile-' + name + '-error' : undefined} onChange={event => {
        const value = event.target.value;
        (isPassword ? setPassword : setContact)(previous => ({
          ...previous,
          [name]: value
        }));
        setErrors(previous => ({
          ...previous,
          [name]: ''
        }));
        setNotice({});
      }} />
    </FormField>;
  };
  return <section className="profile-settings" aria-labelledby="profile-settings-title">
    <h2 id="profile-settings-title">내 정보 설정</h2>
    <p>{user.name} · {user.loginId}</p>
    {notice.error && <p role="alert">{notice.error}</p>}
    {notice.success && <p role="status">{notice.success}</p>}
    <div className="profile-settings-grid">
      <form onSubmit={submitContact} noValidate>
        <h3>연락처 수정</h3><p>휴대전화 번호는 삭제할 수 없고 수정만 가능해요.</p>
        {field('phone', '휴대전화 번호', 'tel')}
        {user.role === 'ADMIN' && field('officePhone', '교무실 번호', 'tel')}
        <Button type="submit" loading={busy === 'contact'} disabled={!!busy}>연락처 저장</Button>
      </form>
      {user.role !== 'ADMIN' ? <form onSubmit={submitPassword} noValidate>
        <h3>비밀번호 변경</h3>
        {field('currentPassword', '현재 비밀번호', 'password')}
        {field('newPassword', '새 비밀번호 (8~64자)', 'password')}
        {field('confirmPassword', '새 비밀번호 확인', 'password')}
        <Button type="submit" loading={busy === 'password'} disabled={!!busy}>비밀번호 변경</Button>
      </form> : <p>관리자 계정의 비밀번호는 이 화면에서 변경할 수 없어요.</p>}
    </div>
  </section>;
}
