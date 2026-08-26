# Sample books via import.meta.glob Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover sample books with `import.meta.glob` from `src/books/` so adding a book is drop-a-file only (no `books.json`).

**Architecture:** Pure `samplesFromGlob(record)` maps Vite glob `{ path: url }` → `BookMeta[]`. Production wires `import.meta.glob(..., { eager, query: '?url', import: 'default' })`. `loadCatalog` merges those samples with IndexedDB locals. Sample `filePath` is the Vite URL; `loadBlob` fetches it as-is.

**Tech Stack:** Vite `import.meta.glob`, existing `detectFormat`, Vitest, React shelf unchanged.

**Spec:** `docs/superpowers/specs/2026-08-26-sample-books-glob-design.md`

## Global Constraints

- Sample files live only under `src/books/` (pdf | txt | epub)
- Delete `public/books.json` and `public/books/`
- Title = basename without extension; no sidecar title overrides
- `id` = path under `src/books/` with extension stripped and `/` → `--`
- No new dependencies
- Angular commit subjects if committing: `feat(books): …` / `test(books): …` / `docs(…): …`
- Do not commit unless the user explicitly asks (user rule overrides plan commit steps)

## File structure

| File | Responsibility |
| ---- | -------------- |
| `src/books/*` | Sample binary/text assets |
| `src/lib/books/samples.ts` | Glob + `samplesFromGlob` → `BookMeta[]` |
| `src/lib/books/catalog.ts` | `loadCatalog` / `filterByTitle` (no `books.json` fetch) |
| `src/lib/readers/openSession.ts` | Fetch sample URL as-is |
| `src/test/samples.test.ts` | Unit tests for `samplesFromGlob` |
| `src/test/catalog.test.ts` | Merge samples + local without fetch mock |
| `src/test/openSession.test.ts` | Sample fetch uses raw `filePath` |
| `README.md` | Document `src/books/` drop-in flow |
| delete `public/books.json`, `public/books/` | Remove old catalog |

---

### Task 1: `samplesFromGlob` (TDD)

**Files:**
- Create: `src/lib/books/samples.ts`
- Create: `src/test/samples.test.ts`

**Interfaces:**
- Consumes: `detectFormat(filename)`, `BookMeta`
- Produces:
  - `samplesFromGlob(modules: Record<string, string>): BookMeta[]`
  - `listSampleBooks(): BookMeta[]` (calls glob + `samplesFromGlob`)

- [ ] **Step 1: Write the failing test**

Create `src/test/samples.test.ts`:

```ts
import { it, expect, vi } from 'vitest'
import { samplesFromGlob } from '../lib/books/samples'

it('maps glob paths to BookMeta', () => {
  const books = samplesFromGlob({
    '/src/books/sample.txt': '/hi-reader/assets/sample-abc.txt',
    '/src/books/nested/a.pdf': '/hi-reader/assets/a-def.pdf',
  })
  expect(books).toEqual([
    {
      id: 'sample',
      title: 'sample',
      format: 'txt',
      source: 'sample',
      filePath: '/hi-reader/assets/sample-abc.txt',
    },
    {
      id: 'nested--a',
      title: 'a',
      format: 'pdf',
      source: 'sample',
      filePath: '/hi-reader/assets/a-def.pdf',
    },
  ])
})

it('uses basename without ext as title including CJK and spaces', () => {
  const name = '无人生还 (（英）阿加莎·克里斯蒂著；夏阳译) '
  const books = samplesFromGlob({
    `/src/books/${name}.epub`: '/u.epub',
  })
  expect(books[0]).toMatchObject({
    id: name,
    title: name,
    format: 'epub',
  })
})

it('skips and warns when detectFormat fails', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  expect(
    samplesFromGlob({ '/src/books/x.docx': '/x.docx' }),
  ).toEqual([])
  expect(warn).toHaveBeenCalled()
  warn.mockRestore()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/test/samples.test.ts`

Expected: FAIL (module not found or `samplesFromGlob` undefined)

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/books/samples.ts`:

```ts
import type { BookMeta } from '../../types/book'
import { detectFormat } from './detectFormat'

/** Paths like `.../books/nested/a.pdf` → relative `nested/a.pdf` under books root. */
function relUnderBooks(globKey: string): string {
  const norm = globKey.replace(/\\/g, '/')
  const marker = '/books/'
  const i = norm.lastIndexOf(marker)
  return i >= 0 ? norm.slice(i + marker.length) : norm.split('/').pop()!
}

export function samplesFromGlob(
  modules: Record<string, string>,
): BookMeta[] {
  const out: BookMeta[] = []
  for (const [key, url] of Object.entries(modules)) {
    const rel = relUnderBooks(key)
    const base = rel.split('/').pop()!
    const format = detectFormat(base)
    if (!format) {
      console.warn('skipping sample with unknown format', key)
      continue
    }
    const withoutExt = rel.replace(/\.[^.]+$/, '')
    const id = withoutExt.split('/').join('--')
    const title = base.replace(/\.[^.]+$/, '')
    out.push({
      id,
      title,
      format,
      source: 'sample',
      filePath: url,
    })
  }
  return out
}

const globModules = import.meta.glob('../../books/**/*.{pdf,txt,epub}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function listSampleBooks(): BookMeta[] {
  return samplesFromGlob(globModules)
}
```

Note: until `src/books/` has matching files, glob may be `{}` — that is OK for unit tests of `samplesFromGlob`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/test/samples.test.ts`

Expected: PASS (3 tests)

- [ ] **Step 5: Commit** (only if user asked)

```bash
git add src/lib/books/samples.ts src/test/samples.test.ts
git commit -m "$(cat <<'EOF'
feat(books): add samplesFromGlob for vite book discovery

EOF
)"
```

---

### Task 2: Wire `loadCatalog` + move assets

**Files:**
- Modify: `src/lib/books/catalog.ts`
- Modify: `src/test/catalog.test.ts`
- Move: `public/books/*` → `src/books/`
- Delete: `public/books.json`
- Modify: `src/lib/readers/openSession.ts`
- Modify: `src/test/openSession.test.ts`
- Modify: `README.md` (sample books section)
- Optional touch: `docs/superpowers/specs/2026-08-26-sample-books-glob-design.md` status → approved

**Interfaces:**
- Consumes: `listSampleBooks()` from Task 1
- Produces: `loadCatalog()` without `books.json` fetch; sample open via raw URL

- [ ] **Step 1: Update catalog tests (fail against old fetch-based catalog)**

Replace `src/test/catalog.test.ts` with:

```ts
import 'fake-indexeddb/auto'
import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadCatalog, filterByTitle } from '../lib/books/catalog'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'

vi.mock('../lib/books/samples', () => ({
  listSampleBooks: () =>
    [
      {
        id: 'sample-txt',
        title: '示例 TXT',
        format: 'txt',
        source: 'sample',
        filePath: '/mock/sample.txt',
      },
      {
        id: 'sample-pdf',
        title: '示例 PDF',
        format: 'pdf',
        source: 'sample',
        filePath: '/mock/sample.pdf',
      },
    ] satisfies BookMeta[],
}))

beforeEach(async () => {
  await clearAllBooksForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('filterByTitle matches case-insensitively', () => {
  const books: BookMeta[] = [
    { id: '1', title: 'Hello World', format: 'txt', source: 'local' },
    { id: '2', title: '示例 PDF', format: 'pdf', source: 'sample' },
  ]
  expect(filterByTitle(books, 'pdf')).toHaveLength(1)
  expect(filterByTitle(books, 'hello')).toHaveLength(1)
  expect(filterByTitle(books, '  ')).toHaveLength(2)
})

it('loadCatalog merges samples then local', async () => {
  const file = new File(['x'], 'mine.txt', { type: 'text/plain' })
  await booksStore.addLocal(file, 'My Book')
  const catalog = await loadCatalog()
  expect(catalog).toHaveLength(3)
  expect(catalog[0]).toMatchObject({ id: 'sample-txt', source: 'sample' })
  expect(catalog[1]).toMatchObject({ id: 'sample-pdf', source: 'sample' })
  expect(catalog[2]).toMatchObject({ title: 'My Book', source: 'local' })
})

it('loadCatalog still returns samples when no local books', async () => {
  const catalog = await loadCatalog()
  expect(catalog.map((b) => b.id)).toEqual(['sample-txt', 'sample-pdf'])
})

it('skips broken local cards and warns', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  // force a bad local by mocking listLocal
  vi.spyOn(booksStore, 'listLocal').mockResolvedValueOnce([
    {
      id: 'ok',
      title: 'Good',
      format: 'txt',
      source: 'local',
    },
    { id: 'empty-title', title: '', format: 'txt', source: 'local' },
    {
      id: 'bad-fmt',
      title: 'Doc',
      format: 'docx' as BookMeta['format'],
      source: 'local',
    },
  ] as BookMeta[])
  const catalog = await loadCatalog()
  expect(catalog.map((b) => b.id)).toEqual(['sample-txt', 'sample-pdf', 'ok'])
  expect(warn).toHaveBeenCalled()
  warn.mockRestore()
})
```

- [ ] **Step 2: Run catalog tests — expect failure**

Run: `pnpm exec vitest run src/test/catalog.test.ts`

Expected: FAIL (still fetches `books.json` / mock mismatch)

- [ ] **Step 3: Implement catalog + move files + openSession**

`src/lib/books/catalog.ts`:

```ts
import type { BookFormat, BookMeta } from '../../types/book'
import { booksStore } from './store'
import { listSampleBooks } from './samples'

const FORMATS = new Set<BookFormat>(['pdf', 'txt', 'epub'])

function isUsableBook(book: unknown): book is BookMeta {
  if (!book || typeof book !== 'object') {
    console.warn('skipping broken catalog entry', book)
    return false
  }
  const b = book as BookMeta
  if (!b.id || !b.title || !FORMATS.has(b.format)) {
    console.warn('skipping broken catalog entry', book)
    return false
  }
  if (b.source === 'sample' && !b.filePath) {
    console.warn('skipping sample without filePath', book)
    return false
  }
  return true
}

export async function loadCatalog(): Promise<BookMeta[]> {
  const samples = listSampleBooks().filter(isUsableBook)
  const local = (await booksStore.listLocal()).filter(isUsableBook)
  return [...samples, ...local]
}

export function filterByTitle(books: BookMeta[], q: string): BookMeta[] {
  const s = q.trim().toLowerCase()
  if (!s) return books
  return books.filter((b) => b.title.toLowerCase().includes(s))
}
```

Shell moves (preserve binary epubs):

```bash
mkdir -p src/books
mv public/books/* src/books/
rmdir public/books
rm -f public/books.json
```

`openSession.ts` — fetch sample URL directly:

```ts
export async function loadBlob(meta: BookMeta): Promise<Blob> {
  if (meta.source === 'sample') {
    if (!meta.filePath) throw new Error('Sample book missing filePath')
    const res = await fetch(meta.filePath)
    if (!res.ok) throw new Error(`Failed to fetch sample: ${res.status}`)
    return res.blob()
  }
  const blob = await booksStore.getBlob(meta.id)
  if (!blob) throw new Error(`Book not found: ${meta.id}`)
  return blob
}
```

Remove unused `sampleUrl` helper.

Update `src/test/openSession.test.ts`:

- Sample mocks should match on the exact `filePath` string passed to `openSession` (e.g. `'/hi-reader/books/sample.txt'` or whatever the test sets), not `BASE_URL + path`.
- Remove or rewrite the test `percent-encodes spaces and CJK in sample filePath` — encoding is no longer openSession’s job (Vite URL already usable). Replace with:

```ts
it('fetches sample filePath as-is', async () => {
  const url = '/hi-reader/assets/%E4%B9%A6.epub'
  const fetchMock = vi.fn(async (u: string) => {
    if (u === url) {
      return { ok: true, blob: async () => new Blob(['epub-bytes']) }
    }
    return { ok: false, status: 404, blob: async () => new Blob([]) }
  })
  vi.stubGlobal('fetch', fetchMock)
  const session = await openSession({
    ...sampleTxt,
    id: 'wuren',
    title: '书',
    format: 'epub',
    filePath: url,
  })
  expect(fetchMock).toHaveBeenCalledWith(url)
  session.destroy()
})
```

README: replace `public/books/` / `books.json` wording with:

```md
Bundled samples: drop `.pdf` / `.txt` / `.epub` files into `src/books/`.
They are discovered at build time via `import.meta.glob` (no manifest).
```

Mark design spec status: `approved`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm exec vitest run src/test/samples.test.ts src/test/catalog.test.ts src/test/openSession.test.ts src/test/ReaderPage.test.ts
```

Expected: PASS

Fix `ReaderPage.test.ts` if it still stubs `books.json` fetch — switch to `vi.mock('../lib/books/samples', …)` or keep catalog mock at page level as already done; only change if tests fail.

- [ ] **Step 5: Full test suite**

Run: `pnpm exec vitest run`

Expected: all PASS

- [ ] **Step 6: Manual check**

Run: `pnpm dev` → shelf shows sample txt/pdf/epub + 无人生还; open each.

- [ ] **Step 7: Commit** (only if user asked)

```bash
git add src/books src/lib/books/catalog.ts src/lib/readers/openSession.ts \
  src/test/catalog.test.ts src/test/openSession.test.ts README.md \
  docs/superpowers/specs/2026-08-26-sample-books-glob-design.md
git add -u public/books public/books.json
git commit -m "$(cat <<'EOF'
feat(books): discover samples via import.meta.glob

Drop files in src/books/; remove public books.json catalog.
EOF
)"
```

---

## Spec coverage (self-review)

| Spec item | Task |
| --------- | ---- |
| `src/books/` + glob | 1–2 |
| Delete `books.json` / `public/books` | 2 |
| `samplesFromGlob` + title/id rules | 1 |
| `loadCatalog` merge | 2 |
| Fetch Vite URL as-is | 2 |
| README | 2 |
| Tests | 1–2 |
| Success: drop file appears | Task 2 manual + glob |

No placeholders left. Types: `samplesFromGlob(Record<string,string>): BookMeta[]`, `listSampleBooks(): BookMeta[]` consistent across tasks.
