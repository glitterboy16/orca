# Marca de Hideout: el búho "Mephistopheles"

Grabado antiguo convertido a tinta blanca sobre transparente, al estilo de las
ilustraciones de Casa Tere (láminas científicas del XIX procesadas con el
**Grabador**, `casatere/herramientas/grabados`).

- **Obra**: _The owl Mephistopheles_, Popular Science Monthly vol. 55 (1899).
  Dominio público. Ficha: <https://commons.wikimedia.org/wiki/File:PSM_V55_D643_The_owl_mephistopheles.png>
- **Por qué un búho**: el vigilante nocturno del escondite — anida en huecos y
  ruinas, mira desde la oscuridad. Los dos ojos leen hasta a 16 px.

## Archivos

| Archivo                     | Qué es                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `psm-mephisto-original.png` | Lámina original escaneada (Wikimedia Commons)                                                |
| `hideout-grabado.json`      | Config del Grabador (recortes, peso, limpieza)                                               |
| `buho.png`                  | Grabado procesado: búho entero, tinta blanca sobre transparente                              |
| `buho-cara.png`             | Detalle de la cara, trazo engordado, para iconos de 16–48 px                                 |
| `componer-iconos.mjs`       | Composición de iconos (necesita `sharp` y `png-to-ico`; rutas de la sesión en que se generó) |

## Cómo regenerar

1. `node grabar.mjs hideout-grabado.json` con el Grabador de Casa Tere
   (o cualquier copia de la herramienta) desde una carpeta con `candidatos/psm-mephisto.png`.
2. `node componer-iconos.mjs` ajustando las rutas de la cabecera.
   El ICO lleva la escena completa en 256/128/64 y solo la cara en 48/32/16.

Destinos: `resources/build/icon.{png,ico}`, `resources/icon.png`,
`resources/icon-dev.png` (punto ámbar) y `resources/logo.svg` (marca de la app).
