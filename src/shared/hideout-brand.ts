/**
 * Marca de Hideout, centralizada para minimizar conflictos al hacer merge de upstream (Orca).
 * Superficies cubiertas: título de ventana, titlebar del renderer, tooltip de bandeja y panel "Acerca de".
 * config/electron-builder.config.cjs duplica appId/productName/executableName (es CJS; ver HIDEOUT.md).
 */
export const HIDEOUT_BRAND = {
  productName: 'Hideout',
  appId: 'com.complotcreativo.hideout',
  credit: 'Hideout by Complot Creativo',
  company: 'Complot Creativo'
} as const
