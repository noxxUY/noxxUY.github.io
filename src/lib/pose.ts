
import type { DffBone, DffMesh, DffModel, DffSkeleton } from './rw/dff'

type Mat4 = Float32Array

const DEFAULT_DEGREES = 75

const UP = 2

const MIDLINE = 0.15

const LATERAL = 0.6

const IDENTITY: Mat4 = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k]
      out[col * 4 + row] = sum
    }
  }
  return out
}

function affineInverse(m: Mat4): Mat4 {
  const a = m[0], b = m[4], c = m[8]
  const d = m[1], e = m[5], f = m[9]
  const g = m[2], h = m[6], i = m[10]
  const A = e * i - f * h
  const B = f * g - d * i
  const C = d * h - e * g
  const det = a * A + b * B + c * C
  if (!det || !Number.isFinite(det)) return new Float32Array(IDENTITY)
  const s = 1 / det
  const c0 = A * s, c1 = B * s, c2 = C * s
  const c3 = (c * h - b * i) * s, c4 = (a * i - c * g) * s, c5 = (b * g - a * h) * s
  const c6 = (b * f - c * e) * s, c7 = (c * d - a * f) * s, c8 = (a * e - b * d) * s
  const tx = m[12], ty = m[13], tz = m[14]
  return new Float32Array([
    c0, c1, c2, 0,
    c3, c4, c5, 0,
    c6, c7, c8, 0,
    -(c0 * tx + c3 * ty + c6 * tz),
    -(c1 * tx + c4 * ty + c7 * tz),
    -(c2 * tx + c5 * ty + c8 * tz),
    1,
  ])
}

function rotationAbout(axis: number, angle: number, pivot: [number, number, number]): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const r = new Float32Array(IDENTITY)
  const u = (axis + 1) % 3
  const v = (axis + 2) % 3
  r[u * 4 + u] = c
  r[v * 4 + v] = c
  r[u * 4 + v] = s
  r[v * 4 + u] = -s
  r[12] = pivot[0] - (r[0] * pivot[0] + r[4] * pivot[1] + r[8] * pivot[2])
  r[13] = pivot[1] - (r[1] * pivot[0] + r[5] * pivot[1] + r[9] * pivot[2])
  r[14] = pivot[2] - (r[2] * pivot[0] + r[6] * pivot[1] + r[10] * pivot[2])
  return r
}

function worldMatrices(bones: DffBone[]): Mat4[] | null {
  const world: Mat4[] = []
  for (let b = 0; b < bones.length; b++) {
    const bone = bones[b]
    if (bone.parent >= b) return null
    if (bone.parent < -1) return null
    world[b] = bone.parent < 0 ? new Float32Array(bone.local) : multiply(world[bone.parent], bone.local)
  }
  return world.length === bones.length ? world : null
}

const at = (m: Mat4, axis: number) => m[12 + axis]

function bodyAxes(world: Mat4[]): { lateral: number; forward: number } | null {
  const spread = (axis: number) => {
    let lo = Infinity
    let hi = -Infinity
    for (const m of world) {
      const v = at(m, axis)
      if (!Number.isFinite(v)) return NaN
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
    return hi - lo
  }
  const a = (UP + 1) % 3
  const b = (UP + 2) % 3
  const sa = spread(a)
  const sb = spread(b)
  if (!Number.isFinite(sa) || !Number.isFinite(sb) || Math.max(sa, sb) <= 0) return null
  return sa >= sb ? { lateral: a, forward: b } : { lateral: b, forward: a }
}

function subtree(bones: DffBone[], root: number): number[] {
  const inside = bones.map(() => false)
  inside[root] = true
  const out = [root]
  for (let b = root + 1; b < bones.length; b++) {
    const parent = bones[b].parent
    if (parent >= 0 && inside[parent]) {
      inside[b] = true
      out.push(b)
    }
  }
  return out
}

function findUpperArm(bones: DffBone[], world: Mat4[], lateral: number, side: number): number {
  let tip = -1
  let reach = 0
  for (let b = 0; b < bones.length; b++) {
    const v = side * at(world[b], lateral)
    if (v > reach) {
      reach = v
      tip = b
    }
  }
  if (tip < 0 || reach <= 0) return -1

  const chain: number[] = []
  for (let b = tip, guard = 0; b >= 0 && guard <= bones.length; b = bones[b].parent, guard++) chain.push(b)
  chain.reverse()

  let arm = -1
  for (const b of chain) {
    if (side * at(world[b], lateral) > MIDLINE * reach) {
      arm = b
      break
    }
  }
  if (arm < 0 || arm === tip || bones[arm].parent < 0) return -1

  let lo = Infinity
  let hi = -Infinity
  for (const m of world) {
    const v = at(m, UP)
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  if (at(world[arm], UP) < (lo + hi) / 2) return -1

  const run = [0, 1, 2].map((axis) => at(world[tip], axis) - at(world[arm], axis))
  const length = Math.hypot(run[0], run[1], run[2])
  if (!(length > 0)) return -1
  if ((side * run[lateral]) / length < LATERAL) return -1
  if (Math.abs(run[UP]) > Math.abs(run[lateral])) return -1

  return arm
}

function recomputeBounds(meshes: DffMesh[]): DffModel['bounds'] | null {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const mesh of meshes) {
    for (let i = 0; i < mesh.positions.length; i += 3) {
      for (let a = 0; a < 3; a++) {
        const v = mesh.positions[i + a]
        if (!Number.isFinite(v)) return null
        if (v < min[a]) min[a] = v
        if (v > max[a]) max[a] = v
      }
    }
  }
  if (min.some((v) => !Number.isFinite(v)) || max.some((v) => !Number.isFinite(v))) return null
  return { min, max }
}

function skin(mesh: DffMesh, matrices: (Mat4 | null)[]): DffMesh {
  const boneIndices = mesh.boneIndices
  const boneWeights = mesh.boneWeights
  if (!boneIndices || !boneWeights) return mesh

  const count = mesh.positions.length / 3
  const src = mesh.positions
  const srcN = mesh.normals
  const positions = new Float32Array(src)
  const normals = srcN ? new Float32Array(srcN) : undefined

  for (let v = 0; v < count; v++) {
    const x = src[v * 3]
    const y = src[v * 3 + 1]
    const z = src[v * 3 + 2]
    let px = 0, py = 0, pz = 0
    let nx = 0, ny = 0, nz = 0
    let moved = 0
    let total = 0
    for (let k = 0; k < 4; k++) {
      const w = boneWeights[v * 4 + k]
      if (!(w > 0)) continue
      total += w
      const m = matrices[boneIndices[v * 4 + k]]
      if (!m) {
        px += w * x
        py += w * y
        pz += w * z
        if (srcN) {
          nx += w * srcN[v * 3]
          ny += w * srcN[v * 3 + 1]
          nz += w * srcN[v * 3 + 2]
        }
        continue
      }
      moved += w
      px += w * (m[0] * x + m[4] * y + m[8] * z + m[12])
      py += w * (m[1] * x + m[5] * y + m[9] * z + m[13])
      pz += w * (m[2] * x + m[6] * y + m[10] * z + m[14])
      if (srcN) {
        const a = srcN[v * 3]
        const b = srcN[v * 3 + 1]
        const c = srcN[v * 3 + 2]
        nx += w * (m[0] * a + m[4] * b + m[8] * c)
        ny += w * (m[1] * a + m[5] * b + m[9] * c)
        nz += w * (m[2] * a + m[6] * b + m[10] * c)
      }
    }
    if (!(total > 0) || moved <= 0) continue
    positions[v * 3] = px / total
    positions[v * 3 + 1] = py / total
    positions[v * 3 + 2] = pz / total
    if (normals) {
      const len = Math.hypot(nx, ny, nz)
      if (len > 0) {
        normals[v * 3] = nx / len
        normals[v * 3 + 1] = ny / len
        normals[v * 3 + 2] = nz / len
      }
    }
  }

  return { ...mesh, positions, normals }
}

export function armsDown(model: DffModel, degrees: number = DEFAULT_DEGREES): DffModel {
  const skeleton = model.skeleton
  if (!skeleton || skeleton.bones.length < 2) return model
  if (!Number.isFinite(degrees) || degrees <= 0 || degrees >= 180) return model
  if (!model.meshes.some((m) => m.boneIndices && m.boneWeights)) return model

  const bones = skeleton.bones
  const rest = worldMatrices(bones)
  if (!rest) return model
  const axes = bodyAxes(rest)
  if (!axes) return model

  const angle = (degrees * Math.PI) / 180
  const moved: (Mat4 | null)[] = bones.map(() => null)
  const local = bones.map((bone) => bone.local)
  const world = rest.map((m) => m)
  let posedSides = 0

  for (const side of [1, -1]) {
    const arm = findUpperArm(bones, rest, axes.lateral, side)
    if (arm < 0) continue

    const limb = subtree(bones, arm)
    if (limb.some((b) => moved[b])) continue
    const tip = limb.reduce((far, b) =>
      side * at(rest[b], axes.lateral) > side * at(rest[far], axes.lateral) ? b : far,
    )
    const pivot: [number, number, number] = [at(rest[arm], 0), at(rest[arm], 1), at(rest[arm], 2)]

    const down = [angle, -angle]
      .map((a) => rotationAbout(axes.forward, a, pivot))
      .reduce((best, r) => {
        const h = (m: Mat4) =>
          m[UP] * at(rest[tip], 0) + m[4 + UP] * at(rest[tip], 1) + m[8 + UP] * at(rest[tip], 2) + m[12 + UP]
        return h(r) < h(best) ? r : best
      })
    const lowered =
      down[UP] * at(rest[tip], 0) +
      down[4 + UP] * at(rest[tip], 1) +
      down[8 + UP] * at(rest[tip], 2) +
      down[12 + UP]
    if (!(lowered < at(rest[tip], UP))) continue

    for (const b of limb) {
      const next = multiply(down, rest[b])
      world[b] = next
      moved[b] = next
    }
    local[arm] = multiply(affineInverse(rest[bones[arm].parent]), world[arm])
    posedSides++
  }

  if (posedSides === 0) return model

  const matrices = moved.map((m, b) => (m ? multiply(m, bones[b].inverseBind) : null))
  const meshes = model.meshes.map((mesh) => skin(mesh, matrices))
  const bounds = recomputeBounds(meshes)
  if (!bounds) return model

  const posedBones: DffBone[] = bones.map((bone, b) => ({
    index: bone.index,
    parent: bone.parent,
    id: bone.id,
    local: local[b] === bone.local ? new Float32Array(bone.local) : local[b],
    inverseBind: moved[b] ? affineInverse(world[b]) : new Float32Array(bone.inverseBind),
  }))
  const posedSkeleton: DffSkeleton = { bones: posedBones }

  return {
    versionText: model.versionText,
    meshes,
    bounds,
    warnings: [...model.warnings],
    skeleton: posedSkeleton,
  }
}
