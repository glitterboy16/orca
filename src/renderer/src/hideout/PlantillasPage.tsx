// Hideout: plantillas de proyecto (idea 16). v1: cada plantilla trae su
// CLAUDE.md y su kit de skills/MCP listos para copiar en el proyecto nuevo.
import { useCallback, useState } from 'react'
import { Check, Copy, LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { HIDEOUT_PLANTILLAS, type HideoutPlantilla } from '../../../shared/hideout-plantillas'

function PlantillaCard({ plantilla }: { plantilla: HideoutPlantilla }): React.JSX.Element {
  const [copiado, setCopiado] = useState(false)
  const copiarClaudeMd = useCallback(() => {
    void navigator.clipboard.writeText(plantilla.claudeMd)
    setCopiado(true)
    toast.success(`CLAUDE.md de ${plantilla.nombre} copiado — pégalo en la carpeta del proyecto`)
    setTimeout(() => setCopiado(false), 2_000)
  }, [plantilla])
  return (
    <div className="rounded-lg border border-border bg-foreground/[0.02] p-4">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="flex-1 text-[15px] font-semibold">{plantilla.nombre}</h3>
        <Button variant="outline" size="sm" onClick={copiarClaudeMd}>
          {copiado ? <Check className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
          Copiar CLAUDE.md
        </Button>
      </div>
      <p className="mb-3 text-[13px] text-muted-foreground">{plantilla.descripcion}</p>
      <div className="flex flex-wrap gap-1.5">
        {plantilla.skills.map((s) => (
          <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
            {s}
          </span>
        ))}
        {plantilla.mcp.map((m) => (
          <span
            key={m}
            className="rounded-full bg-foreground/8 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            MCP: {m}
          </span>
        ))}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-[12px] text-muted-foreground hover:text-foreground">
          Ver CLAUDE.md
        </summary>
        <pre
          className={cn(
            'scrollbar-sleek mt-2 max-h-72 overflow-y-auto rounded-md border border-border',
            'bg-foreground/[0.03] p-3 text-[11px] leading-relaxed whitespace-pre-wrap'
          )}
        >
          {plantilla.claudeMd}
        </pre>
      </details>
    </div>
  )
}

export default function PlantillasPage(): React.JSX.Element {
  return (
    <div className="scrollbar-sleek flex h-full flex-col overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-2 flex items-center gap-3">
          <LayoutTemplate className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Plantillas de proyecto</h1>
        </div>
        <p className="mb-6 text-[13px] text-muted-foreground">
          Al empezar un proyecto: crea la carpeta, copia el CLAUDE.md de su plantilla y activa las
          skills y MCP del kit. Las skills se gestionan en la página Skills; los MCP, por proyecto
          (no todos siempre).
        </p>
        <div className="space-y-4">
          {HIDEOUT_PLANTILLAS.map((p) => (
            <PlantillaCard key={p.slug} plantilla={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
