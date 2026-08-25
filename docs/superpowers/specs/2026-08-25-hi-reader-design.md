# hi-reader Design Spec

Date: 2026-08-25  
Status: approved (pending user review of written spec)

## Goal

Ship a static web bookshelf + reader (hi-reader) for GitHub Pages:

- Bookshelf layout inspired by WeChat Reading (cover grid, search, add book)
- Reader inspired by dark two-column reader UI with a right vertical toolbar
- Formats: PDF, TXT, EPUB
- Book sources: bundled sample books + user local uploads
- Annotations: full text highlights + notes for TXT/EPUB; page-level bookmarks/notes for PDF
- Local persistence via IndexedDB (uploaded files, progress, annotations)

## Non-goals (v1)

- Backend / accounts / cloud sync
- PDF selection-range highlighting
- Social features, comments threads, sharing
- OCR or scanned-PDF text extraction for annotations
- Mobile-native apps

## Design read (taste-skill)

Reading product UI, WeChat Reading bookshelf + dark dual-column reader; clean editorial language.

- `DESIGN_VARIANCE: 5`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 3`

Stack defaults: Vite + React + Tailwind v4 + Motion (light only) + Phosphor icons. No AI-purple defaults; bookshelf is white/air; reader is dark/sepia/light themes.

## Approach

**Chosen:** Vite + React SPA with client-side format engines and IndexedDB.

Alternatives rejected:

- Next.js static export: heavier routing/asset story for GitHub Pages
- Vanilla HTML/JS: harder to keep reader + annotation UI maintainable

## Architecture

```
src/
  app/           # routes: Shelf, Reader
  components/    # ShelfGrid, BookCard, ReaderShell, Toolbar, panels
  lib/
    books/       # manifest + IndexedDB book store
    readers/     # txt / epub / pdf adapters (common ReaderSurface API)
    annotations/ # highlight/note/bookmark models + IDB
    pagination/  # TXT (and EPUB chapter) column pagination helpers
  styles/        # theme tokens (light / sepia / dark)
public/
  books/         # sample pdf / txt / epub + covers
  books.json     # sample catalog manifest
```

### Routing

| Path | View |
|------|------|
| `/` | Bookshelf |
| `/read/:id` | Reader |

Vite `base` defaults to `/hi-reader/` for project Pages; overridable via env. SPA fallback: copy `index.html` → `404.html` in deploy.

### Common reader surface

Each format adapter exposes:

- `load(source): Promise<BookSession>`
- `getToc(): TocItem[]`
- `getPageCount() / goToPage(n) / next / prev`
- `setLayout('single' | 'double')`
- `setFontScale(n)` (TXT/EPUB; PDF zoom if useful)
- `setTheme(themeId)`
- Optional text selection hooks for annotation (TXT/EPUB only)

PDF adapter ignores font-size as body typography; may map to zoom. Layout single/double maps to one vs two PDF pages side by side when viewport allows.

## Features

### Bookshelf

- White background, responsive CSS grid (`auto-fill`, ~3:4 covers)
- Title under cover, single-line ellipsis
- Header: brand **hi-reader**, search (filter by title), add-book control
- Click cover/title → `/read/:id`
- Hover: subtle lift (low motion)

### Add book

- File picker accepts `.pdf`, `.txt`, `.epub`
- Detect format by extension + MIME fallback
- Store file blob in IndexedDB; generate id; optional cover: EPUB cover if present, else solid placeholder with title initial
- Appear in shelf mixed with samples (samples marked `source: 'sample'`, uploads `source: 'local'`)

### Sample catalog

- At least one sample per format under `public/books/`
- Prefer public-domain or clearly free sample text; document attribution in README
- `public/books.json` lists id, title, format, file path, cover path

### Reader chrome

- Top: book icon + title; links back to shelf (“我的书架” / home)
- Main: rounded reading surface; page numbers; prev/next at bottom
- Narrow viewport: force single column
- Keyboard: ← → for pages; Esc closes open panels

### Right toolbar

| Control | Behavior |
|---------|----------|
| 目录 | Side panel: TOC; jump to chapter/page |
| 字号 | Stepper or presets for TXT/EPUB; PDF zoom optional |
| 批注 | Toggle highlight mode / apply highlight to selection (TXT/EPUB); PDF shows tip to use 笔记 for page notes |
| 笔记 | List notes; create from selection (TXT/EPUB) or current page (PDF); edit/delete |
| 布局 | Toggle single / double column |
| 主题 | light / sepia / dark |

### Annotations model

```ts
type Annotation = {
  id: string
  bookId: string
  kind: 'highlight' | 'note' | 'bookmark'
  // TXT/EPUB text anchors
  anchor?: { start: number; end: number; quote: string; chapterId?: string }
  // PDF / shared page target
  page?: number
  body?: string        // note text
  color?: string       // highlight
  createdAt: number
  updatedAt: number
}
```

- Persist annotations and reading progress (`bookId → { page, layout, theme, fontScale }`) in IndexedDB
- Samples use stable string ids from manifest so progress survives reload

### Format specifics

| Format | Engine | Pagination | Annotations |
|--------|--------|------------|-------------|
| TXT | Custom splitter | Measure columns; page by character/paragraph chunks | Range highlight + notes |
| EPUB | epub.js (or equivalent maintained lib) | Library pagination / spine | CFI or chapter+offset + quote; notes |
| PDF | pdf.js | One or two pages | `kind: 'bookmark' \| 'note'` with `page` only |

## GitHub Pages

- `vite.config` `base: process.env.BASE_PATH \|\| '/hi-reader/'`
- Deploy: GitHub Actions on push to `main` → build → upload `dist` to `gh-pages` (or `peaceiris/actions-gh-pages`)
- Include `404.html` identical to `index.html` for client routes
- README: enable Pages from `gh-pages` branch / Actions artifact

## Error handling

- Unsupported / corrupt file: toast + keep shelf usable
- Missing sample asset: skip card, console warn
- IDB quota: message to remove books
- EPUB/PDF worker load failure: show retry on reader

## Testing

- Unit: TXT pagination boundaries; annotation anchor round-trip; manifest merge with local books
- Smoke: load each sample format in reader (manual or playwright later if cheap)
- One small assert/demo per non-trivial module (ponytail): pagination + IDB store

## Success criteria

1. Shelf shows samples + uploaded books; search filters; add PDF/TXT/EPUB works offline after first load
2. Opening a book shows reader with TOC, font (text formats), layout, theme
3. TXT/EPUB: select text → highlight and/or note; list/edit/delete in 笔记 panel
4. PDF: add page bookmark/note for current page; no range highlight
5. Progress and annotations survive refresh
6. Deployed site on GitHub Pages serves shelf and deep-link reader URLs without 404 dead-ends
