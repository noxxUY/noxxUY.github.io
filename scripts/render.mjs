/*
  Builds the site, serves the build, and renders with the Chromium-based browser
  already installed on this machine (no browser download):
    - /cv/ and /es/cv/  -> public/cv/<alias>-CV-<locale>.pdf  (A4, real text layer)
    - /og/              -> public/og.png                       (1200x630 preview image)
  The outputs live in public/ and are committed, so CI only runs `astro build`.

  Usage: npm run render         (override the browser with BROWSER_PATH=...)
*/
import { build, preview } from 'astro'
import puppeteer from 'puppeteer-core'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cvFile } from '../src/data/profile.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const publicDir = path.join(root, 'public')
mkdirSync(path.join(publicDir, 'cv'), { recursive: true })

function findBrowser() {
  const fromEnv = process.env.BROWSER_PATH
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  const candidates = []
  if (process.platform === 'win32') {
    // Edge on Windows IoT/LTSC lives in a versioned EdgeCore folder.
    const core = 'C:/Program Files (x86)/Microsoft/EdgeCore'
    if (existsSync(core)) {
      const versions = readdirSync(core)
        .filter((d) => /^\d/.test(d))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      for (const v of versions) candidates.push(path.join(core, v, 'msedge.exe'))
    }
    candidates.push(
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    )
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    )
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/microsoft-edge',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    )
  }
  return candidates.find((p) => existsSync(p))
}

const executablePath = findBrowser()
if (!executablePath) {
  console.error('No Chromium-based browser found. Set BROWSER_PATH to msedge.exe or chrome.exe and retry.')
  process.exit(1)
}

await build({ root, logLevel: 'warn' })
const server = await preview({ root, logLevel: 'warn', server: { port: 4322 } })
const origin = `http://localhost:${server.port}`

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-extensions', '--hide-scrollbars'],
})

async function open(route, viewport) {
  const page = await browser.newPage()
  if (viewport) await page.setViewport(viewport)
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('noxx-portfolio-theme', 'light')
    } catch {}
  })
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await page.goto(origin + route, { waitUntil: 'networkidle0' })
  await page.evaluate(async () => {
    await document.fonts.ready
    return true
  })
  return page
}

try {
  for (const locale of ['en', 'es']) {
    const route = locale === 'en' ? '/cv/' : '/es/cv/'
    const out = path.join(publicDir, cvFile(locale).replace(/^\//, ''))
    const page = await open(route)
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true })
    await page.close()
    console.log('wrote', path.relative(root, out))
  }

  const og = await open('/og/', { width: 1200, height: 630, deviceScaleFactor: 1 })
  const ogOut = path.join(publicDir, 'og.png')
  await og.screenshot({ path: ogOut })
  await og.close()
  console.log('wrote', path.relative(root, ogOut))
  /*
    astro build copies public/ into dist/ BEFORE these three files are written, so the
    dist on disk would be one build behind: copy them across as well.
  */
  const distDir = path.join(root, 'dist')
  if (existsSync(distDir)) {
    mkdirSync(path.join(distDir, 'cv'), { recursive: true })
    for (const rel of [...['en', 'es'].map((l) => cvFile(l).replace(/^\//, '')), 'og.png']) {
      const from = path.join(publicDir, rel)
      if (existsSync(from)) copyFileSync(from, path.join(distDir, rel))
    }
    console.log('copied the rendered files into dist/')
  }
} finally {
  await browser.close()
  await server.stop()
}
