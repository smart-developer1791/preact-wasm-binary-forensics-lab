import { useMemo, useState } from 'preact/hooks'
import Fuse from 'fuse.js'
import { Copy, Crosshair, Download, Search } from 'lucide-preact'
import { AppButton, EmptyState, PanelTitle, StatusPill } from '../components/ui'
import { formatOffset } from '../domain/format'
import type { FileAnalysis, IocKind, IocRecord } from '../domain/types'

const kinds: Array<IocKind | 'all'> = ['all', 'secret', 'url', 'domain', 'email', 'ipv4', 'hash', 'path']

export function IocsView({
  analysis,
  onExportCsv,
  onCopyCsv,
}: {
  analysis: FileAnalysis | null
  onExportCsv: () => void
  onCopyCsv: () => void
}) {
  const [kind, setKind] = useState<IocKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const counts = useMemo(() => {
    const iocs = analysis?.iocs ?? []
    return Object.fromEntries(
      kinds.map((item) => [item, item === 'all' ? iocs.length : iocs.filter((ioc) => ioc.kind === item).length]),
    ) as Record<IocKind | 'all', number>
  }, [analysis?.iocs])
  const filtered = useMemo(() => {
    if (!analysis) return [] as IocRecord[]
    const base = kind === 'all' ? analysis.iocs : analysis.iocs.filter((ioc) => ioc.kind === kind)
    const term = query.trim()
    if (!term) return base
    return new Fuse(base, {
      keys: ['kind', 'value', 'source', 'tags'],
      threshold: 0.3,
      ignoreLocation: true,
    })
      .search(term)
      .map((result) => result.item)
  }, [analysis, kind, query])

  if (!analysis) return <EmptyState>Load a file to extract indicators.</EmptyState>

  return (
    <section class="rounded-lg border border-[#d8e0e5] bg-white">
      <PanelTitle
        icon={Crosshair}
        title="IOC Workbench"
        meta={`${filtered.length} visible / ${analysis.iocs.length} total`}
        action={
          <div class="flex flex-wrap gap-2">
            <AppButton icon={Copy} disabled={!analysis.iocs.length} onClick={onCopyCsv}>Copy CSV</AppButton>
            <AppButton icon={Download} disabled={!analysis.iocs.length} onClick={onExportCsv}>Download CSV</AppButton>
          </div>
        }
      />
      <div class="grid gap-3 border-b border-[#edf2f6] p-4 lg:grid-cols-[1fr_auto]">
        <label class="flex min-h-10 items-center gap-2 rounded-md border border-[#d0d9e0] bg-[#f7fafc] px-3">
          <Search class="h-4 w-4 text-[#697786]" />
          <input
            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={query}
            onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
            placeholder="Search indicators"
          />
        </label>
        <div class="flex flex-wrap gap-2">
          {kinds.map((item) => {
            const active = kind === item
            return (
              <button
                type="button"
                class={`min-h-10 rounded-md border px-3 text-xs font-semibold transition ${
                  active ? 'border-[#17283a] bg-[#17283a] text-white' : 'border-[#d8e0e5] bg-[#f7fafc] text-[#536270] hover:bg-white'
                }`}
                onClick={() => setKind(item)}
                key={item}
              >
                {item}
                <span class={`ml-2 rounded px-1.5 py-0.5 ${active ? 'bg-white/15 text-white' : 'bg-white text-[#657281]'}`}>
                  {counts[item].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div class="thin-scrollbar max-h-[760px] overflow-auto p-4">
        <div class="grid gap-2">
          {filtered.map((ioc) => (
            <div class="grid gap-2 rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3 xl:grid-cols-[110px_1fr_150px_120px]" key={ioc.id}>
              <div class="flex flex-wrap items-start gap-2">
                <StatusPill tone={ioc.kind === 'secret' ? 'danger' : ioc.kind === 'hash' ? 'warning' : 'info'}>{ioc.kind}</StatusPill>
              </div>
              <div class="min-w-0">
                <p class="break-words font-mono text-xs font-semibold text-[#263545]">{ioc.value}</p>
                <p class="mt-1 text-xs text-[#657281]">{ioc.tags.join(' / ') || 'indicator'}</p>
              </div>
              <div class="font-mono text-xs text-[#536270]">{formatOffset(ioc.offset)}</div>
              <div class="text-xs font-semibold text-[#657281]">{ioc.confidence}% confidence</div>
            </div>
          ))}
          {!filtered.length ? <p class="p-6 text-center text-sm text-[#657281]">No indicators match the current filters.</p> : null}
        </div>
      </div>
    </section>
  )
}
