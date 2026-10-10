import { Binary, Braces, ChartNoAxesColumn, Crosshair, Gauge, ShieldAlert } from 'lucide-preact'
import { formatBytes, formatPercent } from '../domain/format'
import type { FileAnalysis } from '../domain/types'
import { MetricCard } from './ui'

export function MetricStrip({ analysis }: { analysis: FileAnalysis | null }) {
  const wasmExports = analysis?.wasm.exports.length ?? 0
  const fileSizeMeter = analysis ? Math.min(100, (analysis.size / (1024 * 1024)) * 100) : 0
  const findingsMeter = analysis ? Math.min(100, analysis.findings.length * 10) : 0
  const iocMeter = analysis ? Math.min(100, analysis.iocs.length * 8) : 0
  const wasmMeter = analysis?.wasm.compileStatus === 'valid' ? 100 : analysis?.wasm.validMagic ? 72 : 0

  return (
    <section class="binary-grid border-b border-[#d8e0e5] bg-[#eef3f6]">
      <div class="mx-auto grid max-w-[1560px] gap-3 px-4 py-4 sm:px-6 md:grid-cols-2 xl:grid-cols-6 lg:px-8">
        <MetricCard
          icon={Binary}
          label="Size"
          value={analysis ? formatBytes(analysis.size) : '0 B'}
          detail={analysis?.sha256.slice(0, 24) ?? 'Load a file to calculate SHA-256'}
          tone="bg-cyan-50 text-cyan-800"
          meter={fileSizeMeter}
          meterClass="bg-cyan-700"
        />
        <MetricCard
          icon={Gauge}
          label="Risk"
          value={analysis ? `${analysis.risk.score}` : '0'}
          detail={analysis ? `${analysis.risk.level} / ${analysis.risk.drivers[0]}` : 'Weighted forensic signal'}
          tone="bg-red-50 text-red-800"
          meter={analysis?.risk.score ?? 0}
          meterClass={analysis?.risk.level === 'critical' || analysis?.risk.level === 'high' ? 'bg-red-600' : analysis?.risk.level === 'medium' ? 'bg-amber-600' : 'bg-emerald-600'}
        />
        <MetricCard
          icon={ShieldAlert}
          label="Findings"
          value={`${analysis?.findings.length ?? 0}`}
          detail={`${analysis?.signatures.length ?? 0} primary signatures, ${analysis?.embeddedSignatures.length ?? 0} embedded`}
          tone="bg-orange-50 text-orange-800"
          meter={findingsMeter}
          meterClass="bg-orange-600"
        />
        <MetricCard
          icon={ChartNoAxesColumn}
          label="Entropy"
          value={analysis ? analysis.averageEntropy.toFixed(2) : '0.00'}
          detail={analysis ? `${formatPercent(analysis.highEntropyRatio * 100)} high-entropy blocks` : 'Compression and packing signal'}
          tone="bg-amber-50 text-amber-800"
          meter={analysis ? (analysis.averageEntropy / 8) * 100 : 0}
          meterClass="bg-amber-600"
        />
        <MetricCard
          icon={Crosshair}
          label="IOCs"
          value={`${analysis?.iocs.length ?? 0}`}
          detail={analysis ? `${formatPercent(analysis.printableRatio * 100)} printable bytes` : 'URLs, secrets, hashes, paths'}
          tone="bg-sky-50 text-sky-800"
          meter={iocMeter}
          meterClass="bg-sky-600"
        />
        <MetricCard
          icon={Braces}
          label="WASM"
          value={`${wasmExports}`}
          detail={analysis?.wasm.compileStatus === 'valid' ? `${analysis.wasm.sections.length} sections inspected` : 'Load a WASM module'}
          tone="bg-violet-50 text-violet-800"
          meter={wasmMeter}
          meterClass="bg-violet-600"
        />
      </div>
    </section>
  )
}
