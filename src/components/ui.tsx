import type { ComponentChildren } from 'preact'
import type { IconComponent, Severity } from '../domain/types'

export function AppButton({
  children,
  icon: Icon,
  onClick,
  disabled,
  tone = 'light',
  className = '',
  title,
}: {
  children: ComponentChildren
  icon: IconComponent
  onClick?: () => void
  disabled?: boolean
  tone?: 'light' | 'dark' | 'accent' | 'danger'
  className?: string
  title?: string
}) {
  const toneClass =
    tone === 'dark'
      ? 'border-[#314154] bg-[#182232] text-white hover:bg-[#223249]'
      : tone === 'accent'
        ? 'border-cyan-700 bg-cyan-700 text-white shadow-sm shadow-cyan-950/10 hover:bg-cyan-800'
        : tone === 'danger'
          ? 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
          : 'border-[#cfd8df] bg-white text-[#16202d] shadow-sm shadow-[#16202d]/5 hover:bg-[#f7fafc]'

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      class={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition active:translate-y-px disabled:active:translate-y-0 ${toneClass} ${className}`}
    >
      <Icon class="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </button>
  )
}

export function PanelTitle({
  icon: Icon,
  title,
  meta,
  action,
}: {
  icon: IconComponent
  title: string
  meta?: string
  action?: ComponentChildren
}) {
  return (
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e0e5] px-4 py-3">
      <div class="flex min-w-0 items-center gap-2">
        <Icon class="h-4 w-4 shrink-0 text-cyan-700" />
        <h2 class="truncate text-base font-semibold text-[#16202d]">{title}</h2>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        {meta ? <span class="text-xs font-semibold uppercase text-[#667381]">{meta}</span> : null}
        {action}
      </div>
    </div>
  )
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
  meter = 0,
  meterClass = 'bg-cyan-700',
}: {
  icon: IconComponent
  label: string
  value: string
  detail: string
  tone: string
  meter?: number
  meterClass?: string
}) {
  const meterValue = Math.max(0, Math.min(100, meter))

  return (
    <div class="overflow-hidden rounded-lg border border-[#d8e0e5] bg-white shadow-sm shadow-[#16202d]/5 transition hover:-translate-y-0.5 hover:border-[#c3cfd8] hover:shadow-md hover:shadow-[#16202d]/8">
      <div class="h-1 bg-[#edf2f6]">
        <div class={`h-1 ${meterClass}`} style={{ width: `${meterValue}%` }} />
      </div>
      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase text-[#657281]">{label}</p>
            <p class="mt-2 truncate text-2xl font-semibold text-[#16202d]">{value}</p>
          </div>
          <div class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tone}`}>
            <Icon class="h-5 w-5" />
          </div>
        </div>
        <p class="mt-3 min-h-10 text-sm leading-5 text-[#566575]">{detail}</p>
      </div>
    </div>
  )
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ComponentChildren
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'dark' | 'info'
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : tone === 'danger'
          ? 'border-red-200 bg-red-50 text-red-800'
          : tone === 'dark'
            ? 'border-white/10 bg-white/5 text-white'
            : tone === 'info'
              ? 'border-sky-200 bg-sky-50 text-sky-800'
              : 'border-[#d8e0e5] bg-[#f7fafc] text-[#536270]'

  return <span class={`inline-flex min-h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${toneClass}`}>{children}</span>
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span class={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${severityClasses(severity)}`}>{severity}</span>
}

export function EmptyState({ children }: { children: ComponentChildren }) {
  return (
    <div class="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-[#cbd6de] bg-[#f7fafc] px-4 text-center text-sm text-[#657281]">
      {children}
    </div>
  )
}

export function severityClasses(severity: Severity) {
  if (severity === 'critical') return 'border-red-300 bg-red-50 text-red-800'
  if (severity === 'high') return 'border-orange-300 bg-orange-50 text-orange-800'
  if (severity === 'medium') return 'border-amber-300 bg-amber-50 text-amber-800'
  if (severity === 'low') return 'border-sky-300 bg-sky-50 text-sky-800'
  return 'border-emerald-300 bg-emerald-50 text-emerald-800'
}
