import { bytesToHex } from './format'
import type { BinaryDiff, DiffRange, FileAnalysis } from './types'

export function compareFiles(primary: FileAnalysis, comparison: FileAnalysis): BinaryDiff {
  const comparedBytes = Math.min(primary.bytes.length, comparison.bytes.length)
  let differentBytes = Math.abs(primary.bytes.length - comparison.bytes.length)
  const ranges: DiffRange[] = []
  let rangeStart = -1

  for (let index = 0; index < comparedBytes; index += 1) {
    const different = primary.bytes[index] !== comparison.bytes[index]
    if (different) {
      differentBytes += 1
      if (rangeStart === -1) rangeStart = index
    } else if (rangeStart !== -1) {
      pushRange(ranges, primary.bytes, comparison.bytes, rangeStart, index)
      rangeStart = -1
    }
  }

  if (rangeStart !== -1) pushRange(ranges, primary.bytes, comparison.bytes, rangeStart, comparedBytes)
  if (primary.bytes.length !== comparison.bytes.length) {
    pushRange(ranges, primary.bytes, comparison.bytes, comparedBytes, Math.max(primary.bytes.length, comparison.bytes.length))
  }

  const maxSize = Math.max(primary.bytes.length, comparison.bytes.length, 1)
  const similarity = 100 - (differentBytes / maxSize) * 100

  return {
    primaryName: primary.name,
    comparisonName: comparison.name,
    primarySize: primary.size,
    comparisonSize: comparison.size,
    sizeDelta: comparison.size - primary.size,
    comparedBytes,
    differentBytes,
    similarity: Math.max(0, similarity),
    ranges: ranges.slice(0, 80),
    entropyDelta: comparison.averageEntropy - primary.averageEntropy,
  }
}

function pushRange(ranges: DiffRange[], primary: Uint8Array, comparison: Uint8Array, start: number, end: number) {
  const previous = ranges[ranges.length - 1]
  if (previous && start - previous.end <= 8) {
    previous.end = end
    previous.length = end - previous.start
    previous.primaryPreview = bytesToHex(primary.slice(previous.start, Math.min(previous.start + 16, primary.length)))
    previous.comparisonPreview = bytesToHex(comparison.slice(previous.start, Math.min(previous.start + 16, comparison.length)))
    return
  }

  ranges.push({
    start,
    end,
    length: end - start,
    primaryPreview: bytesToHex(primary.slice(start, Math.min(start + 16, primary.length))),
    comparisonPreview: bytesToHex(comparison.slice(start, Math.min(start + 16, comparison.length))),
  })
}
