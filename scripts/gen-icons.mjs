// Generates the PWA icons (no dependencies) so a fresh clone has them.
// Pure-Node PNG encoder: navy background + cream triangle "ship".
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public')
mkdirSync(outDir, { recursive: true })

const BG = [11, 31, 58, 255] // #0b1f3a
const SHIP = [242, 226, 182, 255] // #f2e2b6
const EDGE = [138, 109, 31, 255] // #8a6d1f

function drawIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4)
  const inset = maskable ? 0.26 : 0.16 // maskable keeps the shape in the safe zone
  const topY = size * inset
  const botY = size * (1 - inset)
  const cx = size / 2
  const halfBase = size * (0.5 - inset)
  const edge = Math.max(2, size * 0.012)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let c = BG
      if (y >= topY && y <= botY) {
        const w = halfBase * ((y - topY) / (botY - topY))
        const d = Math.abs(x - cx)
        if (d <= w) c = SHIP
        else if (d <= w + edge) c = EDGE
      }
      const i = (y * size + x) * 4
      buf[i] = c[0]
      buf[i + 1] = c[1]
      buf[i + 2] = c[2]
      buf[i + 3] = c[3]
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
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  const stride = size * 4 + 1
  const raw = Buffer.alloc(size * stride)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0 // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = deflateSync(raw)
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
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
