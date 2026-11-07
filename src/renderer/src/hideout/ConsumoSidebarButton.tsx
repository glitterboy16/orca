// Hideout: entrada "Consumo" del sidebar, siguiendo el patrón de SidebarNav.
import { Gauge } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

export function ConsumoSidebarButton(): React.JSX.Element {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const activo = activeView === 'consumo'
  return (
    <button
      type="button"
      onClick={() => setActiveView('consumo')}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium tracking-tight transition-colors',
        activo
          ? 'bg-worktree-sidebar-accent text-worktree-sidebar-accent-foreground'
          : 'text-worktree-sidebar-foreground/60 hover:bg-worktree-sidebar-foreground/8'
      )}
    >
      <Gauge
        className={cn('size-4 shrink-0', !activo && 'text-worktree-sidebar-foreground/30')}
        strokeWidth={activo ? 2.25 : 1.75}
      />
      <span className="flex-1">Consumo</span>
    </button>
  )
}
