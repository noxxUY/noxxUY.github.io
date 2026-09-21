
const GH_KEY = 'noxx-gh-activity'
const GH_TTL = 10 * 60 * 1000

let cleanup: (() => void) | null = null

export function destroyHome() {
  cleanup?.()
  cleanup = null
}

export function initHome() {
  destroyHome()
  const stops: (() => void)[] = []

  stops.push(startClock())
  stops.push(startLive())
  stops.push(startDumpPointer())
  stops.push(startReveal())
  stops.push(startSectionMarker())

  cleanup = () => {
    for (const stop of stops) stop()
  }
}

const lang = (): 'en' | 'es' => (document.documentElement.lang === 'es' ? 'es' : 'en')

function startClock() {
  const el = document.querySelector<HTMLElement>('[data-clock]')
  if (!el) return () => {}
  const tz = el.dataset.clock || 'UTC'
  let fmt: Intl.DateTimeFormat
  try {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return () => {}
  }
  const tick = () => {
    el.textContent = ` · ${fmt.format(new Date())}`
  }
  tick()
  const id = window.setInterval(tick, 1000)
  return () => window.clearInterval(id)
}

interface GhEvent {
  type?: string
  created_at?: string
  repo?: { name?: string }
  payload?: {
    size?: number
    commits?: unknown[]
    action?: string
    ref_type?: string
    release?: { tag_name?: string }
  }
}

function startLive() {
  const el = document.querySelector<HTMLElement>('[data-live]')
  if (!el || typeof fetch !== 'function') return () => {}

  const handle = el.dataset.handle || ''
  if (!handle) return () => {}

  const nowEl = document.querySelector<HTMLElement>('[data-now]')
  let dead = false
  let latest: GhEvent | null = null

  const labels = (): Record<string, string> => {
    try {
      return JSON.parse((lang() === 'es' ? el.dataset.labelsEs : el.dataset.labelsEn) || '{}')
    } catch {
      return {}
    }
  }

  const ago = (iso: string) => {
    const seconds = (Date.now() - new Date(iso).getTime()) / 1000
    const rtf = new Intl.RelativeTimeFormat(lang(), { numeric: 'auto' })
    const steps: [number, Intl.RelativeTimeFormatUnit, number][] = [
      [60, 'second', 1],
      [3600, 'minute', 60],
      [86400, 'hour', 3600],
      [2592000, 'day', 86400],
      [31536000, 'month', 2592000],
    ]
    for (const [limit, unit, divisor] of steps) {
      if (seconds < limit) return rtf.format(-Math.round(seconds / divisor), unit)
    }
    return rtf.format(-Math.round(seconds / 31536000), 'year')
  }

  const fill = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_m, name) => String(vars[name] ?? ''))

  const describe = (ev: GhEvent) => {
    const dict = labels()
    const repo = ev.repo?.name?.split('/')[1] ?? ''
    const p = ev.payload ?? {}
    const pick = (key: string, vars: Record<string, string | number> = { repo }) => fill(dict[key] || '', vars)
    switch (ev.type) {
      case 'PushEvent': {
        const n = p.size ?? p.commits?.length ?? 1
        return pick(n === 1 ? 'pushOne' : 'pushMany', { n, repo })
      }
      case 'PullRequestEvent':
        return pick(p.action === 'closed' ? 'prClosed' : 'prOpen')
      case 'CreateEvent':
        return pick('created')
      case 'ReleaseEvent':
        return pick('released', { tag: p.release?.tag_name ?? '', repo })
      case 'IssuesEvent':
      case 'IssueCommentEvent':
        return pick('issue')
      case 'WatchEvent':
        return pick('starred')
      case 'ForkEvent':
        return pick('forked')
      default:
        return pick('active')
    }
  }

  const paintNow = (ev: GhEvent) => {
    if (!nowEl) return
    let projects: Record<string, string> = {}
    try {
      projects = JSON.parse(nowEl.dataset.projects || '{}')
    } catch {
      return
    }
    const repo = ev.type === 'PushEvent' ? (ev.repo?.name?.split('/')[1] ?? '') : ''
    const name = projects[repo]
    if (!name) return
    const line = (template?: string) => (template ? template.replace('{name}', name) : '')
    const en = line(nowEl.dataset.templateEn)
    const es = line(nowEl.dataset.templateEs)
    if (!en && !es) return
    const span = (l: 'en' | 'es', text: string) => {
      const el = document.createElement('span')
      el.lang = l
      el.dataset.l = l
      el.textContent = text
      return el
    }
    nowEl.replaceChildren(span('en', en), span('es', es))
  }

  const paint = () => {
    const ev = latest
    if (dead || !ev?.type || !ev.created_at) return
    const text = describe(ev)
    if (!text) return
    const link = document.createElement('a')
    link.href = `https://github.com/${ev.repo?.name ?? handle}`
    link.textContent = text
    const mark = document.createElement('span')
    mark.className = 'live-mark'
    mark.setAttribute('aria-hidden', 'true')
    el.replaceChildren(mark, link, document.createTextNode(` · ${ago(ev.created_at)}`))
    el.hidden = false
  }

  const accept = (ev: GhEvent) => {
    latest = ev
    paint()
    paintNow(ev)
  }

  const load = () => {
    fetch(`https://api.github.com/users/${encodeURIComponent(handle)}/events/public?per_page=10`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: GhEvent[]) => {
        const ev = Array.isArray(list) ? list[0] : null
        if (!ev) return
        try {
          localStorage.setItem(GH_KEY, JSON.stringify({ at: Date.now(), ev }))
        } catch {
        }
        accept(ev)
      })
      .catch(() => {})
  }

  let cached: { at: number; ev: GhEvent } | null = null
  try {
    cached = JSON.parse(localStorage.getItem(GH_KEY) || 'null')
  } catch {
    cached = null
  }
  if (cached?.ev && Date.now() - cached.at < GH_TTL) accept(cached.ev)
  else load()

  const onLang = () => paint()
  document.addEventListener('noxx:lang', onLang)

  return () => {
    dead = true
    document.removeEventListener('noxx:lang', onLang)
  }
}

function startDumpPointer() {
  const dumps = Array.from(document.querySelectorAll<HTMLElement>('[data-dump]'))
  if (!dumps.length) return () => {}

  const mark = (root: HTMLElement, ids: string[], cls: 'lit' | 'sel') => {
    for (const el of root.querySelectorAll(`.${cls}`)) el.classList.remove(cls)
    for (const id of ids) {
      for (const el of root.querySelectorAll(`[data-b="${id}"]`)) el.classList.add(cls)
    }
    if (cls === 'sel') root.dataset.selecting = ids.length ? 'true' : 'false'
  }

  const over = (e: Event) => {
    const root = e.currentTarget as HTMLElement
    const cell = (e.target as Element | null)?.closest?.('[data-b]') as HTMLElement | null
    mark(root, cell?.dataset.b ? [cell.dataset.b] : [], 'lit')
  }
  const out = (e: Event) => mark(e.currentTarget as HTMLElement, [], 'lit')

  const onSelection = () => {
    const sel = document.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    for (const dump of dumps) {
      if (!dump.contains(range.commonAncestorContainer)) continue
      const ids: string[] = []
      for (const cell of dump.querySelectorAll<HTMLElement>('[data-b]')) {
        if (range.intersectsNode(cell) && cell.dataset.b) ids.push(cell.dataset.b)
      }
      if (ids.length) mark(dump, ids, 'sel')
    }
  }

  for (const dump of dumps) {
    dump.addEventListener('mouseover', over)
    dump.addEventListener('mouseleave', out)
  }
  document.addEventListener('selectionchange', onSelection)

  return () => {
    for (const dump of dumps) {
      dump.removeEventListener('mouseover', over)
      dump.removeEventListener('mouseleave', out)
      mark(dump, [], 'lit')
      mark(dump, [], 'sel')
    }
    document.removeEventListener('selectionchange', onSelection)
  }
}

function startReveal() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (!targets.length) return () => {}
  const moves = matchMedia('(prefers-reduced-motion: no-preference)').matches
  if (!moves || !('IntersectionObserver' in window)) return () => {}

  for (const el of targets) el.classList.add('waiting')

  const frames: number[] = []
  const countUp = (el: HTMLElement) => {
    if (el.dataset.counted) return
    el.dataset.counted = '1'
    const end = parseInt(el.textContent || '', 10)
    if (!Number.isFinite(end) || end <= 0) return
    const started = performance.now()
    el.textContent = '00'
    const step = (now: number) => {
      const k = Math.min(1, (now - started) / 520)
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3)))).padStart(2, '0')
      if (k < 1) frames.push(requestAnimationFrame(step))
    }
    frames.push(requestAnimationFrame(step))
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        el.classList.add('here')
        io.unobserve(el)
        const metric = el.querySelector<HTMLElement>('[data-count]')
        if (metric) countUp(metric)
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
    for (const id of frames) cancelAnimationFrame(id)
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
