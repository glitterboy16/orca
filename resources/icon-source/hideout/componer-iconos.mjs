// Iconos de Hideout con el mochuelo del Rijksmuseum: busto con fundido inferior.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const sharp = createRequire(
  'C:/Users/villo/Desktop/FREELACE/Nach - Proyectos/casatere/herramientas/grabados/package.json'
)('sharp')
const pngToIcoMod = createRequire(
  'C:/Users/villo/AppData/Local/Temp/claude/c--Users-villo-Desktop-FREELACE-Personal-Hideout/ee56b624-593b-4561-8009-0d4a9bb6e057/scratchpad/icon/package.json'
)('png-to-ico')
const pngToIco = pngToIcoMod.default ?? pngToIcoMod

const SALIDA = path.join(AQUI, 'iconos-mochuelo')
const fs = await import('node:fs/promises')
await fs.mkdir(SALIDA, { recursive: true })

const fondoSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#101013"/><stop offset="1" stop-color="#060607"/>
  </linearGradient></defs>
  <rect width="1024" height="1024" rx="188" fill="url(#bg)"/>
  <rect x="14" y="14" width="996" height="996" rx="176" fill="none" stroke="#FFFFFF" stroke-opacity="0.07" stroke-width="4"/>
</svg>`)
const puntoDev = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><circle cx="880" cy="880" r="74" fill="#E8B04B"/></svg>`
)

// 1 · Busto: recorte del mochuelo sin libro + fundido de alfa hacia abajo
const SRC = path.join(AQUI, 'grabado-salida', 'mochuelo.png')
const bust = await sharp(SRC)
  .extract({ left: 30, top: 0, width: 720, height: 800 })
  .png()
  .toBuffer()
const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="800">
  <defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.76" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="720" height="800" fill="url(#f)"/>
</svg>`)
const busto = await sharp(bust)
  .composite([{ input: await sharp(fade).png().toBuffer(), blend: 'dest-in' }])
  .png()
  .toBuffer()
writeFileSync(path.join(SALIDA, 'busto.png'), busto)

// 2 · Icono grande
const b = await sharp(busto).resize({ height: 760 }).png().toBuffer()
const bm = await sharp(b).metadata()
const icono1024 = await sharp(await sharp(fondoSvg).png().toBuffer())
  .composite([{ input: b, left: Math.round((1024 - bm.width) / 2), top: 140 }])
  .png()
  .toBuffer()
writeFileSync(path.join(SALIDA, 'icon-1024.png'), icono1024)
for (const s of [512, 256, 128, 64]) {
  writeFileSync(
    path.join(SALIDA, `icon-${s}.png`),
    await sharp(icono1024).resize(s, s).png().toBuffer()
  )
}
const dev1024 = await sharp(icono1024)
  .composite([{ input: await sharp(puntoDev).png().toBuffer() }])
  .png()
  .toBuffer()
writeFileSync(
  path.join(SALIDA, 'icon-dev-256.png'),
  await sharp(dev1024).resize(256, 256).png().toBuffer()
)

// 3 · Mini: solo la cara (ojos severos) para 16-48
const cara = await sharp(SRC)
  .extract({ left: 380, top: 10, width: 330, height: 300 })
  .png()
  .toBuffer()
const c = await sharp(cara).resize({ width: 900 }).png().toBuffer()
const cm = await sharp(c).metadata()
const mini1024 = await sharp(await sharp(fondoSvg).png().toBuffer())
  .composite([{ input: c, left: 62, top: Math.round((1024 - cm.height) / 2) }])
  .png()
  .toBuffer()
writeFileSync(path.join(SALIDA, 'mini-1024.png'), mini1024)
for (const s of [48, 32, 16]) {
  writeFileSync(
    path.join(SALIDA, `mini-${s}.png`),
    await sharp(mini1024).resize(s, s).png().toBuffer()
  )
}

// 4 · ICO por tamaños
const partes = ['icon-256', 'icon-128', 'icon-64', 'mini-48', 'mini-32', 'mini-16'].map((n) =>
  path.join(SALIDA, `${n}.png`)
)
writeFileSync(path.join(SALIDA, 'icon.ico'), await pngToIco(partes))

// 5 · Marca (logo.svg): busto blanco sobre transparente
const marcaPng = await sharp(busto).resize({ height: 640 }).png().toBuffer()
const m = await sharp(marcaPng).metadata()
const x = Math.round((1024 - m.width) / 2)
const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Hideout: mochuelo de "Uil zittend op een boek" (Frans Everbag, Rijksmuseum, CC0),
     grabado procesado a tinta blanca. Fuentes en resources/icon-source/hideout/ -->
<svg version="1.1" width="202.66667" height="202.66667" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image x="${x}" y="192" width="${m.width}" height="640" xlink:href="data:image/png;base64,${marcaPng.toString('base64')}"/>
</svg>
`
writeFileSync(path.join(SALIDA, 'logo.svg'), svg)

const marcaPrevia = await sharp({
  create: { width: 360, height: 360, channels: 4, background: '#0B0B0D' }
})
  .composite([
    { input: await sharp(busto).resize({ height: 300 }).png().toBuffer(), left: 45, top: 30 }
  ])
  .png()
  .toBuffer()
writeFileSync(path.join(SALIDA, 'marca-previa.png'), marcaPrevia)

console.log('listo en', SALIDA)
