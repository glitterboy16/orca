// Hideout: Ayudante flotante. Un chat siempre a mano, en cualquier vista, que
// ve la pantalla (captura) y el código de la app, para preguntar por lo que no
// se entiende. Montado una sola vez en el shell: la conversación no se pierde
// al cambiar de vista ni al cerrar el panel.
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Eye,
  EyeOff,
  Loader2,
  MessageCircleQuestion,
  RotateCcw,
  Send,
  Settings2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isImeOwnedKeyboardEvent } from '@/lib/ime-composition-keyboard-event'
import { useAppStore } from '@/store'
import { AyudanteAjustes } from './AyudanteAjustes'

type Mensaje = { rol: 'yo' | 'ayudante' | 'error'; texto: string }

const SALUDO =
  'Pregúntame por lo que ves en pantalla, por una opción que no entiendas o por el código de la app. Miro una captura de la ventana al responder. También puedo cerrar todas las sesiones de Claude Code abiertas si me lo pides.'

function Burbuja({ mensaje }: { mensaje: Mensaje }): React.JSX.Element {
  return (
    <div className={cn('flex', mensaje.rol === 'yo' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
          mensaje.rol === 'yo' && 'bg-primary/15 text-foreground',
          mensaje.rol === 'ayudante' && 'bg-foreground/[0.05] text-foreground',
          mensaje.rol === 'error' && 'bg-red-500/10 text-red-400'
        )}
      >
        {mensaje.texto}
      </div>
    </div>
  )
}

export default function AyudanteFlotante(): React.JSX.Element {
  const vista = useAppStore((s) => s.activeView)
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [conCaptura, setConCaptura] = useState(true)
  const [conAjustes, setConAjustes] = useState(false)
  const [progreso, setProgreso] = useState('Pensando…')
  const [segundos, setSegundos] = useState(0)
  const listaRef = useRef<HTMLDivElement>(null)
  const entradaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const lista = listaRef.current
    if (lista) {
      lista.scrollTop = lista.scrollHeight
    }
  }, [mensajes, ocupado])

  useEffect(() => {
    if (abierto) {
      entradaRef.current?.focus()
    }
  }, [abierto])

  // El proceso principal retransmite el paso en curso (leyendo X, buscando Y…).
  useEffect(() => window.api.hideout.ayudanteOnProgreso(setProgreso), [])

  useEffect(() => {
    if (!ocupado) {
      return
    }
    const inicio = Date.now()
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000))
    }, 1_000)
    return () => clearInterval(intervalo)
  }, [ocupado])

  const enviar = useCallback(async () => {
    const pregunta = texto.trim()
    if (!pregunta || ocupado) {
      return
    }
    setTexto('')
    setMensajes((previos) => [...previos, { rol: 'yo', texto: pregunta }])
    setProgreso(conCaptura ? 'Mirando tu pantalla…' : 'Enviando la pregunta…')
    setSegundos(0)
    setOcupado(true)
    try {
      const respuesta = await window.api.hideout.ayudantePreguntar({
        pregunta,
        vista,
        incluirCaptura: conCaptura
      })
      setMensajes((previos) => [
        ...previos,
        respuesta.ok
          ? { rol: 'ayudante', texto: respuesta.texto }
          : { rol: 'error', texto: respuesta.error }
      ])
    } catch (error) {
      setMensajes((previos) => [
        ...previos,
        { rol: 'error', texto: error instanceof Error ? error.message : String(error) }
      ])
    } finally {
      setOcupado(false)
    }
  }, [texto, ocupado, vista, conCaptura])

  const reiniciar = useCallback(() => {
    setMensajes([])
    void window.api.hideout.ayudanteReiniciar()
  }, [])

  return (
    <>
      {abierto ? (
        <div className="fixed right-4 bottom-16 z-[45] flex h-[min(540px,70vh)] w-[400px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <MessageCircleQuestion className="size-4 text-muted-foreground" />
            <span className="flex-1 text-[13px] font-semibold tracking-tight">Ayudante</span>
            <button
              type="button"
              title={
                conCaptura
                  ? 'Está viendo tu pantalla (clic para apagar)'
                  : 'No ve la pantalla (clic para encender)'
              }
              onClick={() => setConCaptura((valor) => !valor)}
              className={cn(
                'rounded-md p-1.5 transition-colors hover:bg-foreground/8',
                conCaptura ? 'text-emerald-400' : 'text-muted-foreground'
              )}
            >
              {conCaptura ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </button>
            <button
              type="button"
              title="Ajustes (API de Claude)"
              onClick={() => setConAjustes((valor) => !valor)}
              className={cn(
                'rounded-md p-1.5 transition-colors hover:bg-foreground/8',
                conAjustes ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Settings2 className="size-3.5" />
            </button>
            <button
              type="button"
              title="Nueva conversación"
              onClick={reiniciar}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              title="Cerrar"
              onClick={() => setAbierto(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {conAjustes ? <AyudanteAjustes /> : null}
          <div ref={listaRef} className="scrollbar-sleek flex-1 space-y-2 overflow-y-auto p-3">
            {mensajes.length === 0 ? (
              <p className="px-1 py-2 text-[12px] leading-relaxed text-muted-foreground">
                {SALUDO}
              </p>
            ) : null}
            {mensajes.map((mensaje, indice) => (
              <Burbuja key={indice} mensaje={mensaje} />
            ))}
            {ocupado ? (
              <div className="flex items-center gap-2 rounded-lg bg-foreground/[0.04] px-3 py-2 text-[12px] text-muted-foreground">
                <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                <span className="flex-1 truncate">{progreso}</span>
                {segundos > 2 ? (
                  <span className="tabular-nums opacity-60">{segundos} s</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex items-end gap-2 border-t border-border p-2">
            <textarea
              ref={entradaRef}
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              onKeyDown={(evento) => {
                if (
                  evento.key === 'Enter' &&
                  !evento.shiftKey &&
                  !isImeOwnedKeyboardEvent(evento)
                ) {
                  evento.preventDefault()
                  void enviar()
                }
              }}
              rows={2}
              placeholder="¿Qué es esto que veo? ¿Para qué sirve…?"
              className="scrollbar-sleek flex-1 resize-none overflow-y-auto rounded-md border border-border bg-foreground/[0.03] px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
            />
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={ocupado || !texto.trim()}
              title="Enviar (Enter)"
              className="rounded-md bg-primary/15 p-2 text-primary transition-colors hover:bg-primary/25 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        title="Ayudante: pregunta por lo que ves"
        onClick={() => setAbierto((valor) => !valor)}
        className={cn(
          'fixed right-4 bottom-4 z-[45] flex size-10 items-center justify-center rounded-full border shadow-lg transition-colors',
          abierto
            ? 'border-primary/40 bg-primary/20 text-primary'
            : 'border-border bg-card text-muted-foreground hover:text-foreground'
        )}
      >
        <MessageCircleQuestion className="size-5" />
      </button>
    </>
  )
}
