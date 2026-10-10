import type { ComponentChildren } from 'preact'

export type IconComponent = (props: { class?: string; size?: number; strokeWidth?: number }) => ComponentChildren

export type ViewMode = 'overview' | 'hex' | 'strings' | 'iocs' | 'wasm' | 'diff' | 'report'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type BinarySignature = {
  id: string
  label: string
  mime: string
  extension: string
  offset: number
  confidence: number
  description: string
}

export type EntropyBlock = {
  index: number
  offset: number
  size: number
  entropy: number
  level: 'low' | 'medium' | 'high'
}

export type ExtractedString = {
  id: string
  offset: number
  value: string
  encoding: 'ascii' | 'utf16le'
  length: number
  tags: string[]
}

export type ForensicFinding = {
  id: string
  severity: Severity
  title: string
  detail: string
  evidence: string
  offset?: number
}

export type WasmSection = {
  id: number
  name: string
  offset: number
  payloadOffset: number
  size: number
}

export type WasmImportExport = {
  module?: string
  name: string
  kind: string
}

export type WasmAnalysis = {
  validMagic: boolean
  compileStatus: 'valid' | 'invalid' | 'not-wasm'
  compileError?: string
  version?: number
  sections: WasmSection[]
  imports: WasmImportExport[]
  exports: WasmImportExport[]
  customSections: string[]
}

export type ZipEntry = {
  name: string
  size: number
  extension: string
  suspicious: boolean
}

export type ZipAnalysis = {
  entryCount: number
  totalUncompressedSize: number
  entries: ZipEntry[]
  error?: string
}

export type ByteHistogramEntry = {
  byte: number
  count: number
  percentage: number
}

export type IocKind = 'url' | 'domain' | 'email' | 'ipv4' | 'hash' | 'secret' | 'path'

export type IocRecord = {
  id: string
  kind: IocKind
  value: string
  offset: number
  source: string
  confidence: number
  tags: string[]
}

export type RiskSummary = {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  drivers: string[]
}

export type FileAnalysis = {
  id: string
  name: string
  size: number
  sha1: string
  bytes: Uint8Array
  sha256: string
  sha512: string
  analyzedAt: string
  signatures: BinarySignature[]
  embeddedSignatures: BinarySignature[]
  entropyBlocks: EntropyBlock[]
  averageEntropy: number
  highEntropyRatio: number
  printableRatio: number
  zeroRatio: number
  histogram: ByteHistogramEntry[]
  strings: ExtractedString[]
  iocs: IocRecord[]
  findings: ForensicFinding[]
  risk: RiskSummary
  wasm: WasmAnalysis
  zip?: ZipAnalysis
}

export type DiffRange = {
  start: number
  end: number
  length: number
  primaryPreview: string
  comparisonPreview: string
}

export type BinaryDiff = {
  primaryName: string
  comparisonName: string
  primarySize: number
  comparisonSize: number
  sizeDelta: number
  comparedBytes: number
  differentBytes: number
  similarity: number
  ranges: DiffRange[]
  entropyDelta: number
}
