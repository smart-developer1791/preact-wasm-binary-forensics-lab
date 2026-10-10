export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = Math.max(0, bytes)
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function formatOffset(offset: number) {
  return `0x${offset.toString(16).toUpperCase().padStart(8, '0')}`
}

export function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`
}

export function byteToHex(byte: number) {
  return byte.toString(16).toUpperCase().padStart(2, '0')
}

export function bytesToHex(bytes: Uint8Array, maxLength = bytes.length) {
  return Array.from(bytes.slice(0, maxLength)).map(byteToHex).join(' ')
}

export function safeText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}
