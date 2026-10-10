import { useMemo, useState } from 'preact/hooks'
import Fuse from 'fuse.js'
import { Search, TextSearch } from 'lucide-preact'
import { EmptyState, PanelTitle, StatusPill } from '../components/ui'
import { formatOffset } from '../domain/format'
import type { ExtractedString, FileAnalysis } from '../domain/types'

const tagOptions = ['all', 'secret', 'url', 'email', 'path', 'hash', 'long']

export function StringsView({ analysis }: { analysis: FileAnalysis | null }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')
  const tagCounts = useMemo(() => {
    const strings = analysis?.strings ?? []
    return Object.fromEntries(
      tagOptions.map((item) => [
        item,
        item === 'all' ? strings.length : strings.filter((stringItem) => stringItem.tags.includes(item)).length,
      ]),
    ) as Record<string, number>
  }, [analysis?.strings])
  const filtered = useMemo(() => {
    if (!analysis) return [] as ExtractedString[]
    const tagged = tag === 'all' ? analysis.strings : analysis.strings.filter((item) => item.tags.includes(tag))
    const term = query.trim()
    if (!term) return tagged
    return new Fuse(tagged, {
      keys: ['value', 'encoding', 'tags'],
      threshold: 0.32,
      ignoreLocation: true,
    })
      .search(term)
      .map((result) => result.item)
  }, [analysis, query, tag])

  if (!analysis) return <EmptyState>Load a file to extract strings.</EmptyState>

  return (
    <section class="rounded-lg border border-[#d8e0e5] bg-white">
      <PanelTitle icon={TextSearch} title="Strings Explorer" meta={`${filtered.length} visible / ${analysis.strings.length} total`} />
      <div class="grid gap-3 border-b border-[#edf2f6] p-4 lg:grid-cols-[1fr_auto]">
        <label class="flex min-h-10 items-center gap-2 rounded-md border border-[#d0d9e0] bg-[#f7fafc] px-3">
          <Search class="h-4 w-4 text-[#697786]" />
          <input
            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={query}
            onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
            placeholder="Fuzzy search strings"
          />
        </label>
        <div class="flex flex-wrap gap-2">
          {tagOptions.map((item) => {
            const active = tag === item
            return (
              <button
                type="button"
                class={`min-h-10 rounded-md border px-3 text-xs font-semibold transition ${
                  active ? 'border-[#17283a] bg-[#17283a] text-white' : 'border-[#d8e0e5] bg-[#f7fafc] text-[#536270] hover:bg-white'
                }`}
                onClick={() => setTag(item)}
                key={item}
              >
                {item}
                <span class={`ml-2 rounded px-1.5 py-0.5 ${active ? 'bg-white/15 text-white' : 'bg-white text-[#657281]'}`}>
                  {tagCounts[item].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div class="thin-scrollbar max-h-[760px] overflow-auto p-4">
        <div class="grid gap-2">
          {filtered.map((item) => (
            <div class="grid gap-2 rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3 lg:grid-cols-[150px_1fr_auto]" key={item.id}>
              <div class="font-mono text-xs font-semibold text-[#17283a]">{formatOffset(item.offset)}</div>
              <div class="min-w-0">
                <p class="break-words font-mono text-xs text-[#263545]">{item.value}</p>
                <p class="mt-1 text-xs text-[#657281]">{item.encoding} / {item.length} chars</p>
              </div>
              <div class="flex flex-wrap gap-1 lg:justify-end">
                {item.tags.length ? item.tags.map((stringTag) => <StatusPill tone={stringTag === 'secret' ? 'danger' : 'info'} key={stringTag}>{stringTag}</StatusPill>) : <StatusPill>plain</StatusPill>}
              </div>
            </div>
          ))}
          {!filtered.length ? <p class="p-6 text-center text-sm text-[#657281]">No strings match the current filters.</p> : null}
        </div>
      </div>
    </section>
  )
}
