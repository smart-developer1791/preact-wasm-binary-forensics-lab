import { FileJson2, Save } from 'lucide-preact'
import { AppButton, EmptyState, PanelTitle, SeverityBadge, StatusPill } from '../components/ui'
import { exportReport } from '../domain/export'
import type { BinaryDiff, FileAnalysis } from '../domain/types'

export function ReportView({
  primary,
  comparison,
  diff,
  notes,
  onNotesChange,
  onExport,
}: {
  primary: FileAnalysis | null
  comparison: FileAnalysis | null
  diff: BinaryDiff | null
  notes: string
  onNotesChange: (value: string) => void
  onExport: () => void
}) {
  if (!primary) return <EmptyState>Load a file to generate an investigation report.</EmptyState>

  const reportPreview = JSON.stringify(exportReport(primary, comparison, diff, notes), null, 2)

  return (
    <section class="grid gap-4 xl:grid-cols-[420px_1fr]">
      <div class="rounded-lg border border-[#d8e0e5] bg-white">
        <PanelTitle icon={FileJson2} title="Investigation Notes" meta="stored locally" action={<AppButton icon={Save} onClick={onExport}>Export JSON</AppButton>} />
        <div class="grid gap-3 p-4">
          <div class="flex flex-wrap gap-2">
            <StatusPill>{primary.findings.length.toLocaleString()} findings</StatusPill>
            <StatusPill>{primary.strings.length.toLocaleString()} strings</StatusPill>
            <StatusPill>{primary.iocs.length.toLocaleString()} IOCs</StatusPill>
            <StatusPill tone={primary.risk.level === 'high' || primary.risk.level === 'critical' ? 'danger' : primary.risk.level === 'medium' ? 'warning' : 'success'}>risk {primary.risk.score}</StatusPill>
            <StatusPill tone={comparison ? 'success' : 'neutral'}>{comparison ? 'diff included' : 'no diff'}</StatusPill>
            <StatusPill>{notes.trim().length.toLocaleString()} note chars</StatusPill>
          </div>
          <textarea
            class="min-h-56 rounded-lg border border-[#d0d9e0] bg-[#f7fafc] p-3 text-sm outline-none"
            value={notes}
            onInput={(event) => onNotesChange((event.currentTarget as HTMLTextAreaElement).value)}
            placeholder="Add investigation notes, assumptions, or next steps..."
          />
          <div class="grid gap-2">
            {primary.findings.slice(0, 6).map((finding) => (
              <div class="rounded-lg border border-[#e2e8ee] bg-[#fbfcfe] p-3" key={finding.id}>
                <div class="flex items-start justify-between gap-3">
                  <p class="font-semibold text-[#16202d]">{finding.title}</p>
                  <SeverityBadge severity={finding.severity} />
                </div>
                <p class="mt-1 text-sm text-[#566575]">{finding.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-[#d8e0e5] bg-white">
        <PanelTitle icon={FileJson2} title="Report Preview" meta={`${reportPreview.length.toLocaleString()} chars`} />
        <div class="p-4">
          <pre class="thin-scrollbar max-h-[780px] overflow-auto rounded-lg border border-[#d8e0e5] bg-[#0e1621] p-4 font-mono text-xs leading-5 text-[#d8e7f2]">{reportPreview}</pre>
        </div>
      </div>
    </section>
  )
}
