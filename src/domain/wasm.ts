import type { WasmAnalysis, WasmSection } from './types'

const sectionNames = new Map<number, string>([
  [0, 'Custom'],
  [1, 'Type'],
  [2, 'Import'],
  [3, 'Function'],
  [4, 'Table'],
  [5, 'Memory'],
  [6, 'Global'],
  [7, 'Export'],
  [8, 'Start'],
  [9, 'Element'],
  [10, 'Code'],
  [11, 'Data'],
  [12, 'Data Count'],
  [13, 'Tag'],
])

export function inspectWasm(bytes: Uint8Array): WasmAnalysis {
  if (!hasWasmMagic(bytes)) {
    return {
      validMagic: false,
      compileStatus: 'not-wasm',
      sections: [],
      imports: [],
      exports: [],
      customSections: [],
    }
  }

  const sections = parseSections(bytes)
  const analysis: WasmAnalysis = {
    validMagic: true,
    compileStatus: 'invalid',
    version: readU32(bytes, 4),
    sections,
    imports: [],
    exports: [],
    customSections: sections.filter((section) => section.id === 0).map(readCustomSectionName(bytes)),
  }

  try {
    const module = new WebAssembly.Module(toArrayBuffer(bytes))
    analysis.compileStatus = 'valid'
    analysis.imports = WebAssembly.Module.imports(module).map((item) => ({
      module: item.module,
      name: item.name,
      kind: item.kind,
    }))
    analysis.exports = WebAssembly.Module.exports(module).map((item) => ({
      name: item.name,
      kind: item.kind,
    }))
  } catch (error) {
    analysis.compileError = error instanceof Error ? error.message : 'WebAssembly compilation failed'
  }

  return analysis
}

function hasWasmMagic(bytes: Uint8Array) {
  return bytes.length >= 8 && bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d
}

function parseSections(bytes: Uint8Array) {
  const sections: WasmSection[] = []
  let offset = 8

  while (offset < bytes.length) {
    const id = bytes[offset]
    offset += 1
    const sizeResult = readVarUint(bytes, offset)
    const size = sizeResult.value
    const payloadOffset = sizeResult.nextOffset
    if (payloadOffset + size > bytes.length) break

    sections.push({
      id,
      name: sectionNames.get(id) ?? `Section ${id}`,
      offset: offset - 1,
      payloadOffset,
      size,
    })
    offset = payloadOffset + size
  }

  return sections
}

function readCustomSectionName(bytes: Uint8Array) {
  return (section: WasmSection) => {
    try {
      const lengthResult = readVarUint(bytes, section.payloadOffset)
      const nameBytes = bytes.slice(lengthResult.nextOffset, lengthResult.nextOffset + lengthResult.value)
      return new TextDecoder().decode(nameBytes) || 'custom'
    } catch {
      return 'custom'
    }
  }
}

function readVarUint(bytes: Uint8Array, start: number) {
  let value = 0
  let shift = 0
  let offset = start

  while (offset < bytes.length) {
    const byte = bytes[offset]
    value |= (byte & 0x7f) << shift
    offset += 1
    if ((byte & 0x80) === 0) break
    shift += 7
  }

  return { value, nextOffset: offset }
}

function readU32(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}
