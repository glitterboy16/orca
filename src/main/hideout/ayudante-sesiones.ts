// Hideout: gestor de sesiones del Ayudante. Lista y cierra los procesos de
// Claude Code en ejecución en la máquina (claude.exe o node con cli.js) para
// que el chat pueda responder "¿qué hay abierto?" y "ciérralas todas".
import { spawn } from 'node:child_process'

export type SesionAbierta = {
  pid: number
  padrePid: number
  comando: string
}

const CONSULTA_PS = [
  "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'claude.exe' -or ($_.Name -eq 'node.exe' -and $_.CommandLine -match 'claude-code[\\\\/]cli\\.js') }",
  '| Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'
].join(' ')

function ejecutarPowerShell(comando: string): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const hijo = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', comando], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })
    let salida = ''
    hijo.stdout.on('data', (trozo: Buffer) => {
      salida = `${salida}${trozo.toString()}`
    })
    hijo.on('error', rechazar)
    hijo.on('close', () => resolver(salida))
  })
}

export async function listarSesionesClaude(): Promise<SesionAbierta[]> {
  if (process.platform !== 'win32') {
    return []
  }
  let crudo: string
  try {
    crudo = (await ejecutarPowerShell(CONSULTA_PS)).trim()
  } catch {
    return []
  }
  if (!crudo) {
    return []
  }
  try {
    const datos = JSON.parse(crudo) as
      | { ProcessId: number; ParentProcessId: number; CommandLine: string | null }
      | { ProcessId: number; ParentProcessId: number; CommandLine: string | null }[]
    const filas = Array.isArray(datos) ? datos : [datos]
    return filas.map((fila) => ({
      pid: fila.ProcessId,
      padrePid: fila.ParentProcessId,
      comando: (fila.CommandLine ?? '').slice(0, 200)
    }))
  } catch {
    return []
  }
}

/** Cierra todas las sesiones salvo las del árbol propio (el claude del Ayudante). */
export async function cerrarSesionesClaude(pidsPropios: Set<number>): Promise<SesionAbierta[]> {
  const sesiones = await listarSesionesClaude()
  const ajenas = sesiones.filter(
    (sesion) => !pidsPropios.has(sesion.pid) && !pidsPropios.has(sesion.padrePid)
  )
  await Promise.all(
    ajenas.map(
      (sesion) =>
        new Promise<void>((resolver) => {
          const hijo = spawn('taskkill', ['/pid', String(sesion.pid), '/t', '/f'], {
            stdio: 'ignore',
            windowsHide: true
          })
          hijo.on('error', () => resolver())
          hijo.on('close', () => resolver())
        })
    )
  )
  return ajenas
}

export function describirSesiones(sesiones: SesionAbierta[]): string {
  if (sesiones.length === 0) {
    return 'ninguna'
  }
  return sesiones
    .slice(0, 15)
    .map((sesion) => {
      const modo = / -p |--print|--output-format/.test(sesion.comando)
        ? 'automática'
        : 'interactiva'
      return `PID ${sesion.pid} (${modo})`
    })
    .join(', ')
}
