// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'

// GitHub Pages user site: served from the domain root, so no `base`.
export default defineConfig({
  site: 'https://noxxuy.github.io',
  output: 'static',
  // Astro 7 defaults to 'jsx' whitespace rules, which fuses inline elements that
  // wrap across source lines ("<strong>a</strong>\n<a>b</a>" -> "ab"). The CV text
  // must survive an ATS parser intact, so keep the lossless behaviour.
  compressHTML: true,

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: { prefixDefaultLocale: false },
  },

  // Self-hosted at build time (copied to /_astro/fonts); no request to Google at runtime.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
      display: 'swap',
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
      display: 'swap',
    },
  ],

  integrations: [
    sitemap({
      // The sitemap integration does not read the `i18n` block above.
      i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } },
      // /og/ only exists to be screenshotted into public/og.png.
      filter: (page) => !page.includes('/og/'),
    }),
  ],

  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
  },
})
