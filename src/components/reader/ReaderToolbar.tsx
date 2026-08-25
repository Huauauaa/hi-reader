import { Columns, Highlighter, List, Note, Palette, TextAa } from '@phosphor-icons/react'

export type ReaderPanel = 'toc' | 'font' | 'theme'

type Props = {
  active: ReaderPanel | null
  layout: 'single' | 'double'
  onToggle: (panel: ReaderPanel) => void
  onLayoutToggle: () => void
  onSoon: () => void
}

const btn =
  'flex h-10 w-10 items-center justify-center rounded-full text-[var(--page-ink)] transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--page-ink)_16%,transparent)]'

function activeCls(on: boolean): string {
  return on ? 'bg-[color-mix(in_srgb,var(--page-ink)_18%,transparent)]' : 'bg-[color-mix(in_srgb,var(--page-ink)_8%,transparent)]'
}

export function ReaderToolbar({ active, layout, onToggle, onLayoutToggle, onSoon }: Props) {
  return (
    <div className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2.5 md:right-5">
      <button type="button" aria-label="目录" aria-pressed={active === 'toc'} className={`${btn} ${activeCls(active === 'toc')}`} onClick={() => onToggle('toc')}>
        <List size={20} />
      </button>
      <button type="button" aria-label="字号" aria-pressed={active === 'font'} className={`${btn} ${activeCls(active === 'font')}`} onClick={() => onToggle('font')}>
        <TextAa size={20} />
      </button>
      <button type="button" aria-label="批注" className={`${btn} ${activeCls(false)}`} onClick={onSoon}>
        <Highlighter size={20} />
      </button>
      <button type="button" aria-label="笔记" className={`${btn} ${activeCls(false)}`} onClick={onSoon}>
        <Note size={20} />
      </button>
      <button
        type="button"
        aria-label="布局"
        aria-pressed={layout === 'double'}
        className={`${btn} ${activeCls(layout === 'double')}`}
        onClick={onLayoutToggle}
      >
        <Columns size={20} />
      </button>
      <button type="button" aria-label="主题" aria-pressed={active === 'theme'} className={`${btn} ${activeCls(active === 'theme')}`} onClick={() => onToggle('theme')}>
        <Palette size={20} />
      </button>
    </div>
  )
}
