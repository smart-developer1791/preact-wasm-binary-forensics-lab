import { formatOffset } from '../domain/format'
import type { EntropyBlock } from '../domain/types'

export function EntropyMap({ blocks }: { blocks: EntropyBlock[] }) {
  if (!blocks.length) {
    return <div class="min-h-20 rounded-lg border border-dashed border-[#cbd6de] bg-[#f7fafc]" />
  }

  return (
    <div class="grid gap-2">
      <div class="grid grid-cols-12 gap-1 sm:[grid-template-columns:repeat(16,minmax(0,1fr))] lg:[grid-template-columns:repeat(24,minmax(0,1fr))]">
        {blocks.map((block) => (
          <div
            class={`h-8 rounded-sm border ${
              block.level === 'high'
                ? 'border-red-300 bg-red-500'
                : block.level === 'medium'
                  ? 'border-amber-300 bg-amber-400'
                  : 'border-sky-200 bg-sky-200'
            }`}
            title={`${formatOffset(block.offset)} / entropy ${block.entropy.toFixed(2)}`}
            key={block.offset}
          />
        ))}
      </div>
      <div class="flex flex-wrap gap-2 text-xs text-[#657281]">
        <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-sky-200" /> low</span>
        <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-amber-400" /> medium</span>
        <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-red-500" /> high</span>
      </div>
    </div>
  )
}
