import { NavLink } from 'react-router-dom'
import AppLayout from '../../../shared/layout/AppLayout.jsx'
import { illustration } from '../../../shared/lib/assets.js'
import '../styles/admin.css'
export default function AdminLayout({ title, description, children, action }) {
  return (
    <AppLayout title={title}>
      <main id="main-content" className="wrap admin-page">
        <div className="admin-heading">
          <div>
            <span className="admin-kicker">TEACHER ADMIN</span>
            <h1>선생님 관리</h1>
            <p>우리 학교의 물품과 학생 계정을 관리해요.</p>
          </div>
          <span className="admin-role">관리자 계정</span>
        </div>
        <nav className="admin-tabs" aria-label="관리 메뉴">
          <NavLink to="/admin/items">물품 관리</NavLink>
          <NavLink to="/admin/students">학생 관리</NavLink>
        </nav>
        <div className="admin-section-heading">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {action || (
            <img
              src={illustration('Card index dividers')}
              alt=""
              width="48"
              height="48"
            />
          )}
        </div>
        {children}
      </main>
    </AppLayout>
  )
}
