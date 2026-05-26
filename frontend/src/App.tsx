import { useState, useEffect } from 'react'
import ChartView from './ChartView'
import {
  query,
  fetchDbStatus,
  submitFeedback,
  type QueryResponse,
  type DatabaseStatus,
} from './api'
import './App.css'

function App() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [correctedSql, setCorrectedSql] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  useEffect(() => {
    fetchDbStatus().then(setDbStatus).catch(() => {})
  }, [])

  const handleQuery = async () => {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setFeedbackOpen(false)
    setFeedbackSent(false)
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

  const handleFeedback = async () => {
    if (!result || !feedbackText.trim()) return
    try {
      await submitFeedback(question, result.sql, feedbackText, correctedSql)
      setFeedbackSent(true)
    } catch {
      setError('反馈提交失败')
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Text-to-SQL BI Agent</h1>
        {dbStatus && (
          <div className="db-badge">
            {dbStatus.db_type === 'sample'
              ? `示例数据库 · ${dbStatus.table_count} 张表`
              : `外部数据库 · ${dbStatus.table_count} 张表`}
          </div>
        )}
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

          <div className="feedback-area">
            {feedbackSent ? (
              <p className="feedback-done">经验已记录，下次类似问题会参考此修正</p>
            ) : feedbackOpen ? (
              <div className="feedback-form">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="描述哪里不对，例如：应该用 order_date 过滤，不是 created_at"
                  rows={2}
                />
                <textarea
                  value={correctedSql}
                  onChange={(e) => setCorrectedSql(e.target.value)}
                  placeholder="正确的 SQL（选填）"
                  rows={2}
                />
                <div className="feedback-actions">
                  <button onClick={handleFeedback}>提交反馈</button>
                  <button
                    className="cancel"
                    onClick={() => setFeedbackOpen(false)}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="feedback-buttons">
                <button
                  className="feedback-btn"
                  onClick={() => {
                    setFeedbackText('结果正确')
                    submitFeedback(question, result.sql, '结果正确')
                    setFeedbackSent(true)
                  }}
                >
                  结果正确
                </button>
                <button
                  className="feedback-btn warn"
                  onClick={() => {
                    setFeedbackOpen(true)
                    setFeedbackText('')
                    setCorrectedSql('')
                  }}
                >
                  需要纠错
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
