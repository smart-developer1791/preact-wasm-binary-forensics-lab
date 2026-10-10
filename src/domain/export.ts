import type { BinaryDiff, FileAnalysis } from './types'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function bytesToBlobPart(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

export function exportReport(primary: FileAnalysis, comparison: FileAnalysis | null, diff: BinaryDiff | null, notes: string) {
  const { bytes: _primaryBytes, ...primaryReport } = primary
  const comparisonReport = comparison
    ? (() => {
        const { bytes: _comparisonBytes, ...rest } = comparison
        return rest
      })()
    : null

  return {
    generatedAt: new Date().toISOString(),
    notes,
    primary: primaryReport,
    comparison: comparisonReport,
    diff,
  }
}
