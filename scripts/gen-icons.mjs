// Generates the PWA icons (no dependencies) so a fresh clone has them.
// Pure-Node PNG encoder; draws the cream fighter over an ocean gradient.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public')
mkdirSync(outDir, { recursive: true })

// Fighter silhouette (nose up) in a 512-unit design space.
const PLANE = [
  [256, 64],
  [273, 120],
  [273, 176],
  [292, 206],
  [432, 276],
  [432, 298],
  [292, 256],
  [273, 356],
  [332, 398],
  [332, 420],
  [278, 408],
  [256, 432],
  [234, 408],
  [180, 420],
  [180, 398],
  [239, 356],
  [220, 256],
  [80, 298],
  [80, 276],
  [220, 206],
  [239, 176],
  [239, 120]
]
const DCX = 256
const DCY = 248
const COCK = [256, 188, 16, 24] // x, y, rx, ry (design space)

const CREAM = [242, 226, 182]
const EDGE = [58, 44, 16]
const RED = [178, 59, 59]
const SHADOW = [4, 12, 24]
const OCEAN_TOP = [10, 35, 66]
const OCEAN_BOT = [26, 95, 158]

const lerp = (a, b, t) => a + (b - a) * t
const blend = (a, b, t) => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t))
]

function pointInPoly(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function distToPoly(px, py, poly) {
  let min = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const x1 = poly[i][0]
    const y1 = poly[i][1]
    const x2 = poly[j][0]
    const y2 = poly[j][1]
    const dx = x2 - x1
    const dy = y2 - y1
    const len2 = dx * dx + dy * dy || 1
    let t = ((px - x1) * dx + (py - y1) * dy) / len2
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const d = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
    if (d < min) min = d
  }
  return min
}

function drawIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4)
  const scale = (maskable ? 0.6 : 0.76) * (size / 512)
  const cx = size / 2
  const cy = size * 0.52
  const tf = ([x, y]) => [cx + (x - DCX) * scale, cy + (y - DCY) * scale]
  const poly = PLANE.map(tf)
  const shadow = PLANE.map(([x, y]) => tf([x + 14, y + 22]))
  const [ckx, cky] = tf([COCK[0], COCK[1]])
  const ckrx = COCK[2] * scale
  const ckry = COCK[3] * scale
  const edgeW = Math.max(2, 7 * scale)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let c = blend(OCEAN_TOP, OCEAN_BOT, y / size)
      if (pointInPoly(x, y, shadow) && !pointInPoly(x, y, poly)) c = blend(c, SHADOW, 0.3)
      if (pointInPoly(x, y, poly)) {
        c = distToPoly(x, y, poly) < edgeW ? EDGE : CREAM
        const ex = (x - ckx) / ckrx
        const ey = (y - cky) / ckry
        if (ex * ex + ey * ey <= 1) c = RED
      }
      const i = (y * size + x) * 4
      buf[i] = c[0]
      buf[i + 1] = c[1]
      buf[i + 2] = c[2]
      buf[i + 3] = 255
    }
  }
  return buf
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = size * 4 + 1
  const raw = Buffer.alloc(size * stride)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

function faviconSvg() {
  const s = 64 / 512
  const cx = 32
  const cy = 64 * 0.52
  const scale = 0.76 * s
  const tf = ([x, y]) => [(cx + (x - DCX) * scale).toFixed(1), (cy + (y - DCY) * scale).toFixed(1)]
  const pts = PLANE.map((p) => tf(p).join(',')).join(' ')
  const [ckx, cky] = tf([COCK[0], COCK[1]])
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<defs><linearGradient id="o" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#0a2342"/><stop offset="1" stop-color="#1a5f9e"/></linearGradient></defs>' +
    '<rect width="64" height="64" rx="12" fill="url(#o)"/>' +
    '<polygon points="' +
    pts +
    '" fill="#f2e2b6" stroke="#3a2c10" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<ellipse cx="' +
    ckx +
    '" cy="' +
    cky +
    '" rx="' +
    (COCK[2] * scale).toFixed(1) +
    '" ry="' +
    (COCK[3] * scale).toFixed(1) +
    '" fill="#b23b3b"/></svg>\n'
  )
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, false]
]
for (const [name, size, maskable] of targets) {
  writeFileSync(join(outDir, name), encodePNG(size, drawIcon(size, maskable)))
  console.log('wrote public/' + name)
}
writeFileSync(join(outDir, 'favicon.svg'), faviconSvg())
console.log('wrote public/favicon.svg')
