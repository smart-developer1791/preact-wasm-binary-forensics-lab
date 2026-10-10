import type { ExtractedString } from './types'

const urlPattern = /^https?:\/\//i
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tokenPattern = /(token|secret|api[_-]?key|bearer|session|password|credential)/i
const pathPattern = /^([A-Za-z]:\\|\/|\.\/|\.\.\/)/
const hashPattern = /^[a-f0-9]{32,}$/i

export function extractStrings(bytes: Uint8Array, minLength = 4) {
  const strings = [...extractAscii(bytes, minLength), ...extractUtf16Le(bytes, minLength)]
  return strings
    .filter((item) => item.value.trim().length >= minLength)
    .sort((left, right) => left.offset - right.offset)
    .slice(0, 700)
}

function extractAscii(bytes: Uint8Array, minLength: number) {
  const results: ExtractedString[] = []
  let start = -1
  let text = ''

  for (let index = 0; index <= bytes.length; index += 1) {
    const byte = bytes[index]
    const printable = index < bytes.length && byte >= 0x20 && byte <= 0x7e
    if (printable) {
      if (start === -1) start = index
      text += String.fromCharCode(byte)
      continue
    }

    if (start !== -1 && text.length >= minLength) {
      results.push(toStringRecord(start, text, 'ascii'))
    }
    start = -1
    text = ''
  }

  return results
}

function extractUtf16Le(bytes: Uint8Array, minLength: number) {
  return [...extractUtf16LeAligned(bytes, minLength, 0), ...extractUtf16LeAligned(bytes, minLength, 1)]
}

function extractUtf16LeAligned(bytes: Uint8Array, minLength: number, alignment: 0 | 1) {
  const results: ExtractedString[] = []
  let start = -1
  let text = ''

  for (let index = alignment; index + 1 < bytes.length; index += 2) {
    const char = bytes[index]
    const zero = bytes[index + 1]
    const printable = zero === 0 && char >= 0x20 && char <= 0x7e
    if (printable) {
      if (start === -1) start = index
      text += String.fromCharCode(char)
      continue
    }

    if (start !== -1 && text.length >= minLength) {
      results.push(toStringRecord(start, text, 'utf16le'))
    }
    start = -1
    text = ''
  }

  return results
}

function toStringRecord(offset: number, value: string, encoding: ExtractedString['encoding']) {
  return {
    id: `${encoding}-${offset}-${value.length}`,
    offset,
    value,
    encoding,
    length: value.length,
    tags: classifyString(value),
  }
}

function classifyString(value: string) {
  const tags: string[] = []
  if (urlPattern.test(value)) tags.push('url')
  if (emailPattern.test(value)) tags.push('email')
  if (tokenPattern.test(value)) tags.push('secret')
  if (pathPattern.test(value)) tags.push('path')
  if (hashPattern.test(value)) tags.push('hash')
  if (value.length >= 80) tags.push('long')
  return tags
}
