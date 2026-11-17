import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { illustration } from '../../../shared/lib/assets.js'
const slides = [
  {
    title: (
      <>
        잃어버린 물건,
        <br />
        채팅방 말고 여기서 찾아요
      </>
    ),
    description:
      '여러 채팅방을 훑어보지 않아도 돼요. 등록된 물품을 한곳에서 찾아보세요.',
    image: 'Magnifying glass tilted left',
    label: '물품 둘러보기',
    to: '/#list',
  },
  {
    title: (
      <>
        주운 물건,
        <br />한 번만 올리면 돼요
      </>
    ),
    description:
      '사진과 보관 장소를 함께 적어 주세요. 물건을 찾는 데 큰 도움이 돼요.',
    image: 'Package',
    label: '습득물 등록하기',
    to: '/items/new?type=FOUND',
  },
  {
    title: (
      <>
        주인을 찾았다면
        <br />
        ‘해결 완료’로 바꿔 주세요
      </>
    ),
    description: '물건이 돌아갔다면 내 물품에서 상태를 바꿔 주세요.',
    image: 'Check mark button',
    label: '내 물품 확인하기',
    to: '/mypage',
  },
]
export default function HomeBanner() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [interacting, setInteracting] = useState(false)
  useEffect(() => {
    if (paused || interacting) return
    const timer = setInterval(
      () => setIndex((value) => (value + 1) % slides.length),
      6500,
    )
    return () => clearInterval(timer)
  }, [paused, interacting])
  return (
    <section
      className="home-banner"
      aria-roledescription="carousel"
      aria-label="찾Go 안내"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(false)
      }}
    >
      <div aria-live={paused ? 'polite' : 'off'}>
        {slides.map((slide, position) => (
          <div
            className="banner-slide"
            key={slide.image}
            hidden={position !== index}
            aria-roledescription="slide"
            aria-label={position + 1 + ' / 3'}
          >
            <div className="banner-copy">
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              {position === 0 ? (
                <a
                  className="button button--primary button--small"
                  href="#list"
                >
                  {slide.label} →
                </a>
              ) : (
                <Link
                  className="button button--primary button--small"
                  to={slide.to}
                >
                  {slide.label} →
                </Link>
              )}
            </div>
            <div className="banner-art" aria-hidden="true">
              <img
                src={illustration(slide.image)}
                alt=""
                width="230"
                height="230"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="banner-controls">
        {slides.map((slide, position) => (
          <button
            key={slide.image}
            type="button"
            className="banner-dot"
            aria-label={position + 1 + '번 배너'}
            aria-current={position === index ? 'true' : undefined}
            onClick={() => {
              setIndex(position)
              setPaused(true)
            }}
          />
        ))}
        <button
          type="button"
          className="banner-pause"
          aria-label={paused ? '배너 자동 넘김 시작' : '배너 자동 넘김 멈춤'}
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? '▶' : 'Ⅱ'}
        </button>
        <span>{index + 1} / 3</span>
      </div>
    </section>
  )
}
