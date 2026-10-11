import { API_BASE, authHeaders } from '../lib/config'

export interface QuestionReview {
  question_content: string
  user_answer: string
  score: number
  comment: string
  key_points_hit?: string[]
  key_points_missed?: string[]
}

export interface EvaluationReport {
  overall_score: number
  overall_level: string
  dimension_score?: Record<string, number>
  strengths?: string[]
  weaknesses?: string[]
  detailed_review?: QuestionReview[]
  summary?: string
}

export interface InterviewRecord {
  session_id: string
  position: string
  overall_score: number
  overall_level: string
  dimension_score?: Record<string, number>
  weaknesses?: string[]
  created_at: string
  report?: EvaluationReport
  review_plan?: {
    weak_areas?: { topic: string; score: number; priority: string }[]
    study_plan?: { topic: string; objective: string; actions?: string[]; time_estimate?: string }[]
  }
}

export interface RecordFilters {
  position?: string
  level?: string
  weakness?: string
  min_score?: number
  max_score?: number
}

export interface WeaknessStat {
  topic: string
  count: number
}

async function get<T>(path: string, token: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(res.status === 401 ? '登录已失效，请重新登录' : `请求失败（${res.status}）`)
  return res.json()
}

export function listInterviews(token: string | null, filters: RecordFilters = {}, limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) })
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '') params.set(k, String(v))
  }
  return get<InterviewRecord[]>(`/interviews?${params}`, token)
}

export function getInterview(token: string | null, sessionId: string) {
  return get<InterviewRecord>(`/interviews/${encodeURIComponent(sessionId)}`, token)
}

export function weaknessStats(token: string | null, limit = 10) {
  return get<WeaknessStat[]>(`/interviews/stats/weaknesses?limit=${limit}`, token)
}
