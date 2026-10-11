import type { InterviewRecord, WeaknessStat } from '../../api/interviews'

const scoreColor = (v: number) => (v >= 80 ? '#16a34a' : v >= 60 ? '#2563eb' : v >= 40 ? '#d97706' : '#dc2626')

/** 综合分趋势折线图（按时间升序） */
export function ScoreTrendChart({ records }: { records: InterviewRecord[] }) {
  const data = [...records].sort((a, b) => a.created_at.localeCompare(b.created_at))
  if (data.length === 0) return <Empty text="暂无面试记录" />

  const W = 560, H = 200, P = { l: 32, r: 12, t: 12, b: 28 }
  const x = (i: number) => P.l + (data.length === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (data.length - 1))
  const y = (v: number) => P.t + ((100 - v) * (H - P.t - P.b)) / 100
  const path = data.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r.overall_score)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52" role="img" aria-label="综合分趋势">
      {[0, 20, 40, 60, 80, 100].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="#e5e7eb" strokeDasharray={v ? '3 3' : undefined} />
          <text x={P.l - 6} y={y(v) + 4} fontSize="10" textAnchor="end" fill="#9ca3af">{v}</text>
        </g>
      ))}
      <line x1={P.l} x2={W - P.r} y1={y(60)} y2={y(60)} stroke="#fca5a5" />
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" />
      {data.map((r, i) => (
        <g key={r.session_id}>
          <circle cx={x(i)} cy={y(r.overall_score)} r="4" fill={scoreColor(r.overall_score)}>
            <title>{`${r.position} · ${r.overall_score.toFixed(0)} 分 · ${new Date(r.created_at).toLocaleString()}`}</title>
          </circle>
          {data.length <= 12 && (
            <text x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6b7280">
              {new Date(r.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

/** 维度雷达图：当前记录 vs 历史平均 */
export function DimensionRadar({ current, average }: { current: Record<string, number>; average?: Record<string, number> }) {
  const keys = Object.keys(current)
  if (keys.length < 3) return <DimensionBars scores={current} />

  const S = 240, C = S / 2, R = 84
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / keys.length - Math.PI / 2
    return [C + (R * v * Math.cos(a)) / 100, C + (R * v * Math.sin(a)) / 100]
  }
  const poly = (scores: Record<string, number>) => keys.map((k, i) => point(i, scores[k] ?? 0).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-xs mx-auto" role="img" aria-label="维度雷达图">
      {[25, 50, 75, 100].map((lv) => (
        <polygon key={lv} points={keys.map((_, i) => point(i, lv).join(',')).join(' ')} fill="none" stroke="#e5e7eb" />
      ))}
      {keys.map((k, i) => {
        const [lx, ly] = point(i, 122)
        const [ex, ey] = point(i, 100)
        return (
          <g key={k}>
            <line x1={C} y1={C} x2={ex} y2={ey} stroke="#e5e7eb" />
            <text x={lx} y={ly} fontSize="10" textAnchor="middle" dominantBaseline="middle" fill="#374151">{k}</text>
          </g>
        )
      })}
      {average && <polygon points={poly(average)} fill="#9ca3af33" stroke="#9ca3af" strokeDasharray="3 3" />}
      <polygon points={poly(current)} fill="#2563eb33" stroke="#2563eb" strokeWidth="2" />
    </svg>
  )
}

export function DimensionBars({ scores }: { scores: Record<string, number> }) {
  const entries = Object.entries(scores)
  if (entries.length === 0) return <Empty text="无维度评分" />
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-xs text-gray-600 mb-0.5"><span>{k}</span><span>{v.toFixed(0)}</span></div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div className="h-2 rounded-full" style={{ width: `${Math.min(100, v)}%`, background: scoreColor(v) }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 高频薄弱点横向条形图 */
export function WeaknessChart({ stats, onSelect }: { stats: WeaknessStat[]; onSelect?: (topic: string) => void }) {
  if (stats.length === 0) return <Empty text="暂无薄弱点数据" />
  const max = Math.max(...stats.map((s) => Number(s.count)))
  return (
    <div className="space-y-1.5">
      {stats.map((s) => (
        <button key={s.topic} onClick={() => onSelect?.(s.topic)} className="w-full text-left group" title="按该薄弱点筛选">
          <div className="flex justify-between text-xs text-gray-600 group-hover:text-blue-600">
            <span className="truncate">{s.topic}</span>
            <span>{s.count} 次</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full">
            <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${(Number(s.count) / max) * 100}%` }} />
          </div>
        </button>
      ))}
    </div>
  )
}

export function averageDimensions(records: InterviewRecord[]): Record<string, number> {
  const sum: Record<string, { t: number; n: number }> = {}
  for (const r of records) {
    for (const [k, v] of Object.entries(r.dimension_score ?? {})) {
      sum[k] = { t: (sum[k]?.t ?? 0) + v, n: (sum[k]?.n ?? 0) + 1 }
    }
  }
  return Object.fromEntries(Object.entries(sum).map(([k, { t, n }]) => [k, t / n]))
}

export function LevelBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-blue-100 text-blue-700',
    C: 'bg-yellow-100 text-yellow-700',
    D: 'bg-red-100 text-red-700',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cls[level] ?? 'bg-gray-100 text-gray-600'}`}>{level || '-'}</span>
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 text-center py-8">{text}</p>
}
