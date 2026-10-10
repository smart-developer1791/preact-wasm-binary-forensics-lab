import { bytesPerHexRow, maxHexRows } from '../domain/constants'
import { byteToHex, formatOffset } from '../domain/format'

export function HexTable({
  bytes,
  search,
}: {
  bytes: Uint8Array
  search: string
}) {
  const rows = []
  const searchBytes = search ? Array.from(new TextEncoder().encode(search)) : []
  const matches = new Set<number>()

  if (searchBytes.length) {
    for (let offset = 0; offset <= bytes.length - searchBytes.length; offset += 1) {
      if (searchBytes.every((byte, index) => bytes[offset + index] === byte)) {
        searchBytes.forEach((_, index) => matches.add(offset + index))
      }
    }
  }

  for (let offset = 0; offset < bytes.length && rows.length < maxHexRows; offset += bytesPerHexRow) {
    rows.push(bytes.slice(offset, offset + bytesPerHexRow))
  }

  return (
    <div class="thin-scrollbar max-h-[720px] overflow-auto rounded-lg border border-[#d8e0e5] bg-[#0e1621]">
      <table class="min-w-full border-collapse font-mono text-xs">
        <tbody>
          {rows.map((row, rowIndex) => {
            const offset = rowIndex * bytesPerHexRow
            return (
              <tr class="border-b border-white/5 last:border-0" key={offset}>
                <td class="sticky left-0 bg-[#0e1621] px-3 py-2 text-[#7fa6bf]">{formatOffset(offset)}</td>
                <td class="whitespace-nowrap px-3 py-2 text-[#d8e7f2]">
                  {Array.from(row).map((byte, index) => {
                    const absolute = offset + index
                    const hit = matches.has(absolute)
                    return (
                      <span class={`mr-1 inline-flex min-w-6 justify-center rounded px-1 ${hit ? 'bg-amber-300 text-[#16202d]' : ''}`} key={absolute}>
                        {byteToHex(byte)}
                      </span>
                    )
                  })}
                </td>
                <td class="whitespace-nowrap px-3 py-2 text-[#9fb1c2]">
                  {Array.from(row).map((byte, index) => {
                    const absolute = offset + index
                    const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.'
                    return (
                      <span class={matches.has(absolute) ? 'bg-amber-300 text-[#16202d]' : ''} key={absolute}>
                        {char}
                      </span>
                    )
                  })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {bytes.length > rows.length * bytesPerHexRow ? (
        <div class="border-t border-white/10 px-4 py-3 text-center text-xs text-[#9fb1c2]">
          Showing first {(rows.length * bytesPerHexRow).toLocaleString()} bytes for UI responsiveness.
        </div>
      ) : null}
    </div>
  )
}
