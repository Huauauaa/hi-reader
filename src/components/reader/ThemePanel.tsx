import type { ReadingProgress } from '../../types/book'

type Theme = ReadingProgress['theme']

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: 'dark', label: '深色', swatch: '#2a2a2a' },
  { id: 'light', label: '浅色', swatch: '#ffffff' },
  { id: 'sepia', label: '羊皮纸', swatch: '#f4ecd8' },
]

type Props = {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemePanel({ theme, onChange }: Props) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-medium tracking-wide opacity-70">
        主题
      </h2>
      <div className="flex flex-col gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              theme === t.id
                ? 'bg-[color-mix(in_srgb,var(--page-ink)_12%,transparent)]'
                : 'hover:bg-[color-mix(in_srgb,var(--page-ink)_7%,transparent)]'
            }`}
          >
            <span
              className="h-6 w-6 rounded-full ring-1 ring-[color-mix(in_srgb,var(--page-ink)_20%,transparent)]"
              style={{ background: t.swatch }}
            />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
