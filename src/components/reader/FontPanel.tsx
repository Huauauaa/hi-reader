const MIN = 0.8
const MAX = 1.6
const STEP = 0.1

function snap(n: number): number {
  return Math.round(n * 10) / 10
}

type Props = {
  fontScale: number
  onChange: (n: number) => void
}

export function FontPanel({ fontScale, onChange }: Props) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-medium tracking-wide opacity-70">字号</h2>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label="减小字号"
          disabled={fontScale <= MIN}
          onClick={() => onChange(snap(Math.max(MIN, fontScale - STEP)))}
          className="rounded-lg px-3 py-2 text-sm hover:bg-[color-mix(in_srgb,var(--page-ink)_8%,transparent)] disabled:opacity-30"
        >
          A−
        </button>
        <span className="tabular-nums text-sm opacity-70">{Math.round(fontScale * 100)}%</span>
        <button
          type="button"
          aria-label="增大字号"
          disabled={fontScale >= MAX}
          onClick={() => onChange(snap(Math.min(MAX, fontScale + STEP)))}
          className="rounded-lg px-3 py-2 text-lg hover:bg-[color-mix(in_srgb,var(--page-ink)_8%,transparent)] disabled:opacity-30"
        >
          A+
        </button>
      </div>
    </div>
  )
}
