import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { errorMessage, isDemo } from '../../api/http';

export default function Login({ signup = false }) {
  const user = useAuthStore(state => state.user);
  const authenticate = useAuthStore(state => state.authenticate);
  const notify = useUIStore(state => state.notify);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || '/';
  if (user) return <Navigate to={destination} replace />;
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(data);
    values.email = values.email.trim();
    if (signup) values.name = values.name.trim();
    if ((signup && !values.name) || !values.email) { setError('입력 내용을 확인해 주세요.'); return; }
    setBusy(true); setError('');
    try {
      await authenticate(signup ? 'signup' : 'login', values);
      notify(signup ? '가입이 완료됐어요. 찾Go에 오신 것을 환영해요.' : '반가워요! 로그인이 완료됐어요.');
      navigate(destination, { replace: true });
    } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  const form = <section className={`auth-form ${signup ? 'signup-form' : ''}`} aria-labelledby="auth-title">
    <div className="auth-title"><h1 id="auth-title">{signup ? <>찾Go와 함께<br />물건의 주인을 찾아요</> : <>반가워요!<br />찾Go에 로그인해 주세요</>}</h1>
      <p>{signup ? '이메일로 간단하게 시작할 수 있어요.' : '내 물건을 등록하고 관리할 수 있어요.'}</p></div>
    <form onSubmit={submit} className="flex flex-col gap-6">
      {signup && <Input label="이름" name="name" placeholder="이름을 입력해 주세요" autoComplete="name" required maxLength={30} />}
      <Input label="이메일" type="email" name="email" placeholder="이메일을 입력해 주세요" autoComplete="email" required maxLength={254} />
      <Input label="비밀번호" type="password" name="password" placeholder="비밀번호를 입력해 주세요" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : 1} maxLength={128} />
      {signup && <p className="-mt-4 text-xs text-muted">비밀번호는 8자 이상으로 입력해 주세요.</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <Button type="submit" loading={busy}>{signup ? '회원가입' : '로그인'}</Button>
    </form>
    {signup ? <Link className="text-link text-sm" to="/login" state={location.state}>이미 계정이 있나요? 로그인</Link> : <>
      <p className="signup-prompt">아직 계정이 없나요? <Link className="text-link" to="/signup" state={location.state}>회원가입</Link></p>
      <hr /><Button to="/" variant="neutral">로그인 없이 둘러보기</Button>
    </>}
    {isDemo && <p className="demo-note">데모 모드 · 실제 계정 인증 없이 화면을 체험할 수 있어요.<br />입력한 비밀번호는 저장하거나 전송하지 않아요.</p>}
  </section>;
  return <><Header auth signup={signup} />{signup ? <main className="signup-layout">{form}</main> : <main className="login-layout">
    <section className="welcome-panel"><span className="badge">우리 학교</span><h2>잃어버린 물건과<br />다시 만나는 곳</h2>
      <p>찾Go에서 우리 학교의 분실물과 습득물을<br className="hidden sm:block" /> 한곳에서 확인해 보세요.</p>
      <div className="welcome-art"><img src="/assets/1e96b.svg" alt="위치 표시와 함께 놓인 지갑 일러스트" /></div>
      <p className="welcome-footnote">작은 관심이 누군가의 하루를 돌려줘요.</p>
    </section>{form}
  </main>}</>;
}
