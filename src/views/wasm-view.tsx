import { Braces, Cpu, Import, PackageOpen, RefreshCw } from 'lucide-preact'
import { AppButton, EmptyState, PanelTitle, StatusPill } from '../components/ui'
import { formatBytes, formatOffset } from '../domain/format'
import type { FileAnalysis } from '../domain/types'

export function WasmView({
  analysis,
  onLoadWasmSample,
}: {
  analysis: FileAnalysis | null
  onLoadWasmSample: () => void
}) {
  if (!analysis) return <EmptyState>Load a WASM module or binary with embedded WASM content.</EmptyState>

  const wasm = analysis.wasm
  if (!wasm.validMagic) {
    const embeddedWasm = analysis.embeddedSignatures.filter((signature) => signature.id === 'wasm')
    return (
      <section class="rounded-lg border border-[#d8e0e5] bg-white">
        <PanelTitle icon={Braces} title="WASM Inspector" meta="no primary WASM header" action={<AppButton icon={RefreshCw} onClick={onLoadWasmSample}>Load WASM sample</AppButton>} />
        <div class="grid gap-3 p-4">
          <EmptyState>
            {embeddedWasm.length ? 'Embedded WASM signature detected at a non-zero offset.' : 'The primary file does not start with a WebAssembly magic header.'}
          </EmptyState>
          {embeddedWasm.map((signature) => (
            <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3" key={`${signature.id}-${signature.offset}`}>
              <p class="font-semibold text-[#16202d]">{signature.label}</p>
              <p class="mt-1 font-mono text-xs text-[#657281]">{formatOffset(signature.offset)} / confidence {signature.confidence}%</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div class="rounded-lg border border-[#d8e0e5] bg-white">
        <PanelTitle icon={Braces} title="WASM Sections" meta={wasm.compileStatus} />
        <div class="p-4">
          <div class="mb-3 flex flex-wrap gap-2">
            <StatusPill tone={wasm.compileStatus === 'valid' ? 'success' : 'danger'}>{wasm.compileStatus}</StatusPill>
            <StatusPill>version {wasm.version ?? 0}</StatusPill>
            <StatusPill>{wasm.sections.length} sections</StatusPill>
          </div>
          {wasm.compileError ? <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{wasm.compileError}</div> : null}
          <div class="thin-scrollbar overflow-auto rounded-lg border border-[#d8e0e5]">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#edf4f8] text-xs uppercase text-[#536270]">
                <tr>
                  <th class="px-3 py-2">Section</th>
                  <th class="px-3 py-2">ID</th>
                  <th class="px-3 py-2">Offset</th>
                  <th class="px-3 py-2">Size</th>
                </tr>
              </thead>
              <tbody>
                {wasm.sections.map((section) => (
                  <tr class="border-t border-[#edf2f6] odd:bg-white even:bg-[#fbfcfe]" key={`${section.id}-${section.offset}`}>
                    <td class="px-3 py-2 font-semibold">{section.name}</td>
                    <td class="px-3 py-2 font-mono text-xs">{section.id}</td>
                    <td class="px-3 py-2 font-mono text-xs">{formatOffset(section.offset)}</td>
                    <td class="px-3 py-2 font-mono text-xs">{formatBytes(section.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside class="grid gap-4">
        <WasmList icon={Import} title="Imports" meta={`${wasm.imports.length}`} items={wasm.imports.map((item) => `${item.module ?? '-'} / ${item.name} (${item.kind})`)} />
        <WasmList icon={PackageOpen} title="Exports" meta={`${wasm.exports.length}`} items={wasm.exports.map((item) => `${item.name} (${item.kind})`)} />
        <WasmList icon={Cpu} title="Custom Sections" meta={`${wasm.customSections.length}`} items={wasm.customSections} />
      </aside>
    </section>
  )
}

function WasmList({
  icon,
  title,
  meta,
  items,
}: {
  icon: typeof Import
  title: string
  meta: string
  items: string[]
}) {
  return (
    <div class="rounded-lg border border-[#d8e0e5] bg-white">
      <PanelTitle icon={icon} title={title} meta={meta} />
      <div class="grid gap-2 p-3">
        {items.map((item) => (
          <div class="rounded-md border border-[#e2e8ee] bg-[#fbfcfe] px-3 py-2 font-mono text-xs text-[#263545]" key={item}>
            {item}
          </div>
        ))}
        {!items.length ? <p class="px-2 py-4 text-sm text-[#657281]">No records.</p> : null}
      </div>
    </div>
  )
}
