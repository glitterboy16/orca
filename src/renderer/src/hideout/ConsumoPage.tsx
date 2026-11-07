// Hideout: panel de consumo (ideas 1, 3 y 5 del plan). Lee el resumen que el
// main agrega de ~/.claude/projects y lo muestra por día, proyecto y chat.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlarmClockOff, Copy, Gauge, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  CONSUMO_CONTEXTO_LIMITE,
  type ConsumoResumen,
  type ConsumoSesion
} from '../../../shared/hideout-consumo'

const fmt = new Intl.NumberFormat('es-ES')
function tokens(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.', ',')} M`
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1_000)} k`
  }
  return fmt.format(n)
}

function hace(epochMs: number): string {
  const min = Math.max(0, Math.round((Date.now() - epochMs) / 60_000))
  if (min < 60) {
    return `hace ${min} min`
  }
  const horas = Math.round(min / 60)
  if (horas < 48) {
    return `hace ${horas} h`
  }
  return `hace ${Math.round(horas / 24)} días`
}

/** Tokens que gastan límite de verdad: lo nuevo que entra y lo que sale. */
const gasto = (x: { entrada: number; salida: number; cacheEscrita: number }): number =>
  x.entrada + x.cacheEscrita + x.salida

function ContextoGauge({ contexto }: { contexto: number }): React.JSX.Element {
  const frac = Math.min(1, contexto / CONSUMO_CONTEXTO_LIMITE)
  const color = frac < 0.6 ? 'bg-emerald-500' : frac < 0.85 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <span className="flex items-center gap-1.5" title={`Contexto ≈ ${fmt.format(contexto)} tokens`}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-foreground/10">
        <span
          className={cn('block h-full rounded-full', color)}
          style={{ width: `${Math.max(4, frac * 100)}%` }}
        />
      </span>
      <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">
        {Math.round(frac * 100)}%
      </span>
    </span>
  )
}

function SesionRow({ sesion }: { sesion: ConsumoSesion }): React.JSX.Element {
  const copiarReanudar = useCallback(() => {
    void navigator.clipboard.writeText(`claude --resume ${sesion.sessionId}`)
    toast.success('Comando de reanudar copiado')
  }, [sesion.sessionId])
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 text-[13px] hover:bg-foreground/5">
      <span className="min-w-0 flex-1 truncate" title={sesion.titulo || sesion.sessionId}>
        {sesion.olvidada ? (
          <AlarmClockOff className="mr-1.5 inline size-3.5 text-amber-500" />
        ) : null}
        {sesion.titulo || <span className="text-muted-foreground">{sesion.sessionId}</span>}
      </span>
      <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">
        {hace(sesion.ultimaActividad)}
      </span>
      <span
        className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
        title="Tokens que gastan límite (entrada nueva + cache escrita + salida)"
      >
        {tokens(gasto(sesion))}
      </span>
      <ContextoGauge contexto={sesion.contexto} />
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={copiarReanudar}
        title={`Copiar: claude --resume ${sesion.sessionId}`}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  )
}

export default function ConsumoPage(): React.JSX.Element {
  const [resumen, setResumen] = useState<ConsumoResumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(() => {
    setCargando(true)
    window.api.hideout
      .consumoResumen()
      .then((r) => {
        setResumen(r)
        setError(null)
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargar()
    const temporizador = setInterval(cargar, 60_000)
    return () => clearInterval(temporizador)
  }, [cargar])

  const { hoyGasto, semanaGasto, olvidadas, maxDia } = useMemo(() => {
    const dias = resumen?.dias ?? []
    // "Hoy" se deriva del instante en que el main generó el resumen, no del reloj del render.
    const generado = new Date(resumen?.generadoEn ?? 0)
    const clave = `${generado.getFullYear()}-${String(generado.getMonth() + 1).padStart(2, '0')}-${String(generado.getDate()).padStart(2, '0')}`
    const hoy = dias.find((d) => d.dia === clave)
    const semana = dias.slice(0, 7)
    const sesionesOlvidadas = (resumen?.proyectos ?? [])
      .flatMap((p) => p.sesiones.map((s) => ({ proyecto: p.nombre, sesion: s })))
      .filter((x) => x.sesion.olvidada)
      .sort((a, b) => b.sesion.contexto - a.sesion.contexto)
    return {
      hoyGasto: hoy ? gasto(hoy) : 0,
      semanaGasto: semana.reduce((acc, d) => acc + gasto(d), 0),
      olvidadas: sesionesOlvidadas,
      maxDia: Math.max(1, ...dias.map(gasto))
    }
  }, [resumen])

  return (
    <div className="scrollbar-sleek flex h-full flex-col overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Gauge className="size-5 text-muted-foreground" />
          <h1 className="flex-1 text-lg font-semibold tracking-tight">Consumo</h1>
          <Button variant="ghost" size="sm" onClick={cargar} disabled={cargando}>
            <RefreshCw className={cn('mr-1.5 size-3.5', cargando && 'animate-spin')} />
            Actualizar
          </Button>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</p>
        ) : null}
        {!resumen && !error ? (
          <p className="text-sm text-muted-foreground">Leyendo los transcripts de Claude Code…</p>
        ) : null}

        {resumen ? (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-foreground/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hoy</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{tokens(hoyGasto)}</p>
              </div>
              <div className="rounded-lg border border-border bg-foreground/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Últimos 7 días
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{tokens(semanaGasto)}</p>
              </div>
              <div className="rounded-lg border border-border bg-foreground/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Chats olvidados
                </p>
                <p
                  className={cn(
                    'mt-1 text-xl font-semibold tabular-nums',
                    olvidadas.length > 0 && 'text-amber-500'
                  )}
                >
                  {olvidadas.length}
                </p>
              </div>
            </div>

            {olvidadas.length > 0 ? (
              <section className="mb-8">
                <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                  Chats olvidados — parados más de 12 h con contexto cargado
                </h2>
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-1">
                  {olvidadas.map(({ proyecto, sesion }) => (
                    <div key={sesion.filePath} className="flex items-center gap-2">
                      <span className="shrink-0 pl-2 text-[11px] text-muted-foreground">
                        {proyecto}
                      </span>
                      <div className="min-w-0 flex-1">
                        <SesionRow sesion={sesion} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mb-8">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">Por día</h2>
              <div className="space-y-1">
                {resumen.dias.map((d) => (
                  <div key={d.dia} className="flex items-center gap-3 text-[12px]">
                    <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
                      {d.dia.slice(5)}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/5">
                      <span
                        className="block h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.max(1, (gasto(d) / maxDia) * 100)}%` }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right tabular-nums">
                      {tokens(gasto(d))}
                    </span>
                    <span
                      className="w-20 shrink-0 text-right tabular-nums text-muted-foreground"
                      title="Cache leída (no gasta apenas)"
                    >
                      {tokens(d.cacheLeida)} ⟳
                    </span>
                  </div>
                ))}
                {resumen.dias.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
                ) : null}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">Por proyecto</h2>
              <div className="space-y-4">
                {resumen.proyectos.map((p) => (
                  <details
                    key={p.ruta}
                    className="group rounded-lg border border-border"
                    open={p.sesiones.some((s) => s.olvidada)}
                  >
                    <summary className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] hover:bg-foreground/5">
                      <span className="min-w-0 flex-1 truncate font-medium" title={p.ruta}>
                        {p.nombre}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {p.sesiones.length} {p.sesiones.length === 1 ? 'chat' : 'chats'}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {hace(p.ultimaActividad)}
                      </span>
                      <span className="shrink-0 tabular-nums text-[12px]">{tokens(gasto(p))}</span>
                    </summary>
                    <div className="border-t border-border p-1">
                      {p.sesiones.map((s) => (
                        <SesionRow key={s.filePath} sesion={s} />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <p className="mt-8 text-[11px] text-muted-foreground">
              Fuente: {resumen.raices.join(' · ')} — actualizado {hace(resumen.generadoEn)}. Los
              porcentajes de contexto son sobre ~{tokens(CONSUMO_CONTEXTO_LIMITE)}.
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}
