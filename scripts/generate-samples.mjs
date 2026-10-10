import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { strToU8, zipSync } from 'fflate'

const publicDir = join(process.cwd(), 'public')
mkdirSync(publicDir, { recursive: true })

const wasmBytes = buildSampleWasm()
const payloadBytes = buildPayload(wasmBytes)
const zipBytes = zipSync({
  'README-investigation.txt': strToU8(
    [
      'Incident package: staged binary sample.',
      'Contact: incident-response@example.com',
      'Callback: https://control.example.test/upload',
      'API_TOKEN=lab_sample_token_9f32a18fbf4e40c2',
      '',
    ].join('\n'),
  ),
  'config/agent.json': strToU8(
    JSON.stringify(
      {
        endpoint: 'https://control.example.test/collect',
        token: 'zip_container_secret_token_44f0a9',
        retry: 3,
        wasmModule: 'modules/sample-module.wasm',
      },
      null,
      2,
    ),
  ),
  'logs/access.log': strToU8(
    [
      '2026-06-20T10:14:44Z GET /health 200',
      '2026-06-20T10:15:02Z POST /collect bearer=sample_redacted_bearer_token',
      '2026-06-20T10:16:11Z GET /modules/sample-module.wasm 200',
    ].join('\n'),
  ),
  'modules/sample-module.wasm': wasmBytes,
})

writeFileSync(join(publicDir, 'sample-module.wasm'), wasmBytes)
writeFileSync(join(publicDir, 'sample-payload.bin'), payloadBytes)
writeFileSync(join(publicDir, 'sample-incident.zip'), zipBytes)

console.log('Generated binary forensic sample files.')

function buildPayload(wasmBytes) {
  const header = Buffer.from('MZ')
  const stub = Buffer.from([
    0x90, 0x00, 0x03, 0x00, 0x04, 0x00, 0xff, 0xff, 0x00, 0xb8, 0x00, 0x00,
    0x00, 0x00, 0xba, 0x00, 0x00, 0x00, 0x00,
  ])
  const notes = Buffer.from(
    [
      'This program cannot be run in DOS mode.',
      'operator=liam.kovac@example.com',
      'callback=https://control.example.test/beacon',
      'api_key=sample_payload_secret_72c41c90f0a9424d',
      'path=/tmp/.cache/agent/module.wasm',
      '',
    ].join('\n'),
  )
  const entropy = Buffer.from(Array.from({ length: 1024 }, (_, index) => (index * 73 + 41 + (index % 17) * 11) & 0xff))
  const padding = Buffer.alloc(96, 0)
  return Buffer.concat([header, stub, notes, entropy, Buffer.from('EMBEDDED_WASM_START'), wasmBytes, padding])
}

function buildSampleWasm() {
  const bytes = [
    0x00, 0x61, 0x73, 0x6d,
    0x01, 0x00, 0x00, 0x00,
    ...section(0, [...name('audit'), ...name('generated sample module')]),
    ...section(1, [
      0x01,
      0x60,
      0x02, 0x7f, 0x7f,
      0x01, 0x7f,
    ]),
    ...section(3, [0x01, 0x00]),
    ...section(5, [0x01, 0x00, 0x01]),
    ...section(7, [
      0x02,
      ...name('memory'), 0x02, 0x00,
      ...name('add'), 0x00, 0x00,
    ]),
    ...section(10, [
      0x01,
      0x07,
      0x00,
      0x20, 0x00,
      0x20, 0x01,
      0x6a,
      0x0b,
    ]),
  ]
  return Uint8Array.from(bytes)
}

function section(id, payload) {
  return [id, ...u32(payload.length), ...payload]
}

function name(value) {
  const encoded = Array.from(Buffer.from(value, 'utf8'))
  return [...u32(encoded.length), ...encoded]
}

function u32(value) {
  const out = []
  let current = value >>> 0
  do {
    let byte = current & 0x7f
    current >>>= 7
    if (current) byte |= 0x80
    out.push(byte)
  } while (current)
  return out
}
