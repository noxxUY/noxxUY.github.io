
let cleanup: (() => void) | null = null

export function destroyHome() {
  cleanup?.()
  cleanup = null
}

export function initHome() {
  destroyHome()
  const stops: (() => void)[] = []

  stops.push(startReveal())
  stops.push(startSectionMarker())

  cleanup = () => {
    for (const stop of stops) stop()
  }
}

function startReveal() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (!targets.length) return () => {}
  const moves = matchMedia('(prefers-reduced-motion: no-preference)').matches
  if (!moves || !('IntersectionObserver' in window)) return () => {}

  for (const el of targets) el.classList.add('waiting')

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        el.classList.add('here')
        io.unobserve(el)
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  for (const el of targets) io.observe(el)

  const rescue = window.setTimeout(() => {
    for (const el of targets) el.classList.add('here')
  }, 4000)

  return () => {
    io.disconnect()
    window.clearTimeout(rescue)
    for (const el of targets) el.classList.remove('waiting', 'here')
  }
}

function startSectionMarker() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-section-link]'))
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
  if (!links.length || !sections.length) return () => {}

  let current: string | null = null
  let pinned: string | null = null
  let pinTimer = 0

  const mark = (id: string) => {
    if (id === current) return
    current = id
    for (const link of links) {
      const on = link.dataset.sectionLink === id
      link.classList.toggle('is-on', on)
      if (on) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    }
  }

  const pick = () => {
    if (pinned) return mark(pinned)
    const line = innerHeight * 0.32
    let id = sections[0].id
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) id = section.id
    }
    mark(id)
  }

  const onClick = (e: Event) => {
    const link = (e.target as Element | null)?.closest?.('[data-section-link]') as HTMLElement | null
    if (!link?.dataset.sectionLink) return
    pinned = link.dataset.sectionLink
    mark(pinned)
    window.clearTimeout(pinTimer)
    pinTimer = window.setTimeout(() => {
      pinned = null
      pick()
    }, 1200)
  }

  pick()
  addEventListener('scroll', pick, { passive: true })
  addEventListener('resize', pick)
  document.addEventListener('click', onClick)
  return () => {
    removeEventListener('scroll', pick)
    removeEventListener('resize', pick)
    document.removeEventListener('click', onClick)
    window.clearTimeout(pinTimer)
  }
}
