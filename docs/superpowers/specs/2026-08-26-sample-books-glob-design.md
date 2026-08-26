# Sample books via import.meta.glob

Date: 2026-08-26  
Status: approved

## Goal

Adding a sample book = drop a `.pdf` / `.txt` / `.epub` into one directory. No `books.json` edit.

## Non-goals

- Custom titles / cover overrides via sidecar manifest
- Scanning `public/` (Vite glob cannot see it)
- Runtime filesystem listing in the browser

## Chosen approach

**A:** Move samples to `src/books/`, discover with `import.meta.glob`, delete `public/books.json`.

Rejected:

- **B** (repo-root `books/`): messier Vite root / glob paths for little gain
- **C** (glob + keep `books.json` overrides): reintroduces a manual catalog
- Stay in `public/` + Vite plugin: works, but more moving parts than glob

## Design

### Layout

```
src/books/          # sample files only (pdf | txt | epub)
public/             # no books.json, no books/
```

### Discovery

Module (e.g. `src/lib/books/samples.ts`) owns:

```ts
import.meta.glob('../../books/**/*.{pdf,txt,epub}', {
  eager: true,
  query: '?url',
  import: 'default',
})
```

Map each entry → `BookMeta`:

| Field | Rule |
| ----- | ---- |
| `source` | `'sample'` |
| `format` | from extension via existing `detectFormat` |
| `title` | basename with extension stripped (no further cleanup) |
| `id` | relative path under `src/books/` with `/` → `--`, **including extension** (so `sample.txt` / `sample.pdf` do not collide) |
| `filePath` | Vite URL string from glob (`?url`) |

Skip unknown extensions (glob already restricts). Warn + skip if `detectFormat` fails.

Pure helper `samplesFromGlob(record)` for unit tests; production calls it with the glob result.

### Catalog

`loadCatalog()`:

1. Build sample list from glob helper (sync)
2. Load local books from IndexedDB
3. Return `[...samples, ...local]` (same order as today)

Remove `fetch(books.json)`. Sample availability no longer depends on network/fetch of a manifest.

### Opening

`openSession` / `loadBlob` for `source === 'sample'`: `fetch(meta.filePath)` as-is (already a Vite-resolved URL, including `BASE_URL` / hashed assets in prod). Drop `BASE_URL` concatenation for samples (or keep a no-op path only if `filePath` is still relative — prefer storing absolute-from-base URLs from glob).

### Migration

- Move `public/books/*` → `src/books/`
- Delete `public/books.json`
- Update README / prior design notes that mention `books.json` only if they are the living docs for this flow (minimal: this spec + README if it documents samples)

### Testing

- Unit-test `samplesFromGlob` with a fake `Record<path, url>`
- Update `catalog.test.ts`: no `books.json` fetch mock; assert merge of glob samples + local
- Keep format / openSession coverage; adjust sample URL expectations if needed

## Success criteria

1. Drop `src/books/foo.epub` → appears on shelf after rebuild/HMR without editing any JSON
2. Existing sample txt/pdf/epub and local uploads still open
3. `无人生还 … .epub` shows with title = filename minus `.epub`
