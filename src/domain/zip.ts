import { unzipSync } from 'fflate'
import type { ZipAnalysis, ZipEntry } from './types'

const riskyExtensions = new Set(['exe', 'dll', 'scr', 'ps1', 'bat', 'cmd', 'vbs', 'js', 'wasm', 'sqlite', 'db'])

export function inspectZip(bytes: Uint8Array): ZipAnalysis | undefined {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return undefined

  try {
    const files = unzipSync(bytes)
    const entries: ZipEntry[] = Object.entries(files)
      .map(([name, fileBytes]) => {
        const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() ?? '' : ''
        return {
          name,
          size: fileBytes.byteLength,
          extension,
          suspicious: riskyExtensions.has(extension) || name.includes('..') || name.startsWith('/'),
        }
      })
      .sort((left, right) => right.size - left.size)

    return {
      entryCount: entries.length,
      totalUncompressedSize: entries.reduce((sum, entry) => sum + entry.size, 0),
      entries,
    }
  } catch (error) {
    return {
      entryCount: 0,
      totalUncompressedSize: 0,
      entries: [],
      error: error instanceof Error ? error.message : 'Could not inspect ZIP archive',
    }
  }
}
