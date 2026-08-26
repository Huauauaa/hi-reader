# hi-reader

Offline-first reader for PDF, TXT, and EPUB. Built with React, Vite, and IndexedDB for local progress and annotations.

## Install & dev

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (default `http://localhost:5173/hi-reader/`). Sample books appear on the shelf; try `/hi-reader/read/sample-txt`.

Other scripts:

| Command        | Purpose                                 |
| -------------- | --------------------------------------- |
| `pnpm test`    | Run Vitest once                         |
| `pnpm build`   | Typecheck + production build to `dist/` |
| `pnpm preview` | Serve the built `dist/` locally         |

## GitHub Pages deploy

This repo ships a [GitHub Actions workflow](.github/workflows/deploy.yml) that runs on every push to `main`: `pnpm ci`, `pnpm test`, then `pnpm build` with `BASE_PATH=/hi-reader/`, and deploys `dist/` to GitHub Pages.

**One-time setup**

1. Push this repo to GitHub (repo name should be `hi-reader` so the default base path `/hi-reader/` matches).
2. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions** (required; otherwise deploy fails with HTTP 404).
3. Push/merge to `main`, or re-run the workflow from the Actions tab.

**Custom repo name or user/org Pages URL**

Set `BASE_PATH` at build time to your Pages path (must start and end with `/`), e.g. `BASE_PATH=/my-fork/` for `https://<user>.github.io/my-fork/`.

**SPA deep links**

The build copies `index.html` → `404.html`. GitHub Pages serves `404.html` for unknown paths so client-side routes like `/hi-reader/read/sample-txt` work after a hard refresh.

Local production check:

```bash
BASE_PATH=/hi-reader/ pnpm build && pnpm preview
```

Then open the preview URL and navigate to `/hi-reader/read/sample-txt`.

## Supported formats

| Format   | Reading              | Highlights                  | Notes                               |
| -------- | -------------------- | --------------------------- | ----------------------------------- |
| **TXT**  | Paginated plain text | Select text → 高亮 / 写笔记 | Page + character offset anchors     |
| **EPUB** | EPUB.js reflow       | Select text → 高亮 / 写笔记 | CFI anchors (`chapterId`)           |
| **PDF**  | pdf.js canvas pages  | Not supported (see below)   | Page-level notes and bookmarks only |

Progress (page, theme, layout) persists in IndexedDB per book.

## PDF annotation limits

PDF rendering is canvas-based; there is no text layer for selection. Tapping **批注** shows: **「PDF 请使用笔记添加页备注」**.

Use the **笔记** panel instead:

- **为本页添加笔记** — free-text note anchored to the current page number
- **添加书签** — bookmark for the current page

Highlights and in-text quotes are not available for PDF in this version.

## Sample books attribution

Bundled samples: drop `.pdf` / `.txt` / `.epub` files into `src/books/`.
They are discovered at build time via `import.meta.glob` (no manifest).

| File             | Source                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `示例 TXT.txt`   | Excerpt from _论语·学而_ (public domain) and the opening of _A Tale of Two Cities_ by Charles Dickens ([Project Gutenberg](https://www.gutenberg.org/ebooks/98)) |
| `示例 PDF.pdf`   | Generated placeholder (“示例 PDF”) via `scripts/gen-samples.mjs`                                                                                                 |
| `示例 EPUB.epub` | Generated minimal EPUB (“示例 EPUB”) via `scripts/gen-samples.mjs`                                                                                               |

Regenerate PDF/EPUB samples: `node scripts/gen-samples.mjs`
