import type { BinarySignature } from './types'

type SignatureDefinition = {
  id: string
  label: string
  mime: string
  extension: string
  pattern: number[]
  offset?: number
  description: string
}

const definitions: SignatureDefinition[] = [
  {
    id: 'wasm',
    label: 'WebAssembly module',
    mime: 'application/wasm',
    extension: 'wasm',
    pattern: [0x00, 0x61, 0x73, 0x6d],
    description: 'WASM binary magic header.',
  },
  {
    id: 'zip',
    label: 'ZIP archive',
    mime: 'application/zip',
    extension: 'zip',
    pattern: [0x50, 0x4b, 0x03, 0x04],
    description: 'Local file header for ZIP-compatible archives.',
  },
  {
    id: 'sqlite',
    label: 'SQLite database',
    mime: 'application/vnd.sqlite3',
    extension: 'sqlite',
    pattern: Array.from(new TextEncoder().encode('SQLite format 3')),
    description: 'SQLite database header.',
  },
  {
    id: 'png',
    label: 'PNG image',
    mime: 'image/png',
    extension: 'png',
    pattern: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    description: 'PNG image signature.',
  },
  {
    id: 'pdf',
    label: 'PDF document',
    mime: 'application/pdf',
    extension: 'pdf',
    pattern: [0x25, 0x50, 0x44, 0x46],
    description: 'PDF document header.',
  },
  {
    id: 'elf',
    label: 'ELF executable',
    mime: 'application/x-elf',
    extension: 'elf',
    pattern: [0x7f, 0x45, 0x4c, 0x46],
    description: 'Linux/Unix ELF executable header.',
  },
  {
    id: 'pe',
    label: 'DOS/PE executable',
    mime: 'application/vnd.microsoft.portable-executable',
    extension: 'exe',
    pattern: [0x4d, 0x5a],
    description: 'DOS MZ header commonly used by PE executables.',
  },
  {
    id: 'gzip',
    label: 'Gzip stream',
    mime: 'application/gzip',
    extension: 'gz',
    pattern: [0x1f, 0x8b, 0x08],
    description: 'Gzip compressed stream.',
  },
  {
    id: 'rar',
    label: 'RAR archive',
    mime: 'application/vnd.rar',
    extension: 'rar',
    pattern: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07],
    description: 'RAR archive header.',
  },
  {
    id: '7z',
    label: '7-Zip archive',
    mime: 'application/x-7z-compressed',
    extension: '7z',
    pattern: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c],
    description: '7-Zip archive header.',
  },
]

export function detectSignatures(bytes: Uint8Array) {
  return definitions
    .map((definition) => matchAt(bytes, definition, definition.offset ?? 0))
    .filter((signature): signature is BinarySignature => Boolean(signature))
}

export function detectEmbeddedSignatures(bytes: Uint8Array, limit = 256 * 1024, maxMatchesPerDefinition = 8) {
  const matches: BinarySignature[] = []
  const max = Math.min(bytes.length, limit)

  for (const definition of definitions) {
    let found = 0
    for (let offset = 1; offset <= max - definition.pattern.length; offset += 1) {
      const signature = matchAt(bytes, definition, offset)
      if (signature) {
        matches.push({ ...signature, confidence: Math.max(45, signature.confidence - 20) })
        found += 1
        offset += definition.pattern.length - 1
        if (found >= maxMatchesPerDefinition) break
      }
    }
  }

  return matches.sort((left, right) => left.offset - right.offset)
}

function matchAt(bytes: Uint8Array, definition: SignatureDefinition, offset: number) {
  if (offset + definition.pattern.length > bytes.length) return null
  for (let index = 0; index < definition.pattern.length; index += 1) {
    if (bytes[offset + index] !== definition.pattern[index]) return null
  }

  return {
    id: definition.id,
    label: definition.label,
    mime: definition.mime,
    extension: definition.extension,
    offset,
    confidence: offset === 0 ? 96 : 72,
    description: definition.description,
  }
}
