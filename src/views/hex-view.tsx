import { useMemo, useState } from 'preact/hooks'
import { Binary, Search } from 'lucide-preact'
import { HexTable } from '../components/hex-table'
import { EmptyState, PanelTitle, StatusPill } from '../components/ui'
import { bytesPerHexRow, maxHexRows } from '../domain/constants'
import { formatBytes } from '../domain/format'
import type { FileAnalysis } from '../domain/types'

export function HexView({ analysis }: { analysis: FileAnalysis | null }) {
  const [search, setSearch] = useState('')
  const matchCount = useMemo(() => {
    if (!analysis || !search) return 0
    const pattern = Array.from(new TextEncoder().encode(search))
    let count = 0
    for (let offset = 0; offset <= analysis.bytes.length - pattern.length; offset += 1) {
      if (pattern.every((byte, index) => analysis.bytes[offset + index] === byte)) count += 1
    }
    return count
  }, [analysis, search])

  if (!analysis) return <EmptyState>Load a file to inspect raw bytes.</EmptyState>

  return (
    <section class="rounded-lg border border-[#d8e0e5] bg-white">
      <PanelTitle icon={Binary} title="Hex Inspector" meta={`${formatBytes(analysis.size)} / ${bytesPerHexRow}-byte rows`} />
      <div class="grid gap-3 border-b border-[#edf2f6] p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <label class="flex min-h-10 items-center gap-2 rounded-md border border-[#d0d9e0] bg-[#f7fafc] px-3">
          <Search class="h-4 w-4 text-[#697786]" />
          <input
            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={search}
            onInput={(event) => setSearch((event.currentTarget as HTMLInputElement).value)}
            placeholder="Search ASCII bytes"
          />
        </label>
        <div class="flex flex-wrap gap-2">
          <StatusPill>{matchCount.toLocaleString()} matches</StatusPill>
          <StatusPill>{Math.min(analysis.size, maxHexRows * bytesPerHexRow).toLocaleString()} bytes visible</StatusPill>
        </div>
      </div>
      <div class="p-4">
        <HexTable bytes={analysis.bytes} search={search} />
      </div>
    </section>
  )
}
