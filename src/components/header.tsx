import { Binary, CheckCircle2, Download, FileArchive, FileCode2, FileUp, RefreshCw, Upload } from 'lucide-preact'
import { formatBytes } from '../domain/format'
import type { FileAnalysis } from '../domain/types'
import { AppButton, StatusPill } from './ui'

export function Header({
  primary,
  comparison,
  status,
  onLoadPayload,
  onLoadWasm,
  onLoadZip,
  onOpenPrimary,
  onOpenComparison,
  onExportReport,
}: {
  primary: FileAnalysis | null
  comparison: FileAnalysis | null
  status: string
  onLoadPayload: () => void
  onLoadWasm: () => void
  onLoadZip: () => void
  onOpenPrimary: (event: Event) => void
  onOpenComparison: (event: Event) => void
  onExportReport: () => void
}) {
  return (
    <header class="border-b border-[#243344] bg-[#101824] text-white">
      <div class="mx-auto flex max-w-[1560px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(560px,760px)] xl:items-start">
          <div class="flex min-w-0 items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 shadow-sm shadow-cyan-950/30">
              <Binary class="h-7 w-7 text-cyan-200" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap gap-2">
                <StatusPill tone={primary ? 'success' : 'warning'}>
                  <CheckCircle2 class="h-3.5 w-3.5" />
                  {primary ? 'File analyzed' : 'Waiting for file'}
                </StatusPill>
                <StatusPill tone="dark">Local binary lab</StatusPill>
              </div>
              <h1 class="mt-1 text-2xl font-semibold text-white sm:text-3xl">Preact WASM Binary Forensics Lab</h1>
            </div>
          </div>

          <div class="rounded-lg border border-white/10 bg-white/[0.04] p-3 shadow-sm shadow-black/10">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <AppButton icon={RefreshCw} tone="dark" title="Load the mixed payload sample" onClick={onLoadPayload}>Payload sample</AppButton>
              <AppButton icon={FileCode2} tone="dark" title="Load the valid WebAssembly sample" onClick={onLoadWasm}>WASM sample</AppButton>
              <AppButton icon={FileArchive} tone="dark" title="Load the ZIP incident archive sample" onClick={onLoadZip}>ZIP sample</AppButton>
              <label class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#314154] bg-[#182232] px-3 text-sm font-semibold text-white transition hover:bg-[#223249]">
                <Upload class="h-4 w-4" />
                <span>Open file</span>
                <input class="sr-only" type="file" onInput={onOpenPrimary} />
              </label>
              <label class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#314154] bg-[#182232] px-3 text-sm font-semibold text-white transition hover:bg-[#223249]">
                <FileUp class="h-4 w-4" />
                <span>Open diff</span>
                <input class="sr-only" type="file" onInput={onOpenComparison} />
              </label>
              <AppButton icon={Download} tone="accent" disabled={!primary} onClick={onExportReport}>Export report</AppButton>
            </div>
          </div>
        </div>

        <div class="grid gap-2 text-sm text-[#d8e7f2] lg:grid-cols-[1fr_auto] lg:items-center">
          <div class="grid min-w-0 gap-2 md:grid-cols-2">
            <span class="inline-flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 shadow-sm shadow-black/10">
              <Binary class="h-4 w-4 shrink-0 text-cyan-200" />
              <span class="shrink-0 text-xs font-semibold uppercase text-[#9fb1c2]">Primary</span>
              <span class="truncate">{primary?.name ?? 'No file loaded'}</span>
              <span class="shrink-0 text-[#9fb1c2]">{primary ? formatBytes(primary.size) : ''}</span>
            </span>
            <span class="inline-flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 shadow-sm shadow-black/10">
              <FileUp class="h-4 w-4 shrink-0 text-amber-200" />
              <span class="shrink-0 text-xs font-semibold uppercase text-[#9fb1c2]">Compare</span>
              <span class="truncate">{comparison?.name ?? 'No comparison file'}</span>
              <span class="shrink-0 text-[#9fb1c2]">{comparison ? formatBytes(comparison.size) : ''}</span>
            </span>
          </div>
          <span class="inline-flex min-h-10 items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase text-cyan-50 shadow-sm shadow-black/10">
            {status}
          </span>
        </div>
      </div>
    </header>
  )
}
