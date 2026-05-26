import { useState } from 'react'
import ChartView from './ChartView'
import { query, type QueryResponse } from './api'
import './App.css'

function App() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  const handleQuery = async () => {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await query(question)
      setResult(res)
      setViewMode('chart')
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Text-to-SQL BI Agent</h1>
      </header>

      <div className="query-bar">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          placeholder="输入问题，例如：每种产品的销售额是多少？"
        />
        <button onClick={handleQuery} disabled={loading}>
          {loading ? '查询中...' : '查询'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <details className="sql-box">
            <summary>生成的 SQL</summary>
            <pre>{result.sql}</pre>
          </details>

          {result.data.length > 0 && (
            <div className="view-toggle">
              <button
                className={viewMode === 'chart' ? 'active' : ''}
                onClick={() => setViewMode('chart')}
              >
                图表
              </button>
              <button
                className={viewMode === 'table' ? 'active' : ''}
                onClick={() => setViewMode('table')}
              >
                表格
              </button>
            </div>
          )}

          <div className="chart-area">
            <ChartView result={result} viewMode={viewMode} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
