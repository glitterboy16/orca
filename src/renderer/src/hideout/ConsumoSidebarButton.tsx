// Hideout: entradas propias del sidebar, siguiendo el patrón de SidebarNav.
import { FolderOpen, Gauge, LayoutTemplate } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import type { TopLevelView } from '../../../shared/ui-chrome-types'

function HideoutNavButton({
  vista,
  etiqueta,
  Icono
}: {
  vista: TopLevelView
  etiqueta: string
  Icono: typeof Gauge
}): React.JSX.Element {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const activo = activeView === vista
  return (
    <button
      type="button"
      onClick={() => setActiveView(vista)}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium tracking-tight transition-colors',
        activo
          ? 'bg-worktree-sidebar-accent text-worktree-sidebar-accent-foreground'
          : 'text-worktree-sidebar-foreground/60 hover:bg-worktree-sidebar-foreground/8'
      )}
    >
      <Icono
        className={cn('size-4 shrink-0', !activo && 'text-worktree-sidebar-foreground/30')}
        strokeWidth={activo ? 2.25 : 1.75}
      />
      <span className="flex-1">{etiqueta}</span>
    </button>
  )
}

export function ConsumoSidebarButton(): React.JSX.Element {
  return <HideoutNavButton vista="consumo" etiqueta="Consumo" Icono={Gauge} />
}

export function PlantillasSidebarButton(): React.JSX.Element {
  return <HideoutNavButton vista="plantillas" etiqueta="Plantillas" Icono={LayoutTemplate} />
}

export function ProyectosSidebarButton(): React.JSX.Element {
  return <HideoutNavButton vista="proyectos" etiqueta="Proyectos" Icono={FolderOpen} />
}
