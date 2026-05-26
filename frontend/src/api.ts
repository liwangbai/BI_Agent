export interface QueryResponse {
  sql: string
  data: Record<string, unknown>[]
  columns: string[]
  chart_type: string
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
