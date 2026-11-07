// Hideout: plantillas de proyecto (idea 16 del plan). Cada plantilla trae el
// CLAUDE.md listo para pegar en la carpeta nueva y el kit de skills y MCP que
// conviene activar. v1 sin tocar el flujo de creación de Orca: copiar y pegar.

export type HideoutPlantilla = {
  slug: string
  nombre: string
  descripcion: string
  skills: string[]
  mcp: string[]
  claudeMd: string
}

const REGLAS_COMUNES = `## Reglas de trabajo
- Responde en español, corto y directo. Código funcional antes que explicaciones.
- Commits pequeños por cada paso que funcione.
- Nada de datos del autónomo (DNI, cuentas bancarias) en chats, código o skills.
- Antes de dar algo por terminado: build limpio y captura de cómo se ve.`

export const HIDEOUT_PLANTILLAS: HideoutPlantilla[] = [
  {
    slug: 'landing',
    nombre: 'Landing',
    descripcion: 'Web de presentación para un negocio local: una página, SEO local y formulario.',
    skills: ['impeccable', 'frontend-design', 'seo', 'typeset', 'polish'],
    mcp: ['playwright (capturas y pruebas)', 'figma (si hay diseño previo)'],
    claudeMd: `# Proyecto: Landing — [CLIENTE]

Web de presentación de una página para [NEGOCIO] en [CIUDAD].

## Stack
- Vite + HTML/CSS/JS (o Astro si hay más de 3 páginas). Sin framework pesado.
- Despliegue como estático (VPS con Nginx o Vercel).

## Qué lleva siempre
- Hero con la propuesta clara y teléfono/WhatsApp visible.
- Secciones: servicios, pruebas sociales (reseñas), zona de cobertura, contacto.
- SEO local: title/meta por página, Open Graph, schema LocalBusiness, sitemap.
- Formulario con validación y aviso RGPD.
- Lighthouse ≥ 90 en rendimiento, SEO y accesibilidad antes de entregar.

${REGLAS_COMUNES}`
  },
  {
    slug: 'prestashop',
    nombre: 'PrestaShop',
    descripcion: 'Tienda PrestaShop: tema hijo, módulos y ajustes sin tocar el core.',
    skills: ['backend-patterns', 'security-review', 'seo'],
    mcp: ['playwright (probar el checkout)', 'markitdown (catálogos en PDF/Excel)'],
    claudeMd: `# Proyecto: PrestaShop — [CLIENTE]

Tienda PrestaShop [VERSIÓN] para [NEGOCIO].

## Reglas de PrestaShop
- NUNCA tocar el core: todo va en tema hijo, overrides o módulos propios.
- Tema hijo sobre [TEMA PADRE]; los cambios de plantilla en /themes/[hijo]/.
- Módulos propios con prefijo cc_ (Complot Creativo) y desinstalación limpia.
- Antes de cualquier cambio en producción: copia de BD y modo mantenimiento.
- Probar SIEMPRE el flujo completo: ficha → carrito → checkout → email.

## Datos
- Multidioma: [SÍ/NO]. Transportistas: [LISTA]. Pasarelas: [LISTA].

${REGLAS_COMUNES}`
  },
  {
    slug: 'laravel-react',
    nombre: 'Laravel + React',
    descripcion: 'Aplicación a medida: API Laravel y frontal React (Inertia o SPA).',
    skills: [
      'laravel-patterns',
      'laravel-tdd',
      'laravel-security',
      'frontend-patterns',
      'api-design'
    ],
    mcp: ['playwright (e2e)', 'context7 (docs de librerías)'],
    claudeMd: `# Proyecto: App — [CLIENTE]

Aplicación [QUÉ HACE] con Laravel [VERSIÓN] + React.

## Stack
- Laravel con Inertia + React (o API + SPA si hay app móvil prevista).
- BD: MySQL/Postgres. Colas con database driver salvo que haya Redis.
- Tests con Pest: feature tests de cada endpoint antes de darlo por hecho.

## Convenciones
- Form Requests para validar, Policies para autorizar, Actions para lógica.
- Nada de lógica en controladores ni en componentes de página.
- Migraciones reversibles y seeders de desarrollo realistas.

${REGLAS_COMUNES}`
  },
  {
    slug: 'shopify',
    nombre: 'Shopify',
    descripcion: 'Tienda Shopify: tema con secciones propias en Liquid o app embebida.',
    skills: ['frontend-design', 'seo', 'impeccable'],
    mcp: ['playwright (probar la tienda)', 'markitdown (catálogos del cliente)'],
    claudeMd: `# Proyecto: Shopify — [CLIENTE]

Tienda Shopify para [NEGOCIO].

## Reglas de Shopify
- Tema basado en [Dawn u otro]: cambios vía secciones y bloques propios, no
  editando las plantillas del tema base más de lo imprescindible.
- Desarrollo con Shopify CLI y theme dev sobre una tienda de desarrollo.
- Metafields para datos extra de producto; nada hardcodeado en Liquid.
- Apps de terceros: las mínimas; cada una se apunta en este archivo con su porqué.

${REGLAS_COMUNES}`
  },
  {
    slug: 'n8n',
    nombre: 'Automatización n8n',
    descripcion: 'Workflows de n8n para un cliente: integraciones, avisos y sincronizaciones.',
    skills: ['api-design', 'security-review'],
    mcp: ['n8n-mcp (SOLO en este tipo de proyecto)'],
    claudeMd: `# Proyecto: Automatización — [CLIENTE]

Workflows de n8n para [QUÉ AUTOMATIZA].

## Reglas de n8n
- Un workflow por proceso, con nombre claro: [cliente] - [proceso].
- Credenciales SIEMPRE en el gestor de credenciales de n8n, jamás en nodos.
- Cada workflow con manejo de errores (Error Trigger) y aviso si falla.
- Documentar en este archivo: disparador, pasos, sistemas que toca y qué
  hacer si se cae cada uno.
- Probar con datos de prueba antes de activar; los webhooks de producción
  se activan los últimos.

${REGLAS_COMUNES}`
  }
]
