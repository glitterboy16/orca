// Compone los iconos de Hideout con el grabado del búho Mephistopheles.
// sharp se toma del Grabador de Casa Tere; png-to-ico del proyecto de iconos previo.
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

const SALIDA = path.join(AQUI, 'iconos')
const GRABADO = path.join(AQUI, 'grabado-salida')
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

const fs = await import('node:fs/promises')
await fs.mkdir(SALIDA, { recursive: true })

const fondo = await sharp(fondoSvg).png().toBuffer()

// Icono grande: búho entero (805×1000) a 800 de alto, centrado
const buho = await sharp(path.join(GRABADO, 'buho.png')).resize({ height: 800 }).png().toBuffer()
const buhoMeta = await sharp(buho).metadata()
const icono1024 = await sharp(fondo)
  .composite([{ input: buho, left: Math.round((1024 - buhoMeta.width) / 2), top: 112 }])
  .png()
  .toBuffer()
writeFileSync(path.join(SALIDA, 'icon-1024.png'), icono1024)
for (const s of [512, 256, 128, 64]) {
  writeFileSync(
    path.join(SALIDA, `icon-${s}.png`),
    await sharp(icono1024).resize(s, s).png().toBuffer()
  )
}

// Icono dev: punto ámbar
const dev1024 = await sharp(icono1024)
  .composite([{ input: await sharp(puntoDev).png().toBuffer() }])
  .png()
  .toBuffer()
writeFileSync(
  path.join(SALIDA, 'icon-dev-256.png'),
  await sharp(dev1024).resize(256, 256).png().toBuffer()
)

// Mini: solo la cara (320×228) a 880 de ancho, centrada
const cara = await sharp(path.join(GRABADO, 'buho-cara.png'))
  .resize({ width: 880 })
  .png()
  .toBuffer()
const caraMeta = await sharp(cara).metadata()
const mini1024 = await sharp(fondo)
  .composite([{ input: cara, left: 72, top: Math.round((1024 - caraMeta.height) / 2) }])
  .png()
  .toBuffer()
for (const s of [48, 32, 16]) {
  writeFileSync(
    path.join(SALIDA, `mini-${s}.png`),
    await sharp(mini1024).resize(s, s).png().toBuffer()
  )
}

// ICO: escena completa en 256/128/64, cara en 48/32/16
const partes = ['icon-256', 'icon-128', 'icon-64', 'mini-48', 'mini-32', 'mini-16'].map((n) =>
  path.join(SALIDA, `${n}.png`)
)
writeFileSync(path.join(SALIDA, 'icon.ico'), await pngToIco(partes))

// Marca para la app (logo.svg): búho blanco sobre transparente, PNG incrustado
const marcaPng = await sharp(path.join(GRABADO, 'buho.png'))
  .resize({ height: 640 })
  .png()
  .toBuffer()
const m = await sharp(marcaPng).metadata()
const x = Math.round((1024 - m.width) / 2)
const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Hideout: búho "Mephistopheles" (Popular Science Monthly, 1899, dominio público),
     grabado procesado a tinta blanca con el Grabador. Fuente en resources/icon-source/hideout/ -->
<svg version="1.1" width="202.66667" height="202.66667" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image x="${x}" y="192" width="${m.width}" height="640" xlink:href="data:image/png;base64,${marcaPng.toString('base64')}"/>
</svg>
`
writeFileSync(path.join(SALIDA, 'logo.svg'), svg)

// Previa de la marca sobre fondo oscuro para revisar
const marcaPrevia = await sharp({
  create: { width: 360, height: 360, channels: 4, background: '#0B0B0D' }
})
  .composite([
    { input: await sharp(marcaPng).resize({ height: 300 }).png().toBuffer(), left: 120, top: 30 }
  ])
  .png()
  .toBuffer()
writeFileSync(path.join(SALIDA, 'marca-previa.png'), marcaPrevia)

console.log('iconos listos en', SALIDA)
