import { FileUp, GitCompare, RefreshCw, Upload } from 'lucide-preact'
import { AppButton, EmptyState, PanelTitle, StatusPill } from '../components/ui'
import { formatBytes, formatOffset, formatPercent } from '../domain/format'
import type { BinaryDiff, FileAnalysis } from '../domain/types'

export function DiffView({
  primary,
  comparison,
  diff,
  onLoadComparison,
  onOpenComparison,
}: {
  primary: FileAnalysis | null
  comparison: FileAnalysis | null
  diff: BinaryDiff | null
  onLoadComparison: () => void
  onOpenComparison: (event: Event) => void
}) {
  return (
    <section class="rounded-lg border border-[#d8e0e5] bg-white">
      <PanelTitle icon={GitCompare} title="Binary Diff" meta={diff ? `${diff.ranges.length} changed ranges` : 'comparison required'} />
      <div class="flex flex-wrap gap-2 border-b border-[#edf2f6] p-4">
        <AppButton icon={RefreshCw} onClick={onLoadComparison}>Load ZIP sample as comparison</AppButton>
        <label class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#cfd8df] bg-white px-3 text-sm font-semibold text-[#16202d] transition hover:bg-[#f7fafc]">
          <Upload class="h-4 w-4" />
          <span>Open comparison file</span>
          <input class="sr-only" type="file" onInput={onOpenComparison} />
        </label>
      </div>
      <div class="p-4">
        <div class="mb-3 flex flex-wrap gap-2">
          <StatusPill tone={primary ? 'success' : 'warning'}>primary: {primary?.name ?? 'not loaded'}</StatusPill>
          <StatusPill tone={comparison ? 'success' : 'warning'}>comparison: {comparison?.name ?? 'not loaded'}</StatusPill>
        </div>
        {primary && comparison && diff ? (
          <div class="grid gap-4">
            <div class="grid gap-3 md:grid-cols-4">
              <DiffStat label="Similarity" value={formatPercent(diff.similarity)} />
              <DiffStat label="Different bytes" value={diff.differentBytes.toLocaleString()} />
              <DiffStat label="Size delta" value={formatBytes(Math.abs(diff.sizeDelta))} />
              <DiffStat label="Entropy delta" value={diff.entropyDelta.toFixed(2)} />
            </div>
            <div class="flex flex-wrap gap-2">
              <StatusPill>{diff.primaryName}</StatusPill>
              <StatusPill tone="info">{diff.comparisonName}</StatusPill>
              <StatusPill>{diff.comparedBytes.toLocaleString()} compared bytes</StatusPill>
            </div>
            <div class="thin-scrollbar overflow-auto rounded-lg border border-[#d8e0e5]">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-[#edf4f8] text-xs uppercase text-[#536270]">
                  <tr>
                    <th class="px-3 py-2">Range</th>
                    <th class="px-3 py-2">Length</th>
                    <th class="px-3 py-2">Primary</th>
                    <th class="px-3 py-2">Comparison</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.ranges.map((range) => (
                    <tr class="border-t border-[#edf2f6] odd:bg-white even:bg-[#fbfcfe]" key={range.start}>
                      <td class="px-3 py-2 font-mono text-xs">{formatOffset(range.start)} - {formatOffset(range.end)}</td>
                      <td class="px-3 py-2 font-mono text-xs">{range.length.toLocaleString()}</td>
                      <td class="px-3 py-2 font-mono text-xs">{range.primaryPreview || '-'}</td>
                      <td class="px-3 py-2 font-mono text-xs">{range.comparisonPreview || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState>
            <span class="inline-flex items-center gap-2">
              <FileUp class="h-4 w-4" />
              Load a primary file and a comparison file to inspect byte-level drift.
            </span>
          </EmptyState>
        )}
      </div>
    </section>
  )
}

function DiffStat({ label, value }: { label: string; value: string }) {
  return (
    <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3">
      <p class="text-xs font-semibold uppercase text-[#657281]">{label}</p>
      <p class="mt-2 truncate text-lg font-semibold text-[#16202d]">{value}</p>
    </div>
  )
}
