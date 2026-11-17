import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
export default function AppLayout({
  children,
  search,
  footer = false,
  title = '찾Go',
}) {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = title === '찾Go' ? title : title + ' · 찾Go'
  }, [title])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <>
      <a href="#main-content" className="skip-link">
        본문으로 바로가기
      </a>
      <Header search={search} />
      {children}
      {footer && <Footer />}
    </>
  )
}
