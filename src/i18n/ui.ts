export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const languageNames: Record<Locale, string> = { en: 'English', es: 'Español' }

export const ui = {
  en: {
    'meta.title': 'noxx, Full Stack Developer',
    'meta.description':
      'noxx, full stack developer from Uruguay. Web frontends and backends, low level work in C and C++, browser tools for Minecraft worlds and GTA archives, and a co-op mod for GTA III.',
    skip: 'Skip to content',
    'brand.home': 'home',
    'lang.label': 'Language',
    'theme.toDark': 'Switch to dark theme',
    'theme.toLight': 'Switch to light theme',
    'nav.sections': 'Sections',
    'nav.contact': 'Contact',
    'nav.work': 'Projects',
    'nav.stack': 'Stack',
    'spec.email': 'Email',
    'home.stackEntries': 'entries',
    'home.stackGroups': 'groups',
    'hero.placeholder': 'Loading a model…',
    'hero.tris': 'triangles',
    'hero.cvOnline': 'Read the CV',
    'projects.source': 'Source code',
    'open.pr': 'Pull request',
    'open.files': 'files changed',
    'contact.email': 'Email',
    'contact.cv': 'CV',
    'contact.cvEn': 'PDF in English',
    'contact.cvEs': 'PDF in Spanish',
    'contact.cvOnline': 'Read online',
    'footer.source': 'Source of this site',
    'cv.title': 'CV',
    'cv.download': 'Download PDF',
    'cv.back': 'Back to the portfolio',
    'cv.summary': 'Summary',
    'cv.skills': 'Skills',
    'cv.projects': 'Projects',
    'cv.openSource': 'Open source',
    'cv.links': 'Links',
    'cv.independent': 'Independent project',
    'cv.technologies': 'Technologies',
    'cv.live': 'Live',
    'cv.source': 'Source',
    'cv.portfolio': 'Portfolio',
    '404.title': 'Nothing at this address',
    '404.body': 'The page you asked for does not exist.',
    '404.home': 'Go to the start',
  },
  es: {
    'meta.title': 'noxx, Desarrollador Full Stack',
    'meta.description':
      'noxx, desarrollador full stack de Uruguay. Frontend y backend web, bajo nivel en C y C++, herramientas web para mundos de Minecraft y archivos de GTA, y un mod cooperativo para GTA III.',
    skip: 'Saltar al contenido',
    'brand.home': 'inicio',
    'lang.label': 'Idioma',
    'theme.toDark': 'Cambiar a tema oscuro',
    'theme.toLight': 'Cambiar a tema claro',
    'nav.sections': 'Secciones',
    'nav.contact': 'Contacto',
    'nav.work': 'Proyectos',
    'nav.stack': 'Stack',
    'spec.email': 'Email',
    'home.stackEntries': 'ítems',
    'home.stackGroups': 'grupos',
    'hero.placeholder': 'Cargando un modelo…',
    'hero.tris': 'triángulos',
    'hero.cvOnline': 'Leer el CV',
    'projects.source': 'Código fuente',
    'open.pr': 'Pull request',
    'open.files': 'archivos cambiados',
    'contact.email': 'Email',
    'contact.cv': 'CV',
    'contact.cvEn': 'PDF en inglés',
    'contact.cvEs': 'PDF en español',
    'contact.cvOnline': 'Leer en línea',
    'footer.source': 'Código de este sitio',
    'cv.title': 'CV',
    'cv.download': 'Descargar PDF',
    'cv.back': 'Volver al portfolio',
    'cv.summary': 'Resumen',
    'cv.skills': 'Habilidades',
    'cv.projects': 'Proyectos',
    'cv.openSource': 'Código abierto',
    'cv.links': 'Enlaces',
    'cv.independent': 'Proyecto personal',
    'cv.technologies': 'Tecnologías',
    'cv.live': 'Demo',
    'cv.source': 'Código',
    'cv.portfolio': 'Portfolio',
    '404.title': 'No hay nada en esta dirección',
    '404.body': 'La página que pediste no existe.',
    '404.home': 'Ir al inicio',
  },
} as const satisfies Record<Locale, Record<string, string>>

export type UiKey = keyof (typeof ui)['en']

export function t(locale: Locale) {
  return (key: UiKey): string => ui[locale][key] ?? ui.en[key]
}

export function both(key: UiKey): { en: string; es: string } {
  return { en: ui.en[key], es: ui.es[key] ?? ui.en[key] }
}

export function localeOf(value: string | undefined): Locale {
  return value === 'es' ? 'es' : 'en'
}
