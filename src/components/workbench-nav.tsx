import { Binary, Braces, Crosshair, FileJson2, GitCompare, Search, ShieldAlert } from 'lucide-preact'
import type { IconComponent, ViewMode } from '../domain/types'

const views: Array<[ViewMode, IconComponent, string]> = [
  ['overview', ShieldAlert, 'Overview'],
  ['hex', Binary, 'Hex'],
  ['strings', Search, 'Strings'],
  ['iocs', Crosshair, 'IOCs'],
  ['wasm', Braces, 'WASM'],
  ['diff', GitCompare, 'Diff'],
  ['report', FileJson2, 'Report'],
]

export function WorkbenchNav({
  activeView,
  onChange,
}: {
  activeView: ViewMode
  onChange: (view: ViewMode) => void
}) {
  return (
    <nav class="sticky top-0 z-30 border-b border-[#d8e0e5] bg-white/95 backdrop-blur">
      <div class="thin-scrollbar mx-auto flex max-w-[1560px] overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex min-w-max gap-1 rounded-lg border border-[#d8e0e5] bg-[#eef3f6] p-1 shadow-sm shadow-[#16202d]/5">
          {views.map(([view, Icon, label]) => {
            const active = activeView === view
            return (
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                class={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                  active
                    ? 'border-[#17283a] bg-[#17283a] text-white shadow-sm shadow-[#17283a]/20'
                    : 'border-transparent bg-transparent text-[#465566] hover:border-[#cbd6de] hover:bg-white'
                }`}
                onClick={() => onChange(view)}
                key={view}
              >
                <Icon class="h-4 w-4" />
                {active ? <span class="h-1.5 w-1.5 rounded-full bg-cyan-200" /> : null}
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
