import {
  Activity,
  Binary,
  Braces,
  ChartNoAxesColumn,
  Copy,
  Crosshair,
  Download,
  FileArchive,
  FileJson2,
  FileSearch,
  Fingerprint,
  Gauge,
  GitCompare,
  ListChecks,
  Network,
  Search,
  ShieldAlert,
} from 'lucide-preact'
import { format } from 'date-fns'
import { EntropyMap } from '../components/entropy-map'
import { AppButton, EmptyState, PanelTitle, SeverityBadge, StatusPill } from '../components/ui'
import { byteToHex, formatBytes, formatOffset, formatPercent } from '../domain/format'
import type { BinarySignature, FileAnalysis, IconComponent, IocKind, RiskSummary, Severity, ViewMode, ZipEntry } from '../domain/types'

const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const iocOrder: IocKind[] = ['secret', 'url', 'domain', 'email', 'ipv4', 'hash', 'path']

const iocLabels: Record<IocKind, string> = {
  url: 'URLs',
  domain: 'Domains',
  email: 'Emails',
  ipv4: 'IPv4',
  hash: 'Hashes',
  secret: 'Secrets',
  path: 'Paths',
}

export function OverviewView({
  analysis,
  onChangeView,
  onCarveSignature,
  onCopyText,
}: {
  analysis: FileAnalysis | null
  onChangeView: (view: ViewMode) => void
  onCarveSignature: (signature: BinarySignature) => void
  onCopyText: (value: string, label: string) => void
}) {
  if (!analysis) return <EmptyState>Load a sample or open a local binary file to start the forensic pass.</EmptyState>

  const severityBreakdown = severityOrder.map((severity) => ({
    severity,
    count: analysis.findings.filter((finding) => finding.severity === severity).length,
  }))
  const iocBreakdown = iocOrder.map((kind) => ({
    kind,
    count: analysis.iocs.filter((ioc) => ioc.kind === kind).length,
  }))
  const highPriorityFindings = analysis.findings.filter((finding) => finding.severity === 'critical' || finding.severity === 'high').length
  const signatureHits = analysis.signatures.length + analysis.embeddedSignatures.length

  return (
    <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div class="grid gap-4">
        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle
            icon={Fingerprint}
            title="File Identity"
            meta={analysis.name}
            action={
              <div class="flex flex-wrap gap-2">
                <AppButton icon={Search} onClick={() => onChangeView('strings')}>Strings</AppButton>
                <AppButton icon={Binary} onClick={() => onChangeView('hex')}>Hex</AppButton>
              </div>
            }
          />
          <div class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <IdentityStat label="Size" value={formatBytes(analysis.size)} />
            <IdentityStat label="SHA-256" value={analysis.sha256.slice(0, 24)} mono />
            <IdentityStat label="Printable" value={formatPercent(analysis.printableRatio * 100)} />
            <IdentityStat label="Zero bytes" value={formatPercent(analysis.zeroRatio * 100)} />
            <IdentityStat label="Analyzed" value={format(new Date(analysis.analyzedAt), 'yyyy-MM-dd HH:mm:ss')} />
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle icon={ListChecks} title="Triage Board" meta={`${highPriorityFindings} high-priority findings`} />
          <div class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
            <TriageAction
              icon={Crosshair}
              label="Review IOCs"
              value={`${analysis.iocs.length}`}
              detail={`${iocBreakdown.filter((item) => item.count > 0).length} indicator groups`}
              tone={analysis.iocs.some((ioc) => ioc.kind === 'secret') ? 'danger' : analysis.iocs.length ? 'warning' : 'success'}
              onClick={() => onChangeView('iocs')}
            />
            <TriageAction
              icon={Search}
              label="Search strings"
              value={`${analysis.strings.length}`}
              detail={`${analysis.strings.filter((item) => item.tags.length > 0).length} tagged strings`}
              tone={analysis.strings.length ? 'info' : 'neutral'}
              onClick={() => onChangeView('strings')}
            />
            <TriageAction
              icon={Binary}
              label="Inspect bytes"
              value={formatBytes(analysis.size)}
              detail={`${signatureHits} signature hits`}
              tone={analysis.embeddedSignatures.length ? 'warning' : 'neutral'}
              onClick={() => onChangeView('hex')}
            />
            <TriageAction
              icon={Braces}
              label="Validate WASM"
              value={analysis.wasm.compileStatus}
              detail={`${analysis.wasm.sections.length} sections / ${analysis.wasm.imports.length} imports`}
              tone={analysis.wasm.compileStatus === 'valid' ? 'success' : analysis.wasm.validMagic ? 'danger' : 'neutral'}
              onClick={() => onChangeView('wasm')}
            />
            <TriageAction
              icon={FileSearch}
              label="Export report"
              value={`${analysis.findings.length}`}
              detail="JSON evidence bundle"
              tone={analysis.findings.length ? 'info' : 'success'}
              onClick={() => onChangeView('report')}
            />
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle
            icon={Gauge}
            title="Risk & IOC Summary"
            meta={`${analysis.risk.level} / ${analysis.iocs.length} indicators`}
            action={<AppButton icon={Crosshair} onClick={() => onChangeView('iocs')}>Open IOCs</AppButton>}
          />
          <div class="grid gap-4 p-4 lg:grid-cols-[230px_minmax(0,1fr)]">
            <RiskDial risk={analysis.risk} averageEntropy={analysis.averageEntropy} highEntropyRatio={analysis.highEntropyRatio} />
            <div class="grid gap-4">
              <SeverityStack items={severityBreakdown} />

              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {severityBreakdown.map((item) => (
                  <BreakdownCell key={item.severity} label={item.severity} value={item.count} severity={item.severity} />
                ))}
              </div>

              <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-xs font-semibold uppercase text-[#657281]">
                    <Network class="h-4 w-4 text-cyan-700" />
                    IOC mix
                  </div>
                  <StatusPill tone={analysis.iocs.length ? 'info' : 'neutral'}>{analysis.iocs.length} total</StatusPill>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  {iocBreakdown.map((item) => (
                    <span
                      class={`inline-flex min-h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${item.count > 0 ? 'border-cyan-200 bg-cyan-50 text-cyan-900' : 'border-[#d8e0e5] bg-white text-[#73808c]'}`}
                      key={item.kind}
                    >
                      {iocLabels[item.kind]}
                      <span class="font-mono">{item.count}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div class="grid gap-2">
                <p class="text-xs font-semibold uppercase text-[#657281]">Risk drivers</p>
                {analysis.risk.drivers.map((driver) => (
                  <div class="rounded-md border border-[#e2e8ee] bg-[#fbfcfe] px-3 py-2 text-sm text-[#536270]" key={driver}>
                    {driver}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle icon={ChartNoAxesColumn} title="Entropy Heatmap" meta={`${analysis.entropyBlocks.length} blocks`} />
          <div class="p-4">
            <EntropyMap blocks={analysis.entropyBlocks} />
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle
            icon={ShieldAlert}
            title="Top Findings"
            meta={`${analysis.findings.length} total`}
            action={<AppButton icon={FileJson2} onClick={() => onChangeView('report')}>Report</AppButton>}
          />
          <div class="grid gap-3 p-4 md:grid-cols-2">
            {analysis.findings.slice(0, 8).map((finding) => (
              <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3" key={finding.id}>
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold text-[#16202d]">{finding.title}</p>
                    <p class="mt-1 text-sm text-[#566575]">{finding.detail}</p>
                  </div>
                  <SeverityBadge severity={finding.severity} />
                </div>
                <p class="mt-3 break-words font-mono text-xs text-[#697786]">{finding.offset !== undefined ? `${formatOffset(finding.offset)} / ` : ''}{finding.evidence}</p>
              </div>
            ))}
            {analysis.findings.length === 0 ? <p class="text-sm text-[#657281]">No notable findings were generated for this file.</p> : null}
          </div>
        </div>
      </div>

      <aside class="grid gap-4">
        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle icon={Binary} title="Signatures" meta={`${signatureHits} hits`} />
          <div class="grid gap-2 p-3">
            {[...analysis.signatures, ...analysis.embeddedSignatures].map((signature) => (
              <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3" key={`${signature.id}-${signature.offset}`}>
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold text-[#16202d]">{signature.label}</p>
                    <p class="mt-1 text-xs text-[#657281]">{signature.description}</p>
                  </div>
                  <div class="flex shrink-0 flex-wrap justify-end gap-2">
                    <StatusPill tone={signature.offset === 0 ? 'success' : 'warning'}>{signature.offset === 0 ? 'primary' : 'embedded'}</StatusPill>
                    <StatusPill>{signature.confidence}%</StatusPill>
                  </div>
                </div>
                <div class="mt-3 h-1.5 rounded-full bg-[#e5edf3]">
                  <div class="h-1.5 rounded-full bg-cyan-700" style={{ width: `${Math.max(4, signature.confidence)}%` }} />
                </div>
                <p class="mt-2 font-mono text-xs text-[#697786]">{formatOffset(signature.offset)} / .{signature.extension}</p>
                {signature.offset > 0 ? (
                  <button
                    class="mt-3 inline-flex min-h-8 items-center gap-2 rounded-md border border-[#cfd8df] bg-white px-2 text-xs font-semibold text-[#16202d] hover:bg-[#f7fafc]"
                    type="button"
                    onClick={() => onCarveSignature(signature)}
                  >
                    <Download class="h-3.5 w-3.5" />
                    Download slice
                  </button>
                ) : null}
              </div>
            ))}
            {signatureHits === 0 ? <p class="px-2 py-4 text-sm text-[#657281]">No known magic signatures found.</p> : null}
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle icon={Fingerprint} title="Hash Manifest" meta="browser crypto" />
          <div class="grid gap-2 p-3">
            <HashRow label="SHA-1" value={analysis.sha1} onCopy={onCopyText} />
            <HashRow label="SHA-256" value={analysis.sha256} onCopy={onCopyText} />
            <HashRow label="SHA-512" value={analysis.sha512} onCopy={onCopyText} />
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle icon={Activity} title="Byte Histogram" meta="top 24" />
          <div class="grid gap-2 p-3">
            {analysis.histogram.slice(0, 12).map((item) => (
              <div class="grid grid-cols-[44px_1fr_48px] items-center gap-2 text-xs" key={item.byte}>
                <span class="font-mono font-semibold text-[#16202d]">{byteToHex(item.byte)}</span>
                <div class="h-2 rounded-full bg-[#e5edf3]">
                  <div class="h-2 rounded-full bg-cyan-700" style={{ width: `${Math.max(2, item.percentage)}%` }} />
                </div>
                <span class="text-right text-[#657281]">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle
            icon={Braces}
            title="WASM Summary"
            meta={analysis.wasm.compileStatus}
            action={<AppButton icon={Braces} onClick={() => onChangeView('wasm')}>Open</AppButton>}
          />
          <div class="grid gap-2 p-3 text-sm">
            <StatusPill tone={analysis.wasm.compileStatus === 'valid' ? 'success' : analysis.wasm.validMagic ? 'danger' : 'neutral'}>
              {analysis.wasm.validMagic ? 'WASM magic present' : 'No WASM header'}
            </StatusPill>
            <StatusPill>{analysis.wasm.sections.length} sections</StatusPill>
            <StatusPill>{analysis.wasm.imports.length} imports</StatusPill>
            <StatusPill>{analysis.wasm.exports.length} exports</StatusPill>
          </div>
        </div>

        <div class="rounded-lg border border-[#d8e0e5] bg-white">
          <PanelTitle
            icon={FileArchive}
            title="Container"
            meta={analysis.zip ? 'ZIP inspected' : 'not archive'}
            action={<AppButton icon={GitCompare} onClick={() => onChangeView('diff')}>Diff</AppButton>}
          />
          <div class="p-3">
            {analysis.zip ? (
              <div class="grid gap-3">
                <div class="grid grid-cols-2 gap-2">
                  <ArchiveMetric label="Entries" value={`${analysis.zip.entryCount}`} />
                  <ArchiveMetric label="Unpacked" value={formatBytes(analysis.zip.totalUncompressedSize)} />
                </div>
                {analysis.zip.error ? (
                  <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{analysis.zip.error}</div>
                ) : null}
                <div class="grid gap-2">
                  {analysis.zip.entries.slice(0, 7).map((entry) => (
                    <ArchiveEntryRow entry={entry} key={entry.name} />
                  ))}
                </div>
                {analysis.zip.entries.length > 7 ? <p class="px-1 text-xs text-[#657281]">+{analysis.zip.entries.length - 7} more entries in report export</p> : null}
              </div>
            ) : (
              <p class="text-sm text-[#657281]">No supported archive structure detected.</p>
            )}
          </div>
        </div>
      </aside>
    </section>
  )
}

function IdentityStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3">
      <p class="text-xs font-semibold uppercase text-[#657281]">{label}</p>
      <p class={`mt-2 truncate text-sm font-semibold text-[#16202d] ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function TriageAction({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  onClick,
}: {
  icon: IconComponent
  label: string
  value: string
  detail: string
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  onClick: () => void
}) {
  return (
    <button
      class={`group min-h-[118px] rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#16202d]/8 ${triageToneClass(tone)}`}
      type="button"
      onClick={onClick}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/75 text-[#16202d] shadow-sm shadow-[#16202d]/5">
          <Icon class="h-5 w-5" />
        </div>
        <span class="max-w-[120px] break-words text-right font-mono text-lg font-semibold leading-tight text-[#16202d]">{value}</span>
      </div>
      <p class="mt-4 text-sm font-semibold text-[#16202d]">{label}</p>
      <p class="mt-1 text-xs leading-5 text-[#596776]">{detail}</p>
    </button>
  )
}

function RiskDial({
  risk,
  averageEntropy,
  highEntropyRatio,
}: {
  risk: RiskSummary
  averageEntropy: number
  highEntropyRatio: number
}) {
  const score = Math.max(0, Math.min(100, risk.score))
  const accent = riskAccent(risk.level)
  const degrees = Math.round(score * 3.6)

  return (
    <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-4">
      <div
        class="mx-auto flex h-40 w-40 items-center justify-center rounded-full p-2"
        style={{ background: `conic-gradient(${accent} ${degrees}deg, #e5edf3 ${degrees}deg 360deg)` }}
      >
        <div class="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-inner shadow-[#16202d]/5">
          <span class="text-xs font-semibold uppercase text-[#657281]">Risk</span>
          <span class="text-4xl font-semibold text-[#16202d]">{score}</span>
          <StatusPill tone={riskToPillTone(risk.level)}>{risk.level}</StatusPill>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <div class="rounded-md border border-[#e2e8ee] bg-white px-3 py-2">
          <p class="text-xs font-semibold uppercase text-[#657281]">Entropy</p>
          <p class="mt-1 font-mono text-sm font-semibold text-[#16202d]">{averageEntropy.toFixed(2)}</p>
        </div>
        <div class="rounded-md border border-[#e2e8ee] bg-white px-3 py-2">
          <p class="text-xs font-semibold uppercase text-[#657281]">High blocks</p>
          <p class="mt-1 font-mono text-sm font-semibold text-[#16202d]">{formatPercent(highEntropyRatio * 100)}</p>
        </div>
      </div>
    </div>
  )
}

function BreakdownCell({ label, value, severity }: { label: string; value: number; severity: Severity }) {
  return (
    <div class={`rounded-lg border px-3 py-2 ${severityToneClass(severity, value > 0)}`}>
      <p class="text-xs font-semibold uppercase">{label}</p>
      <p class="mt-2 font-mono text-2xl font-semibold">{value}</p>
    </div>
  )
}

function SeverityStack({ items }: { items: Array<{ severity: Severity; count: number }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase text-[#657281]">Finding severity</p>
        <StatusPill tone={total > 0 ? 'info' : 'neutral'}>{total} total</StatusPill>
      </div>
      <div class="mt-3 flex h-3 overflow-hidden rounded-full bg-[#e5edf3]">
        {total > 0 ? (
          items.map((item) =>
            item.count > 0 ? (
              <div
                class={severityBarClass(item.severity)}
                key={item.severity}
                style={{ width: `${(item.count / total) * 100}%` }}
                title={`${item.severity}: ${item.count}`}
              />
            ) : null,
          )
        ) : (
          <div class="h-full w-full bg-[#d8e0e5]" />
        )}
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span class="inline-flex items-center gap-2 text-xs font-semibold text-[#596776]" key={item.severity}>
            <span class={`h-2.5 w-2.5 rounded-full ${severityDotClass(item.severity)}`} />
            {item.severity}
          </span>
        ))}
      </div>
    </div>
  )
}

function HashRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string, label: string) => void }) {
  return (
    <div class="rounded-md border border-[#e2e8ee] bg-[#fbfcfe] px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase text-[#657281]">{label}</p>
        <button
          aria-label={`Copy ${label}`}
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#cfd8df] bg-white text-[#536270] transition hover:bg-[#f7fafc] hover:text-[#16202d]"
          title={`Copy ${label}`}
          type="button"
          onClick={() => onCopy(value, label)}
        >
          <Copy class="h-3.5 w-3.5" />
        </button>
      </div>
      <p class="mt-1 break-all font-mono text-xs text-[#263545]">{value}</p>
    </div>
  )
}

function ArchiveMetric({ label, value }: { label: string; value: string }) {
  return (
    <div class="rounded-md border border-[#e2e8ee] bg-[#fbfcfe] px-3 py-2">
      <p class="text-xs font-semibold uppercase text-[#657281]">{label}</p>
      <p class="mt-1 truncate font-mono text-sm font-semibold text-[#16202d]">{value}</p>
    </div>
  )
}

function ArchiveEntryRow({ entry }: { entry: ZipEntry }) {
  return (
    <div class={`rounded-md border px-3 py-2 ${entry.suspicious ? 'border-amber-200 bg-amber-50' : 'border-[#e2e8ee] bg-[#fbfcfe]'}`}>
      <div class="flex items-start justify-between gap-2">
        <p class="min-w-0 break-words font-mono text-xs font-semibold text-[#16202d]">{entry.name}</p>
        <StatusPill tone={entry.suspicious ? 'warning' : 'neutral'}>{entry.extension || 'file'}</StatusPill>
      </div>
      <p class="mt-2 text-xs text-[#657281]">{formatBytes(entry.size)} / {entry.suspicious ? 'flagged' : 'normal name'}</p>
    </div>
  )
}

function triageToneClass(tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info') {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 hover:border-amber-300'
  if (tone === 'danger') return 'border-red-200 bg-red-50 hover:border-red-300'
  if (tone === 'info') return 'border-sky-200 bg-sky-50 hover:border-sky-300'
  return 'border-[#e2e8ee] bg-[#fbfcfe] hover:border-[#cbd6de]'
}

function riskAccent(level: RiskSummary['level']) {
  if (level === 'critical') return '#dc2626'
  if (level === 'high') return '#ea580c'
  if (level === 'medium') return '#d97706'
  return '#059669'
}

function riskToPillTone(level: RiskSummary['level']): 'success' | 'warning' | 'danger' {
  if (level === 'critical' || level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  return 'success'
}

function severityToneClass(severity: Severity, active: boolean) {
  if (!active) return 'border-[#e2e8ee] bg-[#fbfcfe] text-[#73808c]'
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-800'
  if (severity === 'high') return 'border-orange-200 bg-orange-50 text-orange-800'
  if (severity === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (severity === 'low') return 'border-sky-200 bg-sky-50 text-sky-800'
  return 'border-emerald-200 bg-emerald-50 text-emerald-800'
}

function severityBarClass(severity: Severity) {
  if (severity === 'critical') return 'h-full bg-red-600'
  if (severity === 'high') return 'h-full bg-orange-500'
  if (severity === 'medium') return 'h-full bg-amber-500'
  if (severity === 'low') return 'h-full bg-sky-500'
  return 'h-full bg-emerald-500'
}

function severityDotClass(severity: Severity) {
  if (severity === 'critical') return 'bg-red-600'
  if (severity === 'high') return 'bg-orange-500'
  if (severity === 'medium') return 'bg-amber-500'
  if (severity === 'low') return 'bg-sky-500'
  return 'bg-emerald-500'
}
