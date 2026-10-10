import type { ExtractedString, IocKind, IocRecord } from './types'

const urlPattern = /https?:\/\/[^\s"'<>]+/gi
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const ipv4Pattern = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
const hashPattern = /\b[a-f0-9]{32,128}\b/gi
const domainPattern = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|dev|test|local|co|info|biz|ru|cn)\b/gi
const secretPattern = /\b(?:api[_-]?key|token|secret|bearer|password|credential|session)[A-Z0-9_ .:=/-]{0,96}/gi
const pathPattern = /(?:[A-Za-z]:\\[^\s"'<>]+|\/[A-Za-z0-9._~/-]{3,}|\.\.?\/[A-Za-z0-9._~/-]{3,})/g

export function extractIocs(strings: ExtractedString[]) {
  const records = new Map<string, IocRecord>()

  strings.forEach((item) => {
    collectMatches(records, item, 'url', urlPattern, 96, ['network'])
    collectMatches(records, item, 'email', emailPattern, 92, ['identity'])
    collectMatches(records, item, 'ipv4', ipv4Pattern, 88, ['network'])
    collectMatches(records, item, 'hash', hashPattern, 86, ['hash'])
    collectMatches(records, item, 'secret', secretPattern, 82, ['credential'])
    collectMatches(records, item, 'path', pathPattern, 76, ['filesystem'])
    collectMatches(records, item, 'domain', domainPattern, 72, ['network'])
  })

  return Array.from(records.values())
    .filter((record) => !isDomainCoveredByUrlOrEmail(record, records))
    .sort((left, right) => right.confidence - left.confidence || left.offset - right.offset)
    .slice(0, 500)
}

export function iocsToCsv(iocs: IocRecord[]) {
  const header = ['kind', 'value', 'offset', 'confidence', 'tags', 'source']
  const rows = iocs.map((ioc) => [
    ioc.kind,
    ioc.value,
    `0x${ioc.offset.toString(16).toUpperCase()}`,
    String(ioc.confidence),
    ioc.tags.join('|'),
    ioc.source,
  ])
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

function collectMatches(
  records: Map<string, IocRecord>,
  item: ExtractedString,
  kind: IocKind,
  pattern: RegExp,
  confidence: number,
  tags: string[],
) {
  pattern.lastIndex = 0
  for (const match of item.value.matchAll(pattern)) {
    const rawValue = match[0]?.trim()
    if (!rawValue) continue
    const value = trimPunctuation(rawValue)
    if (!value || shouldSkip(kind, value)) continue
    const offset = item.offset + (match.index ?? 0)
    const key = `${kind}:${value.toLowerCase()}`
    if (records.has(key)) continue
    records.set(key, {
      id: `${kind}-${offset}-${value.length}`,
      kind,
      value,
      offset,
      source: item.encoding,
      confidence,
      tags: [...new Set([...tags, ...item.tags])],
    })
  }
}

function shouldSkip(kind: IocKind, value: string) {
  if (kind === 'ipv4') {
    return value === '0.0.0.0' || value === '255.255.255.255'
  }
  if (kind === 'domain') {
    return value.includes('..') || value.startsWith('.') || value.endsWith('.')
  }
  if (kind === 'path') {
    return value.length < 5 || value.startsWith('//')
  }
  return false
}

function isDomainCoveredByUrlOrEmail(record: IocRecord, records: Map<string, IocRecord>) {
  if (record.kind !== 'domain') return false
  return Array.from(records.values()).some((item) => {
    if (item.kind !== 'url' && item.kind !== 'email') return false
    return item.value.toLowerCase().includes(record.value.toLowerCase())
  })
}

function trimPunctuation(value: string) {
  return value.replace(/[),.;\]}]+$/g, '').replace(/^[([{]+/g, '')
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}
