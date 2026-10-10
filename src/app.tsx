import { useEffect, useMemo, useState } from 'preact/hooks'
import { get, set } from 'idb-keyval'
import { Fingerprint } from 'lucide-preact'
import { Header } from './components/header'
import { MetricStrip } from './components/metric-strip'
import { WorkbenchNav } from './components/workbench-nav'
import { analyzeBytes } from './domain/analyzer'
import { compareFiles } from './domain/diff'
import { bytesToBlobPart, downloadBlob, exportReport } from './domain/export'
import { iocsToCsv } from './domain/ioc'
import { initialSampleName, samplePayloadUrl, sampleWasmUrl, sampleZipUrl } from './domain/constants'
import type { BinarySignature, FileAnalysis, ViewMode } from './domain/types'
import { DiffView } from './views/diff-view'
import { HexView } from './views/hex-view'
import { IocsView } from './views/iocs-view'
import { OverviewView } from './views/overview-view'
import { ReportView } from './views/report-view'
import { StringsView } from './views/strings-view'
import { WasmView } from './views/wasm-view'

const notesKey = 'preact-wasm-binary-forensics-lab:notes'
const viewKey = 'preact-wasm-binary-forensics-lab:view'

export function App() {
  const [primary, setPrimary] = useState<FileAnalysis | null>(null)
  const [comparison, setComparison] = useState<FileAnalysis | null>(null)
  const [activeView, setActiveView] = useState<ViewMode>('overview')
  const [status, setStatus] = useState('Ready')
  const [notes, setNotes] = useState('')
  const [initialLoaded, setInitialLoaded] = useState(false)

  const diff = useMemo(() => (primary && comparison ? compareFiles(primary, comparison) : null), [primary, comparison])

  useEffect(() => {
    let mounted = true
    void Promise.all([get<string>(notesKey), get<ViewMode>(viewKey)]).then(([savedNotes, savedView]) => {
      if (!mounted) return
      if (savedNotes) setNotes(savedNotes)
      if (savedView) setActiveView(savedView)
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    void set(notesKey, notes)
  }, [notes])

  useEffect(() => {
    void set(viewKey, activeView)
  }, [activeView])

  useEffect(() => {
    if (initialLoaded) return
    setInitialLoaded(true)
    void loadFromUrl(samplePayloadUrl, initialSampleName)
  }, [initialLoaded])

  async function loadFromUrl(url: string, name: string, target: 'primary' | 'comparison' = 'primary') {
    setStatus(`Loading ${name}...`)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Could not load ${name}`)
      const bytes = new Uint8Array(await response.arrayBuffer())
      await openBytes(bytes, name, target)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Could not load ${name}`)
    }
  }

  async function openBytes(bytes: Uint8Array, name: string, target: 'primary' | 'comparison' = 'primary') {
    setStatus(`Analyzing ${name}...`)
    try {
      const analysis = await analyzeBytes(bytes, name)
      if (target === 'comparison') {
        setComparison(analysis)
      } else {
        setPrimary(analysis)
      }
      setStatus(`Analyzed ${name}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Could not analyze ${name}`)
    }
  }

  async function handleFileUpload(event: Event, target: 'primary' | 'comparison' = 'primary') {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    await openBytes(new Uint8Array(await file.arrayBuffer()), file.name, target)
    input.value = ''
  }

  function downloadReport() {
    if (!primary) return
    const report = exportReport(primary, comparison, diff, notes)
    downloadBlob(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
      `${primary.name.replace(/\.[^.]+$/, '') || 'binary'}-forensic-report.json`,
    )
  }

  function downloadIocsCsv() {
    if (!primary) return
    downloadBlob(new Blob([iocsToCsv(primary.iocs)], { type: 'text/csv' }), `${primary.name.replace(/\.[^.]+$/, '') || 'binary'}-iocs.csv`)
  }

  function copyIocsCsv() {
    if (!primary) return
    const csv = iocsToCsv(primary.iocs)
    if (!navigator.clipboard?.writeText) {
      downloadBlob(new Blob([csv], { type: 'text/csv' }), `${primary.name.replace(/\.[^.]+$/, '') || 'binary'}-iocs.csv`)
      setStatus('Clipboard unavailable; IOC CSV downloaded')
      return
    }

    void navigator.clipboard
      .writeText(csv)
      .then(() => {
        setStatus('IOC CSV copied')
      })
      .catch(() => {
        downloadBlob(new Blob([csv], { type: 'text/csv' }), `${primary.name.replace(/\.[^.]+$/, '') || 'binary'}-iocs.csv`)
        setStatus('Clipboard blocked; IOC CSV downloaded')
      })
  }

  function copyText(value: string, label: string) {
    if (!navigator.clipboard?.writeText) {
      setStatus('Clipboard unavailable')
      return
    }

    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setStatus(`${label} copied`)
      })
      .catch(() => {
        setStatus('Clipboard blocked')
      })
  }

  function downloadEmbeddedSignature(signature: BinarySignature) {
    if (!primary) return
    const nextOffset =
      primary.embeddedSignatures
        .map((item) => item.offset)
        .filter((offset) => offset > signature.offset)
        .sort((left, right) => left - right)[0] ?? Math.min(primary.bytes.length, signature.offset + 256 * 1024)
    const end = Math.min(primary.bytes.length, nextOffset)
    const slice = primary.bytes.slice(signature.offset, end)
    downloadBlob(
      new Blob([bytesToBlobPart(slice)], { type: signature.mime || 'application/octet-stream' }),
      `${primary.name.replace(/\.[^.]+$/, '') || 'binary'}-carve-${signature.offset.toString(16)}.${signature.extension || 'bin'}`,
    )
  }

  return (
    <main class="min-h-screen bg-[#f3f6f8] text-[#16202d]">
      <Header
        primary={primary}
        comparison={comparison}
        status={status}
        onLoadPayload={() => void loadFromUrl(samplePayloadUrl, 'sample-payload.bin')}
        onLoadWasm={() => void loadFromUrl(sampleWasmUrl, 'sample-module.wasm')}
        onLoadZip={() => void loadFromUrl(sampleZipUrl, 'sample-incident.zip')}
        onOpenPrimary={(event) => void handleFileUpload(event)}
        onOpenComparison={(event) => void handleFileUpload(event, 'comparison')}
        onExportReport={downloadReport}
      />

      <MetricStrip analysis={primary} />
      <WorkbenchNav activeView={activeView} onChange={setActiveView} />

      <div class="mx-auto max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        {activeView === 'overview' ? (
          <OverviewView
            analysis={primary}
            onChangeView={setActiveView}
            onCarveSignature={downloadEmbeddedSignature}
            onCopyText={copyText}
          />
        ) : null}
        {activeView === 'hex' ? <HexView analysis={primary} /> : null}
        {activeView === 'strings' ? <StringsView analysis={primary} /> : null}
        {activeView === 'iocs' ? <IocsView analysis={primary} onExportCsv={downloadIocsCsv} onCopyCsv={copyIocsCsv} /> : null}
        {activeView === 'wasm' ? (
          <WasmView
            analysis={primary}
            onLoadWasmSample={() => void loadFromUrl(sampleWasmUrl, 'sample-module.wasm')}
          />
        ) : null}
        {activeView === 'diff' ? (
          <DiffView
            primary={primary}
            comparison={comparison}
            diff={diff}
            onLoadComparison={() => void loadFromUrl(sampleZipUrl, 'sample-incident.zip', 'comparison')}
            onOpenComparison={(event) => void handleFileUpload(event, 'comparison')}
          />
        ) : null}
        {activeView === 'report' ? (
          <ReportView
            primary={primary}
            comparison={comparison}
            diff={diff}
            notes={notes}
            onNotesChange={setNotes}
            onExport={downloadReport}
          />
        ) : null}

        <footer class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d8e0e5] bg-white px-4 py-3 text-xs text-[#657281]">
          <span class="inline-flex items-center gap-2">
            <Fingerprint class="h-4 w-4 text-cyan-700" />
            Local-first inspection. Files stay inside the browser runtime.
          </span>
          <span>Desktop-first binary UI with mobile-safe stacked views.</span>
        </footer>
      </div>
    </main>
  )
}
