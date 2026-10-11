
import { heroModels, heroPlayers, type HeroPlayer } from '../data/models'
import type { Viewer } from './viewer'

let cleanup: (() => void) | null = null

export function destroyHero() {
  cleanup?.()
  cleanup = null
}

export function initHero() {
  destroyHero()
  const root = document.querySelector<HTMLElement>('[data-hero]')
  const canvas = root?.querySelector<HTMLCanvasElement>('canvas')
  const status = root?.querySelector<HTMLElement>('[data-hero-status]')
  if (!root || !canvas || !status) return

  const strings = () => {
    try {
      return JSON.parse(root.dataset.strings || '{}') as Record<string, { en: string; es: string }>
    } catch {
      return {}
    }
  }
  const lang = () => (document.documentElement.lang === 'es' ? 'es' : 'en')
  const word = (key: string) => strings()[key]?.[lang()] ?? ''

  const sayModel = (game: string, versionText: string, triangles: number) => {
    status.dataset.game = game
    status.dataset.version = versionText
    status.dataset.tris = String(triangles)
    status.textContent = `${game} · RW ${versionText} · ${triangles.toLocaleString(lang())} ${word('tris')}`
  }
  const sayPlayer = (name: string) => {
    delete status.dataset.game
    status.dataset.player = name
    status.textContent = `Minecraft · ${name}`
  }
  const repaint = () => {
    if (status.dataset.game) {
      sayModel(status.dataset.game, status.dataset.version || '', Number(status.dataset.tris) || 0)
    }
  }

  let viewer: Viewer | null = null
  let booting: Promise<Viewer | null> | null = null
  let dead = false

  const boot = () => {
    if (booting) return booting
    booting = import('./viewer')
      .then((m) => m.createViewer(canvas))
      .then((v) => {
        if (dead) {
          v.destroy()
          return null
        }
        viewer = v
        root.dataset.ready = 'true'
        return v
      })
      .catch(() => null)
    return booting
  }

  const image = (file: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = `${import.meta.env.BASE_URL}skins/${file}`
    })

  const showPlayer = async (pick: HeroPlayer) => {
    try {
      const [v, skin, cape] = await Promise.all([
        boot(),
        image(pick.skin),
        pick.cape ? image(pick.cape).catch(() => null) : Promise.resolve(null),
      ])
      if (!v || dead) return
      v.showPlayer({ skin, cape, slim: pick.slim })
      root.dataset.state = 'model'
      sayPlayer(pick.name)
    } catch {
    }
  }

  const showRandom = async () => {
    // Half the time a Minecraft player, half the time a GTA ped.
    if (heroPlayers.length && (!heroModels.length || Math.random() < 0.5)) {
      return showPlayer(heroPlayers[Math.floor(Math.random() * heroPlayers.length)])
    }
    const pick = heroModels[Math.floor(Math.random() * heroModels.length)]
    if (!pick) return
    try {
      const [v, res] = await Promise.all([boot(), fetch(`${import.meta.env.BASE_URL}models/${pick.file}`)])
      if (!v || dead || !res.ok) return
      const [{ parseDffModel }, { armsDown }] = await Promise.all([import('./rw/dff'), import('./pose')])
      const model = armsDown(parseDffModel(new Uint8Array(await res.arrayBuffer())))
      const triangles = model.meshes.reduce((n, m) => n + m.indices.length / 3, 0)
      if (!triangles || dead) return
      v.show(model, pick.yaw ?? 0)
      root.dataset.state = 'model'
      sayModel(pick.game, model.versionText, triangles)
    } catch {
    }
  }

  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            if (!entries.some((e) => e.isIntersecting)) return
            io?.disconnect()
            void showRandom()
          },
          { rootMargin: '200px' },
        )
      : null
  if (io) io.observe(root)
  else void showRandom()

  document.addEventListener('noxx:lang', repaint)

  cleanup = () => {
    dead = true
    io?.disconnect()
    document.removeEventListener('noxx:lang', repaint)
    viewer?.destroy()
    viewer = null
  }
}
