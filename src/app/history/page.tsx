'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getInterview,
  listInterviews,
  weaknessStats,
  type InterviewRecord,
  type RecordFilters,
  type WeaknessStat,
} from '../../api/interviews'
import { useAuthStore } from '../../store/authStore'
import {
  averageDimensions,
  DimensionBars,
  DimensionRadar,
  LevelBadge,
  ScoreTrendChart,
  WeaknessChart,
} from '../../components/history/charts'

export default function HistoryPage() {
  const token = useAuthStore((s) => s.token)
  const [filters, setFilters] = useState<RecordFilters>({})
  const [records, setRecords] = useState<InterviewRecord[]>([])
  const [stats, setStats] = useState<WeaknessStat[]>([])
  const [selected, setSelected] = useState<InterviewRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([listInterviews(token, filters), weaknessStats(token)])
      .then(([list, ws]) => {
        if (cancelled) return
        setRecords(list)
        setStats(ws)
        setError('')
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [token, filters, reloadKey])

  const applyFilters = (f: RecordFilters) => {
    setLoading(true)
    setFilters(f)
  }
  const reload = () => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const average = useMemo(() => averageDimensions(records), [records])
  const best = records.length ? Math.max(...records.map((r) => r.overall_score)) : 0
  const mean = records.length ? records.reduce((s, r) => s + r.overall_score, 0) / records.length : 0

  const openDetail = async (sessionId: string) => {
    try {
      setSelected(await getInterview(token, sessionId))
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载详情失败')
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-5">
        <header className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">历史评估报告</h2>
            <p className="text-sm text-gray-500">面试记录与评估结果，支持按评级 / 薄弱点 / 分数区间筛选</p>
          </div>
          <button onClick={reload} className="text-sm text-blue-600 hover:underline">刷新</button>
        </header>

        <Filters key={JSON.stringify(filters)} value={filters} onChange={applyFilters} />
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid grid-cols-3 gap-4">
          <Stat label="面试次数" value={String(records.length)} />
          <Stat label="平均分" value={records.length ? mean.toFixed(1) : '-'} />
          <Stat label="最高分" value={records.length ? best.toFixed(0) : '-'} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card title="综合分趋势" className="col-span-2"><ScoreTrendChart records={records} /></Card>
          <Card title="高频薄弱点">
            <WeaknessChart stats={stats} onSelect={(w) => applyFilters({ ...filters, weakness: w })} />
          </Card>
        </div>

        <Card title={`面试记录${loading ? '（加载中…）' : ''}`}>
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">时间</th>
                <th className="text-left">岗位</th>
                <th className="text-left">评级</th>
                <th className="text-right">综合分</th>
                <th className="text-left pl-6">薄弱点</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.session_id}
                  onClick={() => void openDetail(r.session_id)}
                  className="border-b last:border-0 hover:bg-blue-50 cursor-pointer"
                >
                  <td className="py-2 text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="text-gray-800">{r.position || '-'}</td>
                  <td><LevelBadge level={r.overall_level} /></td>
                  <td className="text-right font-medium">{r.overall_score.toFixed(0)}</td>
                  <td className="pl-6 text-gray-500 truncate max-w-xs">{(r.weaknesses ?? []).join('、') || '-'}</td>
                </tr>
              ))}
              {!loading && records.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">暂无记录，完成一次模拟面试后会出现在这里</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {selected && <Detail record={selected} average={average} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Filters({ value, onChange }: { value: RecordFilters; onChange: (f: RecordFilters) => void }) {
  // 外部筛选条件变化时由父组件通过 key 重新挂载，draft 随之重置
  const [draft, setDraft] = useState(value)
  const input = 'border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onChange(draft)
      }}
      className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border"
    >
      <input className={input} placeholder="岗位关键词" value={draft.position ?? ''}
        onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
      <select className={input} value={draft.level ?? ''} onChange={(e) => setDraft({ ...draft, level: e.target.value })}>
        <option value="">全部评级</option>
        {['A', 'B', 'C', 'D'].map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <input className={input} placeholder="薄弱点（精确）" value={draft.weakness ?? ''}
        onChange={(e) => setDraft({ ...draft, weakness: e.target.value })} />
      <input className={`${input} w-24`} type="number" placeholder="最低分" value={draft.min_score ?? ''}
        onChange={(e) => setDraft({ ...draft, min_score: e.target.value ? Number(e.target.value) : undefined })} />
      <input className={`${input} w-24`} type="number" placeholder="最高分" value={draft.max_score ?? ''}
        onChange={(e) => setDraft({ ...draft, max_score: e.target.value ? Number(e.target.value) : undefined })} />
      <button type="submit" className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">筛选</button>
      <button type="button" onClick={() => onChange({})} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800">重置</button>
    </form>
  )
}

function Detail({ record, average, onClose }: { record: InterviewRecord; average: Record<string, number>; onClose: () => void }) {
  const report = record.report
  const dims = report?.dimension_score ?? record.dimension_score ?? {}
  return (
    <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={onClose}>
      <div className="w-[640px] h-full bg-white overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{record.position || '面试报告'}</h3>
            <p className="text-xs text-gray-500">{new Date(record.created_at).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{record.overall_score.toFixed(0)}</div>
            <LevelBadge level={record.overall_level} />
          </div>
        </div>

        <section>
          <h4 className="text-sm font-medium text-gray-700 mb-2">维度评分 <span className="text-xs text-gray-400">（虚线为历史平均）</span></h4>
          {Object.keys(dims).length >= 3 ? <DimensionRadar current={dims} average={average} /> : <DimensionBars scores={dims} />}
        </section>

        {report?.summary && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{report.summary}</p>}

        <div className="grid grid-cols-2 gap-4">
          <TagList title="优势" items={report?.strengths} color="bg-green-100 text-green-700" />
          <TagList title="薄弱点" items={report?.weaknesses} color="bg-orange-100 text-orange-700" />
        </div>

        {report?.detailed_review && report.detailed_review.length > 0 && (
          <section>
            <h4 className="text-sm font-medium text-gray-700 mb-2">逐题点评</h4>
            <div className="space-y-3">
              {report.detailed_review.map((q, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800">{i + 1}. {q.question_content}</p>
                    <span className="text-sm font-bold shrink-0">{q.score.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full my-2">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, q.score)}%` }} />
                  </div>
                  {q.comment && <p className="text-xs text-gray-600">{q.comment}</p>}
                  {q.key_points_missed && q.key_points_missed.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">遗漏：{q.key_points_missed.join('、')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {record.review_plan?.study_plan && record.review_plan.study_plan.length > 0 && (
          <section>
            <h4 className="text-sm font-medium text-gray-700 mb-2">复习计划</h4>
            <ul className="space-y-2">
              {record.review_plan.study_plan.map((s, i) => (
                <li key={i} className="text-sm border-l-2 border-purple-300 pl-3">
                  <span className="font-medium">{s.topic}</span>
                  {s.time_estimate && <span className="text-xs text-gray-400 ml-2">{s.time_estimate}</span>}
                  <p className="text-xs text-gray-600">{s.objective}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function TagList({ title, items, color }: { title: string; items?: string[]; color: string }) {
  return (
    <section>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {(items ?? []).length === 0 && <span className="text-xs text-gray-400">无</span>}
        {(items ?? []).map((t) => <span key={t} className={`text-xs px-2 py-0.5 rounded ${color}`}>{t}</span>)}
      </div>
    </section>
  )
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-800 mt-1">{value}</div>
    </div>
  )
}
