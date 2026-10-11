import type * as THREE from 'three'

type Three = typeof THREE

// A face's pixel rect in the skin: x, y, w, h.
type Rect = readonly [number, number, number, number]

// Box size in skin pixels and where its UV layout starts.
interface Box {
  w: number
  h: number
  d: number
  u: number
  v: number
}

// The standard Minecraft box unwrap, in the order BoxGeometry builds its faces:
// +x (left side), -x (right side), +y (top), -y (bottom), +z (front), -z (back).
function unwrap({ w, h, d, u, v }: Box): Rect[] {
  return [
    [u + d + w, v + d, d, h],
    [u, v + d, d, h],
    [u + d, v, w, d],
    [u + d + w, v, w, d],
    [u + d, v + d, w, h],
    [u + d + w + d, v + d, w, h],
  ]
}

// Two pixels count as different when their colours are far apart or one of them
// is see-through. Small shading noise inside a patch of cloth stays one patch.
const DIFF = 36

type Sized = CanvasImageSource & { width: number; height: number }
type Pixel = (x: number, y: number) => readonly [number, number, number, number]

function pixels(image: Sized): { read: Pixel; scale: number } {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { read: () => [0, 0, 0, 0], scale: 1 }
  ctx.drawImage(image, 0, 0)
  const data = ctx.getImageData(0, 0, image.width, image.height).data
  const read: Pixel = (x, y) => {
    const i = (y * image.width + x) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]]
  }
  return { read, scale: image.width / 64 }
}

function differs(a: readonly number[], b: readonly number[]) {
  const seeA = a[3] < 128
  const seeB = b[3] < 128
  if (seeA || seeB) return seeA !== seeB
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > DIFF
}

export interface PlayerSkin {
  skin: Sized
  cape?: Sized | null
  slim: boolean
}

export interface Look {
  solid: THREE.Material
  edge: THREE.Material
  ghost: THREE.Material
}

// Builds a player in skin pixels, feet at y = 0, facing +z, drawn like the GTA
// models: a solid that only fills, the box edges, and a line wherever the skin
// changes colour, so hair, face and clothes read without any texture. Returns
// everything it allocated so the viewer can dispose it with the rest.
export function buildPlayer(T: Three, { skin, cape, slim }: PlayerSkin, look: Look) {
  const group = new T.Group()
  const owned: { dispose(): void }[] = []

  // One box: its solid, its outline, and the colour boundaries of `colour`
  // (which answers in face pixels) laid on its faces.
  const part = (box: Box, colour: (face: number, x: number, y: number) => readonly number[]) => {
    const geo = new T.BoxGeometry(box.w, box.h, box.d)
    const outline = new T.EdgesGeometry(geo)
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    const segs: number[] = []

    unwrap(box).forEach(([, , fw, fh], face) => {
      const at = face * 4
      const tl = [pos.getX(at), pos.getY(at), pos.getZ(at)]
      const tr = [pos.getX(at + 1), pos.getY(at + 1), pos.getZ(at + 1)]
      const bl = [pos.getX(at + 2), pos.getY(at + 2), pos.getZ(at + 2)]
      const point = (a: number, b: number) =>
        [0, 1, 2].map((k) => tl[k] + (a / fw) * (tr[k] - tl[k]) + (b / fh) * (bl[k] - tl[k]))
      const line = (a0: number, b0: number, a1: number, b1: number) => segs.push(...point(a0, b0), ...point(a1, b1))

      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const here = colour(face, x, y)
          if (x > 0 && differs(colour(face, x - 1, y), here)) line(x, y, x, y + 1)
          if (y > 0 && differs(colour(face, x, y - 1), here)) line(x, y, x + 1, y)
        }
      }
    })

    const detail = new T.BufferGeometry()
    detail.setAttribute('position', new T.Float32BufferAttribute(segs, 3))
    owned.push(geo, outline, detail)

    const node = new T.Group()
    node.add(
      new T.Mesh(geo, look.solid),
      new T.LineSegments(outline, look.edge),
      new T.LineSegments(outline, look.ghost),
      new T.LineSegments(detail, look.edge),
      new T.LineSegments(detail, look.ghost),
    )
    return node
  }

  const { read, scale } = pixels(skin)
  const legacy = skin.height * 2 === skin.width
  const arm = slim ? 3 : 4

  const parts: { box: Box; layer: readonly [number, number]; x: number; y: number }[] = [
    { box: { w: 8, h: 8, d: 8, u: 0, v: 0 }, layer: [32, 0], x: 0, y: 28 },
    { box: { w: 8, h: 12, d: 4, u: 16, v: 16 }, layer: [16, 32], x: 0, y: 18 },
    { box: { w: arm, h: 12, d: 4, u: 40, v: 16 }, layer: [40, 32], x: -(4 + arm / 2), y: 18 },
    { box: { w: arm, h: 12, d: 4, u: legacy ? 40 : 32, v: legacy ? 16 : 48 }, layer: [48, 48], x: 4 + arm / 2, y: 18 },
    { box: { w: 4, h: 12, d: 4, u: 0, v: 16 }, layer: [0, 32], x: -2, y: 6 },
    { box: { w: 4, h: 12, d: 4, u: legacy ? 0 : 16, v: legacy ? 16 : 48 }, layer: [0, 48], x: 2, y: 6 },
  ]

  for (const { box, layer, x, y } of parts) {
    const base = unwrap(box)
    const over = unwrap({ ...box, u: layer[0], v: layer[1] })
    // What you see on a face pixel: the second layer where it is drawn, else the
    // base. 64x32 skins predate the second layer.
    const colour = (face: number, fx: number, fy: number) => {
      if (!legacy) {
        const [ox, oy] = over[face]
        const top = read((ox + fx) * scale, (oy + fy) * scale)
        if (top[3] >= 128) return top
      }
      const [bx, by] = base[face]
      return read((bx + fx) * scale, (by + fy) * scale)
    }
    const node = part(box, colour)
    node.position.set(x, y, 0)
    group.add(node)
  }

  if (cape) {
    const capeRead = pixels(cape)
    const box = { w: 10, h: 16, d: 1, u: 0, v: 0 }
    const rects = unwrap(box)
    const node = part(box, (face, fx, fy) => {
      const [cx, cy] = rects[face]
      return capeRead.read((cx + fx) * capeRead.scale, (cy + fy) * capeRead.scale)
    })
    // Hangs from the shoulders behind the back, tilted out a little, with its
    // outside (the box's front in the layout) facing away from the body.
    const hinge = new T.Group()
    hinge.position.set(0, 24, -2.5)
    hinge.rotation.x = 0.12
    node.position.set(0, -8, 0)
    node.rotation.y = Math.PI
    hinge.add(node)
    group.add(hinge)
  }

  return { group, owned, min: [-8, 0, -4] as const, max: [8, 32, 4] as const }
}
