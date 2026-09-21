
export interface DumpCell {
  hex: string
  chr: string
  hit: boolean
  id: string
}

export interface DumpRow {
  off: string
  cells: DumpCell[]
}

const enc = new TextEncoder()
const byteLength = (s: string) => enc.encode(s).length

function hitRanges(text: string, terms: string[]): [number, number][] {
  const ranges: [number, number][] = []
  for (const term of terms) {
    if (!term) continue
    let at = text.indexOf(term)
    while (at !== -1) {
      const start = byteLength(text.slice(0, at))
      ranges.push([start, start + byteLength(term)])
      at = text.indexOf(term, at + term.length)
    }
  }
  return ranges
}

export function termsIn(text: string, candidates: string[]): string[] {
  return Array.from(new Set(candidates))
    .filter((c) => c.length > 1 && text.includes(c))
    .sort((a, b) => b.length - a.length)
}

export function hexdump(text: string, terms: string[], perRow = 16): DumpRow[] {
  const bytes = Array.from(enc.encode(text))
  const ranges = hitRanges(text, terms)
  const isHit = (i: number) => ranges.some(([a, b]) => i >= a && i < b)

  return Array.from({ length: Math.ceil(bytes.length / perRow) }, (_, row) => {
    const at = row * perRow
    return {
      off: at.toString(16).padStart(8, '0'),
      cells: bytes.slice(at, at + perRow).map((b, k) => ({
        hex: b.toString(16).padStart(2, '0'),
        chr: b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.',
        hit: isHit(at + k),
        id: `${at + k}`,
      })),
    }
  })
}
