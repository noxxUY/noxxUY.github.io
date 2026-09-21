
export type Lang = 'en' | 'es'
export const LANG_KEY = 'noxx-portfolio-lang'

const SWAPPED = ['alt', 'href', 'title', 'aria-label', 'download'] as const

let cleanup: (() => void) | null = null

export function destroyLang() {
  cleanup?.()
  cleanup = null
}

export function currentLang(): Lang {
  return document.documentElement.lang === 'es' ? 'es' : 'en'
}

export function applyLang(lang: Lang, { persist = true } = {}) {
  const root = document.documentElement
  if (root.dataset.bilingual !== 'true') return
  root.lang = lang

  for (const el of document.querySelectorAll<HTMLElement>('[data-swap]')) {
    for (const attr of SWAPPED) {
      const value = el.dataset[attrKey(attr, lang)]
      if (value !== undefined) el.setAttribute(attr, value)
    }
  }

  const title = root.dataset[lang === 'es' ? 'titleEs' : 'titleEn']
  if (title) document.title = title

  for (const button of document.querySelectorAll<HTMLElement>('[data-lang-to]')) {
    const on = button.dataset.langTo === lang
    button.classList.toggle('is-current', on)
    if (on) button.setAttribute('aria-current', 'true')
    else button.removeAttribute('aria-current')
  }

  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
    }
  }

  document.dispatchEvent(new CustomEvent('noxx:lang', { detail: lang }))
}

function attrKey(attr: string, lang: Lang) {
  const camel = attr.replace(/-(\w)/g, (_m, c) => c.toUpperCase())
  return `${camel}${lang === 'es' ? 'Es' : 'En'}`
}

export function initLang() {
  destroyLang()
  const root = document.documentElement
  if (root.dataset.bilingual !== 'true') return

  applyLang(currentLang(), { persist: false })

  const onClick = (e: Event) => {
    const target = (e.target as Element | null)?.closest?.('[data-lang-to]') as HTMLElement | null
    if (!target) return
    const lang = target.dataset.langTo === 'es' ? 'es' : 'en'
    e.preventDefault()
    e.stopPropagation()
    applyLang(lang)
  }

  document.addEventListener('click', onClick, { capture: true })
  cleanup = () => document.removeEventListener('click', onClick, { capture: true } as EventListenerOptions)
}
