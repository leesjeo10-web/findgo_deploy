import { Link } from 'react-router-dom'
import { illustration } from '../../../shared/lib/assets.js'
import Button from '../../../shared/ui/Button.jsx'
const links = [
  ['Package', '습득물 등록', '/items/new?type=FOUND'],
  ['Magnifying glass tilted left', '분실물 등록', '/items/new?type=LOST'],
  ['Card index dividers', '물품 조회', '/#list'],
  ['Bust in silhouette', '내 물품', '/mypage'],
]
export default function AccountPanel() {
  return (
    <aside className="account-panel" aria-label="물품 바로가기">
      <div className="panel-intro">
        <p>
          찾는 물건이 있나요?
          <br />
          주운 물건이 있다면 알려 주세요
        </p>
        <Button to="/items/new" className="button--full">
          물품 등록하기
        </Button>
        <span>
          내가 등록한 물품은
          <br />내 물품에서 확인하고 관리할 수 있어요.
        </span>
      </div>
      <nav className="quick-links" aria-label="바로가기">
        {links.map(([image, label, to]) => (
          <Link
            to={to}
            key={label}
            onClick={() => {
              if (to.endsWith('#list'))
                document
                  .getElementById('list')
                  ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <img src={illustration(image)} alt="" width="36" height="36" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
