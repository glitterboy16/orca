# Ideas de Hideout

Las 82 ideas del plan inicial (Nov 2026), con estado. ★ = las que más rentan.
Estados: `[x]` hecho · `[o]` lo trae Orca de serie · `[ ]` pendiente.

## Top 5 — por aquí se empieza

| #   | Idea                                                                         | Por qué primero                                                                              |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | ★ Contador de tokens en vivo por chat, proyecto y día (JSONL de Claude Code) | El corazón de la Fase 1: datos que ya están en disco, nadie más los enseña así               |
| 3   | ★ Detector de chats olvidados                                                | Ataca directamente el límite de la suscripción; se apoya en los mismos JSONL que el contador |
| 5   | Medidor de contexto por chat (verde/ámbar/rojo + /compact)                   | Mismo origen de datos; evita compactados de pánico                                           |
| 25  | ★ Biblioteca de skills (instaladas, activas, por proyecto)                   | Solo lectura de `~/.claude/skills` y plugins: mucho valor, poco riesgo                       |
| 16  | ★ Plantillas de proyecto (Landing, PrestaShop, Laravel+React, Shopify, n8n)  | Convierte Hideout en TU flujo de trabajo, no un Orca pintado                                 |

La nº 2 (barra de límite siempre visible) ya la cubre la barra de uso de Orca
("Usado X% · modelo"); si hace falta la hora de reinicio, se amplía luego.

## Consumo y ahorro

- [ ] 1. ★ Contador de tokens en vivo por chat, proyecto y día, leyendo los JSONL de Claude Code
- [o] 2. ★ Barra de límite de sesión y semanal siempre visible (la barra de uso de Orca; falta hora de reinicio)
- [ ] 3. ★ Detector de chats olvidados: sesiones sin actividad > X horas, con cerrar o compactar
- [ ] 4. ★ Aviso "cambiaste de tarea, haz /clear" cuando el tema del prompt cambia mucho
- [ ] 5. Medidor de contexto por chat (verde, ámbar o rojo) con botón de /compact
- [ ] 6. Ranking de qué consume más: skills, subagentes y MCP
- [ ] 7. Interruptor de MCP por proyecto
- [ ] 8. Modelo por tarea (Haiku/Sonnet para subagentes, Opus para lo difícil)
- [ ] 9. Modo ahorro: perfil con context-mode, Ponytail y respuestas cortas
- [ ] 10. PDF/Word al chat → MarkItDown automático
- [ ] 11. Hook de lecturas grandes con modelo barato, por proyecto
- [ ] 12. Graphify automático al abrir repos grandes
- [ ] 13. Informe semanal de consumo
- [ ] 14. Comparativa de consumo antes/después de activar una skill o MCP

## Proyectos y chats

- [ ] 15. ★ Pantalla de inicio con proyectos, estado y último chat
- [ ] 16. ★ Plantillas de proyecto con sus skills y MCP
- [o] 17. Varios chats por proyecto en pestañas, cada uno en su worktree
- [o] 18. Misma tarea a dos agentes, quedarse con la mejor rama
- [ ] 19. Nombres automáticos de chat
- [ ] 20. Buscador global en todos los chats
- [ ] 21. Notas fijadas por proyecto (CLAUDE.md editable desde la UI)
- [ ] 22. Ficha de cliente por proyecto
- [ ] 23. Reanudar chats antiguos con contexto resumido
- [ ] 24. Archivar proyectos terminados

## Skills

- [ ] 25. ★ Biblioteca de skills con buscador: instaladas, activas, por proyecto, consumo
- [ ] 26. ★ Buscador de skills nuevas (GitHub, skills.sh) filtrado por nicho
- [ ] 27. Revisión de seguridad antes de instalar (SKILL.md + scripts)
- [ ] 28. Packs de skills: Web, Ecommerce, Automatización
- [ ] 29. Valoración propia de skills
- [ ] 30. Crear una skill desde un chat que salió bien
- [ ] 31. Aviso de actualizaciones de skills

## Web y diseño

- [ ] 32. ★ Vista previa en vivo del proyecto al lado del chat
- [ ] 33. ★ Ciclo construir → navegador → captura → Claude revisa → corrige
- [ ] 34. Capturas móvil/tablet/escritorio a la vez
- [o] 35. Modo diseño (Design Mode de Orca)
- [ ] 36. Botón de /design con tres direcciones en tarjetas
- [ ] 37. Auditoría Lighthouse con un clic
- [ ] 38. Comprobador de SEO: metas, OG, sitemap, schema
- [ ] 39. Biblioteca de DESIGN.md para elegir estilo
- [ ] 40. Paleta y tipografía de marca por cliente
- [ ] 41. Grabador integrado como herramienta de ilustraciones
- [ ] 42. Generador de favicon y OG image
- [ ] 43. Comparador visual entre versiones

## Despliegue y servidores

- [ ] 44. ★ Desplegar a VPS (Nginx Proxy Manager) o Vercel desde un botón
- [ ] 45. Estado de servidores: n8n, Evolution API, Supabase
- [ ] 46. DNS de Cloudflare básico
- [ ] 47. Variables de entorno por proyecto, cifradas
- [ ] 48. Checklist previo al despliegue

## Navegador

- [ ] 49. Pestaña de navegador controlada por agentes
- [ ] 50. Grabar flujo → test de Playwright
- [ ] 51. Consola y red del navegador visibles para Claude

## Interfaz y experiencia

- [x] 52. Tema negro (por defecto desde Fase 0; falta color de acento configurable)
- [o] 53. Paleta de comandos (Ctrl+K)
- [ ] 54. Atajos para cambiar de chat y proyecto
- [ ] 55. Notificación de Windows al terminar o pedir permiso un agente
- [o] 56. App móvil (companion de Orca)
- [ ] 57. Editor Monaco integrado

## Negocio (Complot Creativo)

- [ ] 58. Horas reales por proyecto
- [ ] 59. Exportar resumen de proyecto para el portfolio
- [ ] 60. Carpeta de gestoría por trimestre
- [ ] 61. ★ Captador de clientes (webs malas por sector y provincia + maqueta)
- [ ] 62. ★ Closer de LinkedIn asistido (nunca bot: LinkedIn bloquea cuentas automatizadas)
- [ ] 63. Nichos con plantilla propia (restaurantes, clínicas, despachos, comercios, alojamientos)
- [ ] 64. Analizador de referencias → DESIGN.md + palabras clave
- [ ] 65. Casos de éxito automáticos (ficha portfolio + guion de reel)
- [ ] 66. Programa de referidos
- [ ] 67. ★ Agenda de videollamadas (reserva + Meet + recordatorio WhatsApp)
- [ ] 68. ★ Preparador de reunión (ficha, auditoría, maqueta, 3 preguntas, precio)
- [ ] 69. Resumen de llamada → propuesta en < 1 h
- [ ] 70. Brief → propuesta en 10 min
- [ ] 71. Propuesta web interactiva con aceptación y pago de señal
- [ ] 72. Packs cerrados: Web Express, Web + SEO local, Ecommerce, Mantenimiento
- [ ] 73. CRM integrado con seguimiento
- [ ] 74. ★ Kit de bloques Complot (secciones probadas)
- [ ] 75. Entrada de contenido sin fricción (WhatsApp/PDF → colocado)
- [ ] 76. Enlace de revisión para el cliente (comentario → tarea)
- [ ] 77. Control de calidad + informe PDF con marca
- [ ] 78. Máquina de SEO local
- [ ] 79. ★ Mantenimiento como cuota (vigilancia + informe mensual)
- [ ] 80. Kit de entrega (manual, credenciales, factura al gestor)
- [ ] 81. Detector de ventas adicionales
- [ ] 82. ★ Panel de la meta: facturado, propuesta, recurrente, previsión vs 7.000 €

> Aviso legal del plan: prospección en frío por email/WhatsApp sin consentimiento
> está restringida en España (LSSI/RGPD), también entre empresas. LinkedIn manual,
> llamadas y formularios de contacto son vías más seguras.
