// Hideout: ajustes del Ayudante. La API key se envía al proceso principal y se
// guarda en userData — nunca se muestra entera ni viaja a ningún otro sitio.
import { useCallback, useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export function AyudanteAjustes(): React.JSX.Element {
  const [configurada, setConfigurada] = useState(false)
  const [clave, setClave] = useState('')

  useEffect(() => {
    void window.api.hideout.ayudanteConfig().then((config) => {
      setConfigurada(config.apiKeyConfigurada)
    })
  }, [])

  const guardar = useCallback(async () => {
    const valor = clave.trim()
    if (!valor) {
      return
    }
    await window.api.hideout.ayudanteApiKey(valor)
    setConfigurada(true)
    setClave('')
    toast.success('API key guardada: el Ayudante pasa a facturar por uso, no por suscripción')
  }, [clave])

  const quitar = useCallback(async () => {
    await window.api.hideout.ayudanteApiKey(null)
    setConfigurada(false)
    toast.success('API key eliminada: el Ayudante vuelve a usar tu suscripción')
  }, [])

  return (
    <div className="space-y-2 border-b border-border bg-foreground/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[12px] font-medium">
        <KeyRound className="size-3.5 text-muted-foreground" />
        API de Claude
        <span className={configurada ? 'text-emerald-400' : 'text-muted-foreground'}>
          {configurada ? '· configurada' : '· sin configurar (usa tu suscripción)'}
        </span>
      </div>
      <div className="flex gap-1.5">
        <input
          type="password"
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md border border-border bg-foreground/[0.03] px-2 py-1 text-[12px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
        />
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={!clave.trim()}
          className="rounded-md bg-primary/15 px-2.5 py-1 text-[12px] text-primary transition-colors hover:bg-primary/25 disabled:opacity-40"
        >
          Guardar
        </button>
        {configurada ? (
          <button
            type="button"
            onClick={() => void quitar()}
            className="rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
          >
            Quitar
          </button>
        ) : null}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Se guarda solo en tu equipo (userData). Con API key las preguntas se cobran a tu cuenta de
        Anthropic en vez de gastar la suscripción.
      </p>
    </div>
  )
}
