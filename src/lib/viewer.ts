
import type * as THREE from 'three'
import type { DffModel } from './rw/dff'

export interface Viewer {
  show(model: DffModel, yaw?: number): void
  clear(): void
  refresh(): void
  destroy(): void
}

const SPIN = 0.25
const EDGE_ANGLE = 24
const ORBIT = 0.008
const PITCH_LIMIT = 1.15
const ZOOM_MIN = 0.45
const ZOOM_MAX = 2.6
const SLOP = 8
const VIEW = { yaw: 0.42, pitch: 0.14 }

type Part = readonly [w: number, h: number, d: number, x: number, y: number, z: number]

const BODY: readonly Part[] = [
  [0.3, 0.3, 0.3, 0, 1.82, 0],
  [0.14, 0.1, 0.14, 0, 1.64, 0],
  [0.62, 0.42, 0.28, 0, 1.4, 0],
  [0.44, 0.16, 0.24, 0, 1.11, 0],
  [0.52, 0.22, 0.26, 0, 0.92, 0],
]

const SIDE: readonly Part[] = [
  [0.16, 0.22, 0.26, 0.38, 1.5, 0],
  [0.42, 0.15, 0.15, 0.68, 1.5, 0],
  [0.14, 0.17, 0.17, 0.95, 1.5, 0],
  [0.4, 0.12, 0.12, 1.22, 1.5, 0],
  [0.18, 0.14, 0.1, 1.5, 1.5, 0],
  [0.2, 0.44, 0.22, 0.15, 0.6, 0],
  [0.17, 0.12, 0.18, 0.15, 0.32, 0],
  [0.16, 0.34, 0.17, 0.15, 0.12, 0],
  [0.18, 0.1, 0.34, 0.15, -0.06, 0.06],
]

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

export async function createViewer(canvas: HTMLCanvasElement): Promise<Viewer> {
  const T = await import('three')

  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 100)
  const pivot = new T.Group()
  scene.add(pivot)

  const palette = () => {
    const css = getComputedStyle(document.documentElement)
    const pick = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
    return {
      text: pick('--text', '#111113'),
      accent: pick('--accent', '#e8470f'),
      line: pick('--line', '#e2e2e5'),
    }
  }

  const ink = palette()

  const solidMat = new T.MeshBasicMaterial({
    color: ink.line,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
  const edgeMat = new T.LineBasicMaterial({ color: ink.text })
  const ghostMat = new T.LineBasicMaterial({
    color: ink.accent,
    transparent: true,
    opacity: 0.32,
    depthFunc: T.GreaterDepth,
    depthWrite: false,
  })

  function refresh() {
    const next = palette()
    solidMat.color.setStyle(next.line)
    edgeMat.color.setStyle(next.text)
    ghostMat.color.setStyle(next.accent)
    invalidate()
  }

  const frameOf = (min: readonly number[], max: readonly number[]) => {
    const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
    return {
      center: [min[0] + size[0] / 2, min[1] + size[1] / 2, min[2] + size[2] / 2] as const,
      radius: Math.max(0.5 * Math.hypot(size[0], size[1], size[2]), 1e-3),
    }
  }

  const layers = (geo: THREE.BufferGeometry, edges: THREE.BufferGeometry) => [
    new T.Mesh(geo, solidMat),
    new T.LineSegments(edges, edgeMat),
    new T.LineSegments(edges, ghostMat),
  ]

  const unitBox = new T.BoxGeometry(1, 1, 1)
  const unitEdges = new T.EdgesGeometry(unitBox, EDGE_ANGLE)

  const buildFigure = () => {
    const parts = [...BODY, ...SIDE, ...SIDE.map(([w, h, d, x, y, z]): Part => [w, h, d, -x, y, z])]
    const group = new T.Group()
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]

    for (const [w, h, d, x, y, z] of parts) {
      for (const node of layers(unitBox, unitEdges)) {
        node.scale.set(w, h, d)
        node.position.set(x, y, z)
        group.add(node)
      }
      const half = [w / 2, h / 2, d / 2]
      const at = [x, y, z]
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], at[i] - half[i])
        max[i] = Math.max(max[i], at[i] + half[i])
      }
    }

    const { center, radius } = frameOf(min, max)
    group.position.set(-center[0], -center[1], -center[2])
    return { group, radius }
  }

  const figure = buildFigure()
  let owned: THREE.BufferGeometry[] = []
  let fitRadius = figure.radius
  let fitDist = 4
  let zoom = 1
  let yaw = VIEW.yaw
  let pitch = VIEW.pitch

  function mount(subject: THREE.Object3D, radius: number) {
    pivot.clear()
    pivot.add(subject)
    pivot.rotation.y = 0
    yaw = VIEW.yaw
    pitch = VIEW.pitch
    zoom = 1
    fitRadius = radius
    refit()
    invalidate()
  }

  function releaseModel() {
    for (const geo of owned) geo.dispose()
    owned = []
  }

  function show(model: DffModel, yaw = 0) {
    const group = new T.Group()
    const next: THREE.BufferGeometry[] = []

    for (const mesh of model.meshes) {
      if (mesh.positions.length < 9 || mesh.indices.length < 3) continue
      const geo = new T.BufferGeometry()
      geo.setAttribute('position', new T.BufferAttribute(mesh.positions, 3))
      geo.setIndex(new T.BufferAttribute(mesh.indices, 1))
      const edges = new T.EdgesGeometry(geo, EDGE_ANGLE)
      next.push(geo, edges)
      for (const node of layers(geo, edges)) group.add(node)
    }

    if (!next.length) return clear()

    const { min, max } = model.bounds
    const sane = [...min, ...max].every(Number.isFinite) && max.some((v, i) => v > min[i])
    const box = sane ? frameOf(min, max) : frameOf(...boundsOf(next))
    group.position.set(-box.center[0], -box.center[1], -box.center[2])

    const facing = new T.Group()
    facing.rotation.z = (yaw * Math.PI) / 180
    facing.add(group)

    const upright = new T.Group()
    upright.rotation.x = -Math.PI / 2
    upright.add(facing)

    releaseModel()
    owned = next
    mount(upright, box.radius)
  }

  const boundsOf = (geoms: THREE.BufferGeometry[]) => {
    const box = new T.Box3()
    for (const geo of geoms) {
      geo.computeBoundingBox()
      if (geo.boundingBox) box.union(geo.boundingBox)
    }
    if (box.isEmpty()) box.setFromCenterAndSize(new T.Vector3(), new T.Vector3(1, 1, 1))
    return [box.min.toArray(), box.max.toArray()] as const
  }

  function clear() {
    releaseModel()
    mount(figure.group, figure.radius)
  }

  function refit() {
    const vFov = (camera.fov * Math.PI) / 180
    const fov = Math.min(vFov, 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect))
    fitDist = (fitRadius / Math.sin(fov / 2)) * 1.12
    camera.near = Math.max(0.01, fitDist * 0.02)
    camera.far = fitDist * 8
    camera.updateProjectionMatrix()
  }

  function place() {
    const d = fitDist * zoom
    camera.position.set(
      d * Math.cos(pitch) * Math.sin(yaw),
      d * Math.sin(pitch),
      d * Math.cos(pitch) * Math.cos(yaw),
    )
    camera.lookAt(0, 0, 0)
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const dark = matchMedia('(prefers-color-scheme: dark)')
  let still = motion.matches
  let onScreen = true
  let loop = 0
  let once = 0
  let last = 0

  function render() {
    place()
    renderer.render(scene, camera)
  }

  function tick(now: number) {
    loop = requestAnimationFrame(tick)
    pivot.rotation.y += SPIN * Math.min((now - last) / 1000, 0.1)
    last = now
    render()
  }

  function invalidate() {
    if (loop || once || !onScreen || document.hidden) return
    once = requestAnimationFrame(() => {
      once = 0
      render()
    })
  }

  function sync() {
    const wanted = !still && onScreen && !document.hidden
    if (wanted && !loop) {
      last = performance.now()
      loop = requestAnimationFrame(tick)
    } else if (!wanted && loop) {
      cancelAnimationFrame(loop)
      loop = 0
    }
    if (!loop) invalidate()
  }

  let dragId = -1
  let orbiting = false
  let startX = 0
  let startY = 0
  let lastX = 0
  let lastY = 0

  const onDown = (e: PointerEvent) => {
    if (!e.isPrimary || dragId !== -1) return
    dragId = e.pointerId
    startX = lastX = e.clientX
    startY = lastY = e.clientY
    orbiting = e.pointerType !== 'touch'
    if (orbiting) {
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
    }
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== dragId) return
    if (!orbiting) {
      const dx = Math.abs(e.clientX - startX)
      const dy = Math.abs(e.clientY - startY)
      if (dx < SLOP && dy < SLOP) return
      if (dy >= dx) return void (dragId = -1)
      orbiting = true
      canvas.setPointerCapture(e.pointerId)
    }
    yaw -= (e.clientX - lastX) * ORBIT
    pitch = clamp(pitch + (e.clientY - lastY) * ORBIT, -PITCH_LIMIT, PITCH_LIMIT)
    lastX = e.clientX
    lastY = e.clientY
    invalidate()
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== dragId) return
    if (orbiting && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    dragId = -1
    orbiting = false
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const step = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1)
    zoom = clamp(zoom * Math.exp(step * 0.0012), ZOOM_MIN, ZOOM_MAX)
    invalidate()
  }

  const onDouble = () => {
    yaw = VIEW.yaw
    pitch = VIEW.pitch
    zoom = 1
    invalidate()
  }

  const onVisibility = () => sync()
  const onMotion = (e: MediaQueryListEvent) => {
    still = e.matches
    sync()
  }
  const onTheme = () => refresh()

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('dblclick', onDouble)
  document.addEventListener('visibilitychange', onVisibility)
  motion.addEventListener('change', onMotion)
  dark.addEventListener('change', onTheme)
  const themeWatch = new MutationObserver(onTheme)
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth))
    const h = Math.max(1, Math.round(canvas.clientHeight))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    refit()
    invalidate()
  }

  const sizeWatch = new ResizeObserver(resize)
  sizeWatch.observe(canvas)

  const seenWatch = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting)
    sync()
  })
  seenWatch.observe(canvas)

  clear()
  resize()
  sync()

  return {
    show,
    clear,
    refresh,
    destroy() {
      cancelAnimationFrame(loop)
      cancelAnimationFrame(once)
      loop = once = 0

      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('dblclick', onDouble)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
      dark.removeEventListener('change', onTheme)
      themeWatch.disconnect()
      sizeWatch.disconnect()
      seenWatch.disconnect()

      pivot.clear()
      releaseModel()
      unitBox.dispose()
      unitEdges.dispose()
      solidMat.dispose()
      edgeMat.dispose()
      ghostMat.dispose()
      renderer.dispose()
    },
  }
}
