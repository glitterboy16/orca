# Marca de Hideout: el mochuelo del Rijksmuseum

Grabado antiguo convertido a tinta blanca sobre transparente, al estilo de las
ilustraciones de Casa Tere (láminas del XIX-XX procesadas con el **Grabador**,
`casatere/herramientas/grabados`).

- **Obra**: _Uil zittend op een boek_ (mochuelo sobre un libro), Frans Everbag,
  Rijksmuseum RP-P-1931-1131, 1887–1931. Licencia CC0.
  Ficha: <https://commons.wikimedia.org/wiki/File:Uil_zittend_op_een_boek,_RP-P-1931-1131.jpg>
- **Por qué**: el vigilante nocturno del escondite. La aguatinta tonal, al
  invertirla, deja una lechuza blanca de mirada severa emergiendo del negro.
- **Composición**: busto con fundido inferior (el libro original traía pared y
  papeles que ensuciaban el icono). El ICO usa el busto en todos los tamaños:
  a 16–64 px lee como silueta de lechuza blanca.

## Archivos

| Archivo                 | Qué es                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `uil-boek-original.jpg` | Lámina original escaneada (Wikimedia Commons)                                                |
| `hideout-grabado.json`  | Config del Grabador (recorte, peso, limpieza, aplanado)                                      |
| `mochuelo.png`          | Grabado procesado completo (con libro), tinta blanca sobre transparente                      |
| `busto.png`             | Busto recortado con fundido inferior: la marca final                                         |
| `componer-iconos.mjs`   | Composición de iconos (necesita `sharp` y `png-to-ico`; rutas de la sesión en que se generó) |

## Cómo regenerar

1. `node grabar.mjs hideout-grabado.json` con el Grabador de Casa Tere desde una
   carpeta con `candidatos/uil-boek.jpg` (la pieza se llama `mochuelo`).
2. `node componer-iconos.mjs` ajustando las rutas de la cabecera. El busto se
   recorta de `mochuelo.png` (30,0,720×800) con degradado de alfa al 76–100 %.

Destinos: `resources/build/icon.{png,ico}`, `resources/icon.png`,
`resources/icon-dev.png` (punto ámbar) y `resources/logo.svg` (marca de la app).
