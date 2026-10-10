import { detectEmbeddedSignatures, detectSignatures } from './signatures'
import { extractIocs } from './ioc'
import { extractStrings } from './strings'
import { inspectWasm } from './wasm'
import { inspectZip } from './zip'
import type { ByteHistogramEntry, EntropyBlock, FileAnalysis, ForensicFinding, RiskSummary } from './types'

export async function analyzeBytes(bytes: Uint8Array, name: string): Promise<FileAnalysis> {
  const signatures = detectSignatures(bytes)
  const embeddedSignatures = detectEmbeddedSignatures(bytes)
  const entropyBlocks = calculateEntropyBlocks(bytes)
  const histogram = buildHistogram(bytes)
  const strings = extractStrings(bytes)
  const iocs = extractIocs(strings)
  const wasm = inspectWasm(bytes)
  const zip = inspectZip(bytes)
  const averageEntropy = entropyBlocks.reduce((sum, block) => sum + block.entropy, 0) / Math.max(1, entropyBlocks.length)
  const highEntropyRatio = entropyBlocks.filter((block) => block.level === 'high').length / Math.max(1, entropyBlocks.length)
  const printableRatio = calculatePrintableRatio(bytes)
  const zeroRatio = bytes.reduce((sum, byte) => sum + (byte === 0 ? 1 : 0), 0) / Math.max(1, bytes.length)
  const analysisBase = {
    name,
    size: bytes.byteLength,
    bytes,
    signatures,
    embeddedSignatures,
    entropyBlocks,
    averageEntropy,
    highEntropyRatio,
    printableRatio,
    zeroRatio,
    histogram,
    strings,
    iocs,
    wasm,
    zip,
  }
  const findings = buildFindings(analysisBase)

  return {
    id: `${name}-${bytes.byteLength}-${Date.now()}`,
    sha1: await hash(bytes, 'SHA-1'),
    sha256: await hash(bytes, 'SHA-256'),
    sha512: await hash(bytes, 'SHA-512'),
    analyzedAt: new Date().toISOString(),
    ...analysisBase,
    findings,
    risk: calculateRisk(analysisBase, findings),
  }
}

function calculateEntropyBlocks(bytes: Uint8Array): EntropyBlock[] {
  if (!bytes.length) return []
  const blockSize = Math.max(128, Math.min(4096, Math.ceil(bytes.length / 96)))
  const blocks: EntropyBlock[] = []

  for (let offset = 0; offset < bytes.length; offset += blockSize) {
    const chunk = bytes.slice(offset, Math.min(offset + blockSize, bytes.length))
    const entropy = calculateEntropy(chunk)
    blocks.push({
      index: blocks.length,
      offset,
      size: chunk.length,
      entropy,
      level: entropy >= 7.25 ? 'high' : entropy >= 4.2 ? 'medium' : 'low',
    })
  }

  return blocks
}

function calculateEntropy(bytes: Uint8Array) {
  if (!bytes.length) return 0
  const counts = new Array<number>(256).fill(0)
  bytes.forEach((byte) => {
    counts[byte] += 1
  })

  return counts.reduce((entropy, count) => {
    if (!count) return entropy
    const probability = count / bytes.length
    return entropy - probability * Math.log2(probability)
  }, 0)
}

function buildHistogram(bytes: Uint8Array): ByteHistogramEntry[] {
  const counts = new Array<number>(256).fill(0)
  bytes.forEach((byte) => {
    counts[byte] += 1
  })

  return counts
    .map((count, byte) => ({
      byte,
      count,
      percentage: (count / Math.max(1, bytes.length)) * 100,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 24)
}

function calculatePrintableRatio(bytes: Uint8Array) {
  if (!bytes.length) return 0
  let printable = 0
  bytes.forEach((byte) => {
    if ((byte >= 0x20 && byte <= 0x7e) || byte === 0x0a || byte === 0x0d || byte === 0x09) printable += 1
  })
  return printable / bytes.length
}

function buildFindings(
  analysis: Omit<FileAnalysis, 'id' | 'sha1' | 'sha256' | 'sha512' | 'analyzedAt' | 'findings' | 'risk'>,
): ForensicFinding[] {
  const findings: ForensicFinding[] = []

  if (!analysis.signatures.length) {
    findings.push({
      id: 'unknown-format',
      severity: 'medium',
      title: 'Unknown primary signature',
      detail: 'No known magic bytes were detected at file offset 0.',
      evidence: analysis.name,
    })
  }

  if (analysis.highEntropyRatio > 0.25) {
    findings.push({
      id: 'high-entropy',
      severity: analysis.highEntropyRatio > 0.6 ? 'high' : 'medium',
      title: 'High entropy regions',
      detail: 'Large portions of the file look compressed, encrypted, or packed.',
      evidence: `${Math.round(analysis.highEntropyRatio * 100)}% of entropy blocks`,
    })
  }

  analysis.embeddedSignatures.forEach((signature) => {
    findings.push({
      id: `embedded-${signature.id}-${signature.offset}`,
      severity: 'medium',
      title: `Embedded ${signature.label}`,
      detail: 'A known file signature appears away from offset 0.',
      evidence: `${signature.label} at 0x${signature.offset.toString(16).toUpperCase()}`,
      offset: signature.offset,
    })
  })

  analysis.strings
    .filter((item) => item.tags.includes('secret') || item.tags.includes('url') || item.tags.includes('email'))
    .slice(0, 18)
    .forEach((item) => {
      findings.push({
        id: `string-${item.offset}`,
        severity: item.tags.includes('secret') ? 'high' : 'low',
        title: item.tags.includes('secret') ? 'Sensitive-looking string' : 'Network or identity string',
        detail: item.value.slice(0, 120),
        evidence: `${item.encoding} string at 0x${item.offset.toString(16).toUpperCase()}`,
        offset: item.offset,
      })
    })

  const secretIocs = analysis.iocs.filter((ioc) => ioc.kind === 'secret')
  const networkIocs = analysis.iocs.filter((ioc) => ioc.kind === 'url' || ioc.kind === 'domain' || ioc.kind === 'ipv4')
  if (secretIocs.length) {
    findings.push({
      id: 'ioc-secrets',
      severity: 'high',
      title: 'Credential-like IOCs',
      detail: `${secretIocs.length} token, secret, bearer, or credential-like indicators were extracted.`,
      evidence: secretIocs.slice(0, 4).map((ioc) => ioc.value).join(', '),
    })
  }
  if (networkIocs.length >= 2) {
    findings.push({
      id: 'ioc-network',
      severity: 'medium',
      title: 'Network indicators',
      detail: `${networkIocs.length} URL, domain, or IPv4 indicators were extracted from strings.`,
      evidence: networkIocs.slice(0, 4).map((ioc) => ioc.value).join(', '),
    })
  }

  if (analysis.wasm.compileStatus === 'valid') {
    findings.push({
      id: 'wasm-valid',
      severity: analysis.wasm.imports.length ? 'info' : 'low',
      title: 'Valid WebAssembly module',
      detail: `${analysis.wasm.sections.length} sections, ${analysis.wasm.imports.length} imports, ${analysis.wasm.exports.length} exports.`,
      evidence: analysis.wasm.exports.map((item) => item.name).join(', ') || 'No exports',
    })
  } else if (analysis.wasm.validMagic && analysis.wasm.compileStatus === 'invalid') {
    findings.push({
      id: 'wasm-invalid',
      severity: 'high',
      title: 'Invalid WebAssembly payload',
      detail: analysis.wasm.compileError ?? 'The file has a WASM header but cannot be compiled.',
      evidence: 'WebAssembly.Module rejected the payload',
    })
  }

  if (analysis.zip) {
    const riskyEntries = analysis.zip.entries.filter((entry) => entry.suspicious)
    findings.push({
      id: 'zip-container',
      severity: riskyEntries.length ? 'medium' : 'info',
      title: 'ZIP container inspected',
      detail: `${analysis.zip.entryCount} entries, ${riskyEntries.length} entries with risky names or extensions.`,
      evidence: riskyEntries.map((entry) => entry.name).join(', ') || 'No risky entries',
    })
  }

  return findings.sort((left, right) => severityRank(right.severity) - severityRank(left.severity))
}

function calculateRisk(
  analysis: Omit<FileAnalysis, 'id' | 'sha1' | 'sha256' | 'sha512' | 'analyzedAt' | 'findings' | 'risk'>,
  findings: ForensicFinding[],
): RiskSummary {
  const drivers: string[] = []
  let score = findings.reduce((sum, finding) => sum + severityScore(finding.severity), 0)

  if (analysis.highEntropyRatio > 0.25) {
    score += Math.round(analysis.highEntropyRatio * 24)
    drivers.push('high entropy concentration')
  }
  if (analysis.embeddedSignatures.length) {
    score += Math.min(18, analysis.embeddedSignatures.length * 6)
    drivers.push('embedded file signatures')
  }
  if (analysis.iocs.some((ioc) => ioc.kind === 'secret')) {
    score += 14
    drivers.push('credential-like indicators')
  }
  if (analysis.zip?.entries.some((entry) => entry.suspicious)) {
    score += 8
    drivers.push('risky archive entries')
  }
  if (analysis.wasm.validMagic && analysis.wasm.compileStatus === 'invalid') {
    score += 18
    drivers.push('invalid WASM payload')
  }
  if (!drivers.length) drivers.push('low observable risk signals')

  const normalized = Math.min(100, score)
  return {
    score: normalized,
    level: normalized >= 75 ? 'critical' : normalized >= 50 ? 'high' : normalized >= 25 ? 'medium' : 'low',
    drivers: drivers.slice(0, 5),
  }
}

async function hash(bytes: Uint8Array, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512') {
  const digest = await crypto.subtle.digest(algorithm, toArrayBuffer(bytes))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function severityRank(severity: ForensicFinding['severity']) {
  if (severity === 'critical') return 5
  if (severity === 'high') return 4
  if (severity === 'medium') return 3
  if (severity === 'low') return 2
  return 1
}

function severityScore(severity: ForensicFinding['severity']) {
  if (severity === 'critical') return 24
  if (severity === 'high') return 14
  if (severity === 'medium') return 8
  if (severity === 'low') return 3
  return 1
}
