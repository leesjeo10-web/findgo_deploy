import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { logo, illustration } from '../../../shared/lib/assets.js'
import '../styles/auth.css'
export default function AuthLayout({
  title,
  description,
  image = 'Locked',
  step,
  children,
}) {
  useEffect(() => {
    document.title = title + ' · 찾Go'
    window.scrollTo(0, 0)
  }, [title])
  return (
    <div className="auth-page">
      <a href="#main-content" className="skip-link">
        본문으로 바로가기
      </a>
      <header className="wrap auth-header">
        <Link to="/" aria-label="찾Go 홈">
          <img src={logo} alt="찾Go" width="102" height="34" />
        </Link>
        <span>우리 학교 분실물 찾기</span>
      </header>
      <main id="main-content" className="wrap auth-shell">
        <aside className="auth-story">
          <small>FIND YOUR THINGS, FIND YOUR DAY</small>
          <h2>
            잃어버린 물건이
            <br />
            다시, <em>나의 품으로.</em>
          </h2>
          <p>
            우리 학교의 작은 관심을 모아
            <br />
            소중한 물건의 주인을 찾아요.
          </p>
          <div className="auth-art">
            <img src={illustration(image)} alt="" width="220" height="220" />
          </div>
          <span>물건을 찾는 가장 가까운 방법, 찾Go</span>
        </aside>
        <section className="auth-content" aria-labelledby="auth-title">
          {step && (
            <ol className="auth-progress" aria-label="첫 로그인 설정">
              <li
                aria-current={step === 1 ? 'step' : undefined}
                className={step >= 1 ? 'active' : ''}
              >
                <span>{step > 1 ? '✓' : '1'}</span>비밀번호 변경
              </li>
              <li
                aria-current={step === 2 ? 'step' : undefined}
                className={step === 2 ? 'active' : ''}
              >
                <span>2</span>전화번호 입력
              </li>
            </ol>
          )}
          <span className="auth-kicker">
            {step ? '처음 한 번만 설정해 주세요' : 'WELCOME TO 찾Go'}
          </span>
          <h1 id="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
        </section>
      </main>
      <footer className="auth-footer">
        찾Go · 학교 안에서 함께 찾는 분실물
      </footer>
    </div>
  )
}
