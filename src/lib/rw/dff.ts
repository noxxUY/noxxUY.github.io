
import { RW, RwParseError, RwStream, formatVersion, type RwSection } from './stream'

export interface DffBone {
  index: number
  parent: number
  id: number
  local: Float32Array
  inverseBind: Float32Array
}

export interface DffSkeleton {
  bones: DffBone[]
}

export interface DffMesh {
  positions: Float32Array
  normals?: Float32Array
  indices: Uint32Array
  boneIndices?: Uint8Array
  boneWeights?: Float32Array
}

export interface DffModel {
  versionText: string
  meshes: DffMesh[]
  bounds: { min: [number, number, number]; max: [number, number, number] }
  warnings: string[]
  skeleton?: DffSkeleton
}

const GEOMETRY_FLAGS = {
  TEXTURED: 0x04,
  PRELIT: 0x08,
  TEXTURED2: 0x80,
  NATIVE: 0x01000000,
} as const

interface Frame {
  parent: number
  matrix: Float32Array
  boneId?: number
}

interface Bone {
  id: number
  index: number
}

interface Skin {
  boneCount: number
  indices: Uint8Array
  weights: Float32Array
  inverseBind: Float32Array[]
}

interface Geometry {
  vertexCount: number
  positions: Float32Array
  normals?: Float32Array
  indices: Uint32Array
  skin?: Skin
}

interface Atomic {
  frameIndex: number
  geometryIndex: number
}

interface Clump {
  frames: Frame[]
  bones: Bone[]
}

const STAND_UP = new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1])

const IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])

function multiply(a: Float32Array, b: Float32Array): Float32Array {
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

function affineInverse(m: Float32Array): Float32Array {
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

function parseFrameList(stream: RwStream, section: RwSection, clump: Clump) {
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Frame list without struct')
  stream.pos = struct.dataStart
  const count = stream.u32()
  const frames: Frame[] = []
  for (let i = 0; i < count; i++) {
    const r = stream.f32array(9)
    const px = stream.f32()
    const py = stream.f32()
    const pz = stream.f32()
    const parent = stream.i32()
    stream.u32()
    const matrix = new Float32Array([
      r[0], r[1], r[2], 0,
      r[3], r[4], r[5], 0,
      r[6], r[7], r[8], 0,
      px, py, pz, 1,
    ])
    frames.push({ parent, matrix })
  }
  clump.frames = frames

  let index = 0
  for (const child of stream.children(section)) {
    if (child.type !== RW.EXTENSION) continue
    const frame = frames[index++]
    if (!frame) break
    for (const ext of stream.children(child)) {
      if (ext.type !== RW.HANIM_PLG || ext.dataEnd - ext.dataStart < 12) continue
      stream.pos = ext.dataStart
      stream.u32()
      frame.boneId = stream.i32()
      const boneCount = stream.u32()
      if (boneCount > 0 && ext.dataEnd - stream.pos >= 8 + boneCount * 12) {
        stream.u32()
        stream.u32()
        clump.bones = []
        for (let b = 0; b < boneCount; b++) {
          const id = stream.i32()
          clump.bones.push({ id, index: stream.u32() })
          stream.u32()
        }
      }
    }
  }
}

function frameWorldMatrices(frames: Frame[]): Float32Array[] {
  const world: (Float32Array | null)[] = frames.map(() => null)
  const compute = (i: number, depth = 0): Float32Array => {
    const cached = world[i]
    if (cached) return cached
    const frame = frames[i]
    let m = frame.matrix
    if (frame.parent >= 0 && frame.parent < frames.length && frame.parent !== i && depth < 64) {
      m = multiply(compute(frame.parent, depth + 1), frame.matrix)
    }
    world[i] = m
    return m
  }
  return frames.map((_, i) => compute(i))
}

function parseSkin(stream: RwStream, section: RwSection, vertexCount: number): Skin | null {
  const size = section.dataEnd - section.dataStart
  stream.pos = section.dataStart
  const boneCount = stream.u8()
  const usedBones = stream.u8()
  stream.u8()
  stream.u8()
  if (boneCount === 0) return null
  const perVertex = vertexCount * 20
  const newSize = 4 + usedBones + perVertex + boneCount * 64 + 12
  const oldSize = 4 + perVertex + boneCount * 68
  const oldFormat = size === oldSize || (size !== newSize && usedBones === 0 && size < newSize)
  if (!oldFormat) stream.skip(usedBones)
  if (stream.pos + perVertex > section.dataEnd) return null
  const indices = stream.sub(vertexCount * 4).slice()
  const weights = stream.f32array(vertexCount * 4)
  const inverseBind: Float32Array[] = []
  for (let b = 0; b < boneCount; b++) {
    if (oldFormat) stream.skip(4)
    if (stream.pos + 64 > section.dataEnd) return null
    const m = stream.f32array(16)
    m[3] = 0
    m[7] = 0
    m[11] = 0
    m[15] = 1
    inverseBind.push(m)
  }
  return { boneCount, indices, weights, inverseBind }
}

function stripToList(indices: Uint32Array, vertexCount: number, out: number[]) {
  for (let i = 0; i + 2 < indices.length; i++) {
    const a = indices[i]
    const b = indices[i + 1]
    const c = indices[i + 2]
    if (a === b || b === c || a === c) continue
    if (a >= vertexCount || b >= vertexCount || c >= vertexCount) continue
    if (i & 1) out.push(b, a, c)
    else out.push(a, b, c)
  }
}

function parseBinMesh(stream: RwStream, section: RwSection, vertexCount: number): number[] | null {
  stream.pos = section.dataStart
  const faceType = stream.u32()
  const meshCount = stream.u32()
  stream.u32()
  const out: number[] = []
  for (let m = 0; m < meshCount; m++) {
    if (stream.pos + 8 > section.dataEnd) return null
    const count = stream.u32()
    stream.u32()
    if (stream.pos + count * 4 > section.dataEnd) return null
    const raw = new Uint32Array(count)
    for (let i = 0; i < count; i++) raw[i] = stream.u32()
    if (faceType === 1) {
      stripToList(raw, vertexCount, out)
    } else {
      for (let i = 0; i + 2 < raw.length; i += 3) {
        const a = raw[i]
        const b = raw[i + 1]
        const c = raw[i + 2]
        if (a >= vertexCount || b >= vertexCount || c >= vertexCount) continue
        out.push(a, b, c)
      }
    }
  }
  return out
}

function parseGeometry(stream: RwStream, section: RwSection, warnings: string[]): Geometry | null {
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Geometry without struct')
  stream.pos = struct.dataStart
  const flags = stream.u32()
  const triangleCount = stream.u32()
  const vertexCount = stream.u32()
  const morphTargets = stream.u32()
  if (section.version < 0x34000) stream.skip(12)

  if (flags & GEOMETRY_FLAGS.NATIVE) {
    warnings.push('A mesh uses platform-native data (console build) and was skipped')
    return null
  }

  let uvCount = (flags >> 16) & 0xff
  if (uvCount === 0) {
    if (flags & GEOMETRY_FLAGS.TEXTURED2) uvCount = 2
    else if (flags & GEOMETRY_FLAGS.TEXTURED) uvCount = 1
  }

  if (flags & GEOMETRY_FLAGS.PRELIT) stream.skip(vertexCount * 4)
  stream.skip(uvCount * vertexCount * 8)

  const tris: number[] = []
  for (let i = 0; i < triangleCount; i++) {
    const v2 = stream.u16()
    const v1 = stream.u16()
    stream.u16()
    const v3 = stream.u16()
    if (v1 >= vertexCount || v2 >= vertexCount || v3 >= vertexCount) continue
    if (v1 === v2 || v2 === v3 || v1 === v3) continue
    tris.push(v1, v2, v3)
  }

  let positions: Float32Array | undefined
  let normals: Float32Array | undefined
  for (let t = 0; t < morphTargets; t++) {
    stream.skip(16)
    const hasVertices = stream.u32()
    const hasNormals = stream.u32()
    if (t === 0) {
      if (hasVertices) positions = stream.f32array(vertexCount * 3)
      if (hasNormals) normals = stream.f32array(vertexCount * 3)
    } else {
      if (hasVertices) stream.skip(vertexCount * 12)
      if (hasNormals) stream.skip(vertexCount * 12)
    }
  }

  if (!positions) {
    warnings.push('A mesh has no vertex positions and was skipped')
    return null
  }

  const geometry: Geometry = { vertexCount, positions, normals, indices: Uint32Array.from(tris) }

  const extension = stream.findChild(section, RW.EXTENSION)
  const binMeshSection = extension ? stream.findChild(extension, RW.BIN_MESH_PLG) : undefined
  if (binMeshSection) {
    const binMesh = parseBinMesh(stream, binMeshSection, vertexCount)
    if (binMesh && binMesh.length) geometry.indices = Uint32Array.from(binMesh)
  }

  const skinSection = extension ? stream.findChild(extension, RW.SKIN_PLG) : undefined
  if (skinSection) {
    try {
      geometry.skin = parseSkin(stream, skinSection, vertexCount) ?? undefined
    } catch {
      geometry.skin = undefined
    }
    if (!geometry.skin) warnings.push('A character could not be posed; showing it as stored')
  }
  return geometry
}

function parseAtomic(stream: RwStream, section: RwSection): Atomic {
  const struct = stream.findChild(section, RW.STRUCT)
  if (!struct) throw new RwParseError('Atomic without struct')
  stream.pos = struct.dataStart
  const frameIndex = stream.u32()
  const geometryIndex = stream.u32()
  return { frameIndex, geometryIndex }
}

function boneFrames(clump: Clump, boneCount: number): number[] {
  const out: number[] = []
  if (clump.bones.length >= boneCount) {
    for (let b = 0; b < boneCount; b++) {
      const bone = clump.bones.find((x) => x.index === b) ?? clump.bones[b]
      out.push(clump.frames.findIndex((f) => f.boneId === bone.id))
    }
    if (out.every((i) => i >= 0)) return out
  }
  const withId = clump.frames.map((f, i) => (f.boneId !== undefined ? i : -1)).filter((i) => i >= 0)
  if (withId.length >= boneCount) return withId.slice(0, boneCount)
  const skipRoot = clump.frames.length === boneCount + 1 ? 1 : 0
  return Array.from({ length: boneCount }, (_, b) => Math.min(b + skipRoot, clump.frames.length - 1))
}

function buildSkeleton(clump: Clump, worlds: Float32Array[], boneCount: number): DffSkeleton | null {
  if (boneCount <= 0) return null
  const frames = boneFrames(clump, boneCount)
  if (frames.some((f) => f < 0 || f >= clump.frames.length)) return null

  const boneOfFrame = new Map<number, number>()
  frames.forEach((frame, bone) => {
    if (!boneOfFrame.has(frame)) boneOfFrame.set(frame, bone)
  })

  const restWorld = frames.map((f) => multiply(STAND_UP, worlds[f]))
  const bones: DffBone[] = []
  for (let b = 0; b < boneCount; b++) {
    const frame = frames[b]
    let parent = -1
    let at = clump.frames[frame].parent
    for (let depth = 0; at >= 0 && at < clump.frames.length && depth < 64; depth++) {
      const owner = boneOfFrame.get(at)
      if (owner !== undefined && owner !== b) {
        parent = owner
        break
      }
      const next = clump.frames[at].parent
      if (next === at) break
      at = next
    }
    const local =
      parent >= 0 ? multiply(affineInverse(restWorld[parent]), restWorld[b]) : restWorld[b]
    const tableId = clump.bones.find((x) => x.index === b)?.id
    bones.push({
      index: b,
      parent,
      id: tableId ?? clump.frames[frame].boneId ?? b,
      local,
      inverseBind: affineInverse(restWorld[b]),
    })
  }
  return { bones }
}

function bindPose(
  clump: Clump,
  worlds: Float32Array[],
  geometry: Geometry,
): { positions: Float32Array; normals?: Float32Array } | null {
  const skin = geometry.skin
  if (!skin) return null
  const frames = boneFrames(clump, skin.boneCount)
  const boneMatrices = skin.inverseBind.map((inv, b) => {
    const world = worlds[frames[b]]
    return world ? multiply(world, inv) : inv
  })
  const n = geometry.vertexCount
  const src = geometry.positions
  const srcN = geometry.normals
  const positions = new Float32Array(n * 3)
  const normals = srcN ? new Float32Array(n * 3) : undefined
  for (let v = 0; v < n; v++) {
    const x = src[v * 3]
    const y = src[v * 3 + 1]
    const z = src[v * 3 + 2]
    let px = 0
    let py = 0
    let pz = 0
    let nx = 0
    let ny = 0
    let nz = 0
    let total = 0
    for (let k = 0; k < 4; k++) {
      const w = skin.weights[v * 4 + k]
      if (w <= 0) continue
      const m = boneMatrices[skin.indices[v * 4 + k]]
      if (!m) continue
      total += w
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
    if (total > 0) {
      positions[v * 3] = px / total
      positions[v * 3 + 1] = py / total
      positions[v * 3 + 2] = pz / total
      if (normals) {
        const len = Math.hypot(nx, ny, nz) || 1
        normals[v * 3] = nx / len
        normals[v * 3 + 1] = ny / len
        normals[v * 3 + 2] = nz / len
      }
    } else {
      positions[v * 3] = x
      positions[v * 3 + 1] = y
      positions[v * 3 + 2] = z
      if (normals && srcN) normals.set(srcN.subarray(v * 3, v * 3 + 3), v * 3)
    }
  }
  return { positions, normals }
}

function transformPositions(m: Float32Array, src: Float32Array): Float32Array {
  const out = new Float32Array(src.length)
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i]
    const y = src[i + 1]
    const z = src[i + 2]
    out[i] = m[0] * x + m[4] * y + m[8] * z + m[12]
    out[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]
    out[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14]
  }
  return out
}

function transformNormals(m: Float32Array, src: Float32Array): Float32Array {
  const out = new Float32Array(src.length)
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i]
    const y = src[i + 1]
    const z = src[i + 2]
    const nx = m[0] * x + m[4] * y + m[8] * z
    const ny = m[1] * x + m[5] * y + m[9] * z
    const nz = m[2] * x + m[6] * y + m[10] * z
    const len = Math.hypot(nx, ny, nz) || 1
    out[i] = nx / len
    out[i + 1] = ny / len
    out[i + 2] = nz / len
  }
  return out
}

export function parseDffModel(bytes: Uint8Array): DffModel {
  const stream = new RwStream(bytes)
  const clumpSection = stream.topLevel().find((s) => s.type === RW.CLUMP)
  if (!clumpSection) throw new RwParseError('Not a RenderWare clump')

  const warnings: string[] = []
  const clump: Clump = { frames: [], bones: [] }
  const geometries: (Geometry | null)[] = []
  const atomics: Atomic[] = []

  for (const child of stream.children(clumpSection)) {
    switch (child.type) {
      case RW.FRAME_LIST:
        parseFrameList(stream, child, clump)
        break
      case RW.GEOMETRY_LIST:
        for (const g of stream.children(child)) {
          if (g.type !== RW.GEOMETRY) continue
          try {
            geometries.push(parseGeometry(stream, g, warnings))
          } catch (err) {
            geometries.push(null)
            warnings.push(`Geometry ${geometries.length - 1}: ${err instanceof Error ? err.message : err}`)
          }
        }
        break
      case RW.ATOMIC:
        try {
          atomics.push(parseAtomic(stream, child))
        } catch (err) {
          warnings.push(`Atomic: ${err instanceof Error ? err.message : err}`)
        }
        break
    }
  }

  const worlds = frameWorldMatrices(clump.frames)
  const placements = atomics.length
    ? atomics
    : geometries.map((_, i) => ({ frameIndex: -1, geometryIndex: i }))

  let skeleton: DffSkeleton | undefined
  let skeletonBones = 0
  for (const placement of placements) {
    const skin = geometries[placement.geometryIndex]?.skin
    if (skin && skin.boneCount > skeletonBones) skeletonBones = skin.boneCount
  }
  if (skeletonBones > 0) {
    skeleton = buildSkeleton(clump, worlds, skeletonBones) ?? undefined
    if (!skeleton) warnings.push('A character has a skin but no usable bone hierarchy')
  }

  const meshes: DffMesh[] = []
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  let broken = 0
  let strayBoneIndex = false

  for (const placement of placements) {
    const geometry = geometries[placement.geometryIndex]
    if (!geometry || geometry.indices.length === 0) continue

    const posed = geometry.skin ? bindPose(clump, worlds, geometry) : null
    const world = posed ? STAND_UP : (worlds[placement.frameIndex] ?? IDENTITY)
    const source = posed ?? geometry
    const positions = transformPositions(world, source.positions)
    const normals = source.normals ? transformNormals(world, source.normals) : undefined

    for (let i = 0; i < positions.length; i += 3) {
      for (let a = 0; a < 3; a++) {
        const v = positions[i + a]
        if (!Number.isFinite(v)) {
          broken++
          continue
        }
        if (v < min[a]) min[a] = v
        if (v > max[a]) max[a] = v
      }
    }

    const mesh: DffMesh = { positions, normals, indices: geometry.indices }

    if (skeleton && geometry.skin) {
      const skin = geometry.skin
      const count = positions.length / 3
      const boneIndices = new Uint8Array(count * 4)
      const boneWeights = new Float32Array(count * 4)
      for (let i = 0; i < count * 4; i++) {
        const bone = skin.indices[i]
        const weight = skin.weights[i]
        if (bone >= skeleton.bones.length) {
          if (weight > 0) strayBoneIndex = true
          continue
        }
        boneIndices[i] = bone
        boneWeights[i] = weight
      }
      mesh.boneIndices = boneIndices
      mesh.boneWeights = boneWeights
    }

    meshes.push(mesh)
  }

  if (strayBoneIndex) warnings.push('Some vertices name a bone the skeleton does not have')
  if (broken > 0) warnings.push(`${broken} vertex coordinates are not finite numbers`)
  if (meshes.length === 0) {
    warnings.push('The clump has no drawable geometry')
    min[0] = min[1] = min[2] = 0
    max[0] = max[1] = max[2] = 0
  }

  return {
    versionText: formatVersion(clumpSection.version),
    meshes,
    bounds: { min, max },
    warnings,
    skeleton,
  }
}
