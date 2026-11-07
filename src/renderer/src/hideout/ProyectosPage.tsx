// Hideout: pestaña Proyectos. Enseña las carpetas reales de FREELACE: los
// proyectos de clientes y los personales (con su distintivo), con el último
// chat de Claude Code de cada uno y acceso directo a la carpeta.
import { useCallback, useEffect, useState } from 'react'
import { Briefcase, Copy, FolderOpen, House, MessageSquare, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProyectoHideout, ProyectosResumen } from '../../../shared/hideout-proyectos'

function tiempoRelativo(desde: number, ahora: number): string {
  const dias = Math.floor((ahora - desde) / 86_400_000)
  if (dias <= 0) {
    return 'hoy'
  }
  if (dias === 1) {
    return 'ayer'
  }
  if (dias < 30) {
    return `hace ${dias} días`
  }
  const meses = Math.floor(dias / 30)
  return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`
}

function TarjetaProyecto({
  proyecto,
  ahora
}: {
  proyecto: ProyectoHideout
  ahora: number
}): React.JSX.Element {
  const personal = proyecto.tipo === 'personal'
  const Icono = personal ? House : Briefcase
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-foreground/[0.02] px-4 py-3">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          personal ? 'bg-amber-400/10 text-amber-400' : 'bg-primary/10 text-primary'
        )}
      >
        <Icono className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold">{proyecto.nombre}</span>
          {personal ? (
            <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              personal
            </span>
          ) : proyecto.cliente ? (
            <span className="truncate rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] text-muted-foreground">
              {proyecto.cliente}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>carpeta: {tiempoRelativo(proyecto.modificado, ahora)}</span>
          {proyecto.ultimoChat !== null ? (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3" />
              último chat {tiempoRelativo(proyecto.ultimoChat, ahora)}
            </span>
          ) : (
            <span className="opacity-60">sin chats</span>
          )}
        </div>
      </div>
      <button
        type="button"
        title="Copiar ruta para abrir un chat aquí"
        onClick={() => {
          void navigator.clipboard.writeText(proyecto.ruta)
          toast.success('Ruta copiada')
        }}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
      >
        <Copy className="size-4" />
      </button>
      <button
        type="button"
        title="Abrir la carpeta"
        onClick={() => void window.api.hideout.proyectosAbrir(proyecto.ruta)}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
      >
        <FolderOpen className="size-4" />
      </button>
    </div>
  )
}

export default function ProyectosPage(): React.JSX.Element {
  const [resumen, setResumen] = useState<ProyectosResumen | null>(null)
  const cargar = useCallback(() => {
    void window.api.hideout.proyectosResumen().then(setResumen)
  }, [])
  useEffect(cargar, [cargar])

  const clientes = resumen?.proyectos.filter((p) => p.tipo === 'cliente') ?? []
  const personales = resumen?.proyectos.filter((p) => p.tipo === 'personal') ?? []
  return (
    <div className="scrollbar-sleek flex h-full flex-col overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-2 flex items-center gap-3">
          <FolderOpen className="size-5 text-muted-foreground" />
          <h1 className="flex-1 text-lg font-semibold tracking-tight">Proyectos</h1>
          <button
            type="button"
            onClick={cargar}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
          >
            <RefreshCw className="size-3.5" /> Actualizar
          </button>
        </div>
        <p className="mb-6 text-[13px] text-muted-foreground">
          Lo que hay en {resumen?.raiz ?? 'tu carpeta de trabajo'}: clientes en la raíz y tus
          proyectos personales aparte. El botón de copiar te deja la ruta lista para abrir un chat.
        </p>
        {resumen && resumen.proyectos.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No se encontraron proyectos.</p>
        ) : null}
        {clientes.length > 0 ? (
          <>
            <h2 className="mb-2 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
              Clientes
            </h2>
            <div className="mb-6 space-y-2">
              {clientes.map((proyecto) => (
                <TarjetaProyecto
                  key={proyecto.ruta}
                  proyecto={proyecto}
                  ahora={resumen?.generadoEn ?? proyecto.modificado}
                />
              ))}
            </div>
          </>
        ) : null}
        {personales.length > 0 ? (
          <>
            <h2 className="mb-2 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
              Personales
            </h2>
            <div className="space-y-2">
              {personales.map((proyecto) => (
                <TarjetaProyecto
                  key={proyecto.ruta}
                  proyecto={proyecto}
                  ahora={resumen?.generadoEn ?? proyecto.modificado}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
