export interface QueryResponse {
  sql: string
  data: Record<string, unknown>[]
  columns: string[]
  chart_type: string
}

export interface DatabaseStatus {
  db_type: string
  tables: string[]
  table_count: number
}

export interface MemoryItem {
  id: number
  question: string
  sql: string
  feedback: string
  corrected_sql: string
  scope: string
  created_at: string
}

export async function query(question: string): Promise<QueryResponse> {
  const res = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || '请求失败')
  }
  return res.json()
}

export async function fetchDbStatus(): Promise<DatabaseStatus> {
  const res = await fetch('/api/db/status')
  return res.json()
}

export async function submitFeedback(
  question: string,
  sql: string,
  feedback: string,
  correctedSql: string = '',
): Promise<void> {
  await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      sql,
      feedback,
      corrected_sql: correctedSql,
    }),
  })
}
