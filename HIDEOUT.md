# Hideout

Fork personal de [Orca](https://github.com/stablyai/orca) (stablyai/orca, MIT) rebautizado como **Hideout by Complot Creativo**. IDE de agentes para desarrollo web en Windows, con Claude Code como motor. Uso propio, sin distribución.

- Repo local: `C:\dev\hideout` · Rama de trabajo: `hideout/rebrand`
- `upstream` → stablyai/orca · `origin` → glitterboy16/orca (fork)

## Qué se ha cambiado (Fase 0 — 3 nov 2026)

| Cambio                    | Archivos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marca centralizada        | `src/shared/hideout-brand.ts` (nuevo; nombre, appId, crédito)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Título de ventana         | `src/main/window/createMainWindow.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Nombre en titlebar        | `src/renderer/src/app-shell/TitlebarLeftControls.tsx` (antes i18n `auto.App.5096cbbc86`; ahora constante, los 11 locales quedan intactos)                                                                                                                                                                                                                                                                                                                                                                                    |
| Tooltip de bandeja        | `src/main/tray/system-tray.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Panel "Acerca de"         | `src/main/startup/gpu-lifecycle.ts` (nombre + "Hideout by Complot Creativo")                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Tema oscuro por defecto   | `src/shared/default-global-settings.ts` (`theme: 'dark'`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Build Windows             | `config/electron-builder.config.cjs`: appId `com.complotcreativo.hideout`, productName/executableName `Hideout`                                                                                                                                                                                                                                                                                                                                                                                                              |
| Icono y logo              | `resources/icon.png`, `icon-dev.png` (punto ámbar), `build/icon.{png,ico}`, `logo.svg` — mochuelo de "Uil zittend op een boek" (Frans Everbag, Rijksmuseum, CC0) a tinta blanca: busto con fundido inferior, procesado con el Grabador de Casa Tere. Fuentes y créditos en `resources/icon-source/hideout/`                                                                                                                                                                                                                  |
| Borrado de sesiones Codex | Orca lo deshabilita porque el borrado parcial "resucita" (alias hardlink del bridge de cuentas + thread en `state_N.sqlite` que el backfill rematerializa). Hideout borra todos los alias por ruta de fecha (`src/main/ai-vault/codex-session-delete-aliases.ts`) y olvida el thread y sus tablas auxiliares en la base (`src/main/codex/codex-state-db-thread-delete.ts`, best-effort). `codex` entra en `AI_VAULT_DELETABLE_AGENTS` y el handler local valida con las raíces reales del escáner (`host-session-delete.ts`) |

| Panel de Consumo (ideas 1, 3, 5) | Código propio en `src/main/hideout/` (escáner de `~/.claude/projects/*/*.jsonl` con cache por mtime) y `src/renderer/src/hideout/ConsumoPage.tsx`. Enganches mínimos en Orca: vista `consumo` (`ui-chrome-types`, `top-level-view`, `UiViewHistory`, enum RPC móvil), render en `AppWorkspaceShell`, botón en `SidebarNav`, bridge en `preload` y registro IPC en `main-window-core-services` |
| Plantillas de proyecto (idea 16, v1) | `src/shared/hideout-plantillas.ts` + `src/renderer/src/hideout/PlantillasPage.tsx` (vista `plantillas`): Landing, PrestaShop, Laravel+React, Shopify y n8n con CLAUDE.md y kit de skills/MCP copiables |
| Skills visible de serie (idea 25) | `default-global-settings.ts` (`showSkillsButton: true`) y `shouldShowSkillsButton` pasa a `!== false` (en Orca es opt-in) |
| Ayudante flotante | Chat disponible en todas las vistas que responde sobre lo que hay en pantalla y el código de la app. `src/shared/hideout-ayudante.ts`, `src/main/hideout/ayudante-ipc.ts` (lanza `claude -p` solo lectura —Read/Glob/Grep— con captura de la ventana como contexto; conversación persistente vía `--resume`, estado en `userData/hideout-ayudante.json`) y `src/renderer/src/hideout/AyudanteChat.tsx`. Enganches: montaje en `AppWorkspaceShell`, API `hideout` en preload y registro IPC en `main-window-core-services` |

**Sin tocar a propósito:**

- Esquema `orca://` (protocols): lo usan los deep links de la app móvil y la nube. Renombrarlo rompería esos flujos.
- `package.json` → `name`/`version`: el versionado sigue a Orca para que los merges sean triviales.
- `icon.icns` (macOS) y los iconos de bandeja template de macOS (`resources/tray/orca-menu-bar*`).
- Las ~460 apariciones de "Orca" en textos de i18n, docs y tests: son superficie de conflicto en cada merge. Solo se rebautizan superficies visibles.

## Cómo actualizar desde upstream

Orca publica varias versiones al día. Flujo:

```bash
cd C:\dev\hideout
git fetch upstream
git merge upstream/main      # sobre hideout/rebrand
pnpm install                 # por si cambió el lockfile
pnpm tc && pnpm dev          # comprobar
```

Los conflictos esperables se limitan a los 8 archivos de la tabla. Si upstream toca una de esas líneas, conserva la variante Hideout (la constante de `hideout-brand.ts`).

> El primer `git remote rename` tardó +40 min por los ~13.600 refs remotos de Orca; se completó lo esencial y se cortó. Si algún día `git fetch upstream` se queja de refs, basta `git remote prune upstream`.

## Requisitos de la máquina (comprobados 3 nov 2026)

Git 2.47 (longpaths ON) · Node 24.15 · pnpm 12.14 (fijado por `packageManager`) · Python 3.14 · VS Build Tools 2022 C++ · gh CLI autenticado (glitterboy16).

## Comandos útiles

- `pnpm dev` — arrancar en desarrollo (primera build ~2 min, luego menos)
- `pnpm dev:fresh` — igual pero con perfil limpio (para probar defaults como el tema)
- `pnpm tc` — typecheck · `pnpm lint` — lint completo · `pnpm check:changed` — antes de cada push
- `pnpm build:win` — instalador de Windows (no necesario para uso diario)
- `ORCA_BACKGROUND_LAUNCH=1 pnpm dev` — arrancar sin robar el foco (para agentes)

## Pendiente inmediato

1. **Crear el fork en GitHub** (bloqueado para el agente por permisos): `gh repo fork stablyai/orca --clone=false` y luego `git push -u origin hideout/rebrand`.
2. Comprobar que el tema oscuro aplica también al perfil dev ya existente (el default solo cubre perfiles nuevos; si no, Ajustes → tema o `pnpm dev:fresh`).

## Roadmap

**Fase 1 — Interfaz propia (1–2 semanas):** sidebar (Nuevo proyecto, Proyectos, Chats, Skills, Consumo, Ajustes) · panel de consumo leyendo `%USERPROFILE%\.claude\projects\*.jsonl` (tokens por mensaje, por chat y por proyecto) · biblioteca de skills (`~/.claude/skills` + por proyecto), activar/desactivar.

**Fase 2 — Kit web (2–3 semanas):** packs de skills de diseño y MCP por plantilla de proyecto · Obscura/Playwright con capturas dentro de la app · botón /design y flujo diseñar → construir → probar → capturar.

**Fase 3 — Ahorro avanzado:** context-mode, hook de lecturas grandes, Code Mode, Graphify (midiendo antes/después) · avisos de chats olvidados o contexto lleno.

Detalle completo de las 82 ideas: `Hideout — Plan inicial.md` (Notion/Desktop).
