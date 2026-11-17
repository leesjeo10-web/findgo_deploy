import { Link } from 'react-router-dom'
import { logo } from '../lib/assets.js'
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <Link to="/" aria-label="찾Go 홈">
          <img src={logo} alt="찾Go" width="78" height="26" />
        </Link>
        <p>경북소프트웨어마이스터고등학교의 분실물·습득물을 한곳에.</p>
        <span>잃어버린 물건과 다시 만나는 곳</span>
      </div>
    </footer>
  )
}
