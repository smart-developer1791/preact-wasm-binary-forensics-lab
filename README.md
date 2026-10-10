<div align="center">

# ✦ Preact WASM Binary Forensics Lab

**A local-first binary forensic workbench with WASM inspection, entropy mapping, strings extraction, ZIP analysis, and byte-level diffing.**

![Preact](https://img.shields.io/badge/Preact-10-673ab8?style=for-the-badge&logo=preact&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=ffffff)
![WebAssembly](https://img.shields.io/badge/WebAssembly-Inspector-654ff0?style=for-the-badge&logo=webassembly&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=ffffff)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

</div>

---

## ✨ Highlights

- **Local Binary Analysis:** Opens arbitrary local files in the browser and keeps bytes inside the client runtime.
- **Magic Signature Detection:** Detects WASM, ZIP, SQLite, PNG, PDF, ELF, PE/MZ, gzip, RAR, and 7-Zip signatures at offset 0 and embedded offsets.
- **Entropy Heatmap:** Splits files into blocks and highlights low, medium, and high entropy regions for packed, compressed, or encrypted data.
- **Strings Explorer:** Extracts ASCII and UTF-16LE strings with fuzzy search and tags for URLs, emails, paths, hashes, long values, and secret-like tokens.
- **IOC Workbench:** Extracts URLs, domains, emails, IPv4 addresses, hashes, secrets, and paths with kind filters plus CSV copy/download.
- **Triage Overview:** Adds a first-screen action board, visual risk dial, severity stack, IOC mix, copyable hash manifest, metric meters, and sticky segmented navigation.
- **Risk Summary:** Calculates a weighted risk score from findings, entropy, embedded signatures, IOC density, archive entries, and WASM validity.
- **Hash Manifest:** Calculates SHA-1, SHA-256, and SHA-512 with Browser Crypto APIs.
- **WASM Inspector:** Parses WebAssembly sections, custom section names, version, and uses `WebAssembly.Module` to validate imports and exports.
- **ZIP Container Inspector:** Uses `fflate` to inspect ZIP entries, uncompressed sizes, risky extensions, traversal-like names, and top archive contents.
- **Hex Workspace:** Provides offset-addressed hex and ASCII views with ASCII search highlighting.
- **Embedded Carving:** Downloads bounded byte slices around embedded signatures for follow-up inspection.
- **Binary Diff:** Compares a primary file against a second file with similarity, size delta, entropy delta, and changed byte ranges.
- **Report Export:** Exports a JSON investigation report with findings, signatures, strings, entropy, WASM metadata, ZIP metadata, diff, and analyst notes.
- **Persistent Notes:** Saves investigation notes locally with IndexedDB via `idb-keyval`.
- **Desktop-First UI:** Built for dense binary workflows while keeping controls and panels stacked safely on smaller screens.

## 🧱 Project Structure

```text
public/
|-- favicon.svg
|-- sample-incident.zip
|-- sample-module.wasm
`-- sample-payload.bin
scripts/
`-- generate-samples.mjs
src/
|-- app.tsx
|-- main.tsx
|-- index.css
|-- components/
|   |-- entropy-map.tsx
|   |-- header.tsx
|   |-- hex-table.tsx
|   |-- metric-strip.tsx
|   |-- ui.tsx
|   `-- workbench-nav.tsx
|-- domain/
|   |-- analyzer.ts
|   |-- constants.ts
|   |-- diff.ts
|   |-- export.ts
|   |-- format.ts
|   |-- ioc.ts
|   |-- signatures.ts
|   |-- strings.ts
|   |-- types.ts
|   |-- wasm.ts
|   `-- zip.ts
`-- views/
    |-- diff-view.tsx
    |-- hex-view.tsx
    |-- iocs-view.tsx
    |-- overview-view.tsx
    |-- report-view.tsx
    |-- strings-view.tsx
    `-- wasm-view.tsx
```

## 🛠️ Tech Stack

- Preact 10 with Vite 8
- TypeScript 6
- Tailwind CSS 4
- Browser WebAssembly APIs
- `fflate`
- `fuse.js`
- `idb-keyval`
- `lucide-preact`
- `date-fns`

## 📦 Included Sample Data

- `public/sample-payload.bin` is a synthetic MZ-style payload with suspicious strings, high-entropy bytes, and an embedded WASM module.
- `public/sample-module.wasm` is a valid generated WebAssembly module with memory and `add` exports.
- `public/sample-incident.zip` is an investigation archive with JSON config, logs, token-like strings, and the sample WASM module.
- Run `npm run samples` to regenerate all sample files.

## 🚀 Local Development

```bash
npm install
npm run samples
npm run dev
```

Open `http://localhost:5173`.

## 🔌 Extension Notes & Nuances

- The WASM screen inspects files that start with a WASM magic header; embedded WASM signatures are still surfaced in Overview findings.
- Entropy is a heuristic signal, not a verdict: compressed archives, encrypted blobs, and packed executables can look similar.
- IOC extraction is designed as triage support and should be reviewed before treating values as confirmed indicators.
- Embedded carving exports a bounded slice around the detected signature rather than claiming perfect file boundary recovery.
- ZIP analysis is intentionally metadata-focused and bounded for browser responsiveness.
- Hex rendering is capped for UI performance; the analyzer still processes the complete loaded file.
- The UI is desktop-first because hex grids, diff ranges, and forensic tables are dense, but upload controls and panels stack on mobile.
- `domain/` owns analysis logic so UI views can evolve without rewriting binary parsing.

## 🧪 Build & Checks

```bash
npm run samples
npm run build
npm run preview
```

## 🌐 Vercel Deployment

The repository includes a Vite-ready `vercel.json` with SPA rewrites.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 📄 License

MIT License. See [LICENSE](./LICENSE).
