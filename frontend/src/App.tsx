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

const SAMPLE_QUESTIONS = [
  '每种产品的销量排名',
  '各城市的销售额是多少',
  '电子产品的价格和销量',
  '每月订单总额趋势',
]

function App() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)
  const [sqlOpen, setSqlOpen] = useState(false)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'form' | 'done'>('idle')
  const [feedbackText, setFeedbackText] = useState('')
  const [correctedSql, setCorrectedSql] = useState('')

  useEffect(() => {
    fetchDbStatus().then(setDbStatus).catch(() => {})
  }, [])

  const handleQuery = async (q?: string) => {
    const input = q || question
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setSqlOpen(false)
    setFeedbackState('idle')
    setFeedbackText('')
    setCorrectedSql('')
    setQuestion(input)
    try {
      const res = await query(input)
      setResult(res)
      setViewMode(res.chart_type === 'table' || res.chart_type === 'pie' ? 'chart' : 'chart')
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handleCorrect = async () => {
    if (!result) return
    try {
      await submitFeedback(question, result.sql, '结果正确')
      setFeedbackState('done')
    } catch {
      setError('反馈提交失败')
    }
  }

  const handleSubmitFix = async () => {
    if (!result || !feedbackText.trim()) return
    try {
      await submitFeedback(question, result.sql, feedbackText, correctedSql)
      setFeedbackState('done')
    } catch {
      setError('反馈提交失败')
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          BI Agent
          <span>Text-to-SQL</span>
        </div>

        <div className="sidebar-section">
          <h4>数据源</h4>
          <div className="sidebar-stat">
            <span className="dot" />
            <span>
              {dbStatus
                ? dbStatus.db_type === 'sample'
                  ? '示例数据库'
                  : '外部数据库'
                : '加载中...'}
            </span>
          </div>
          {dbStatus && (
            <div className="sidebar-stat" style={{ paddingLeft: 14 }}>
              <span className="num">{dbStatus.table_count}</span> 张表
            </div>
          )}
          {dbStatus?.tables.slice(0, 5).map((t) => (
            <div key={t} className="sidebar-stat" style={{ paddingLeft: 14, fontSize: 12, opacity: 0.6 }}>
              {t}
            </div>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="input-area">
          <div className="input-row">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="输入自然语言问题，例如：上月各品类销售额趋势"
            />
            <button onClick={() => handleQuery()} disabled={loading}>
              {loading ? '···' : '查询'}
            </button>
          </div>
          <div className="sample-tags">
            {SAMPLE_QUESTIONS.map((q) => (
              <span key={q} className="sample-tag" onClick={() => handleQuery(q)}>
                {q}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
            <button
              onClick={() => handleQuery()}
              style={{ marginLeft: 12, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
            >
              重试
            </button>
          </div>
        )}

        {loading && (
          <div className="skeleton">
            <div className="skeleton-line" style={{ width: '30%' }} />
            <div className="skeleton-line" />
            <div className="skeleton-line" style={{ width: '80%' }} />
            <div className="skeleton-line" style={{ height: 200 }} />
          </div>
        )}

        {!loading && !result && !error && (
          <div className="welcome">
            <svg className="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              <path d="M3 3l18 18" opacity="0.3" />
            </svg>
            <p>输入问题，开始智能数据分析</p>
          </div>
        )}

        {result && (
          <div className="result-card">
            <div
              className={`sql-toggle ${sqlOpen ? 'open' : ''}`}
              onClick={() => setSqlOpen(!sqlOpen)}
            >
              <span className="arrow">▶</span>
              生成的 SQL
            </div>
            {sqlOpen && <div className="sql-body">{result.sql}</div>}

            {result.data.length > 0 && (
              <div className="toolbar">
                <div className="toolbar-left">
                  <button
                    className={`toolbar-btn ${viewMode === 'chart' ? 'active' : ''}`}
                    onClick={() => setViewMode('chart')}
                  >
                    图表
                  </button>
                  <button
                    className={`toolbar-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    表格
                  </button>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {result.data.length} 条结果
                </span>
              </div>
            )}

            <div className="chart-wrap">
              <ChartView result={result} viewMode={viewMode} />
            </div>

            {feedbackState === 'done' ? (
              <div className="feedback-bar">
                <span className="feedback-done">经验已记录</span>
              </div>
            ) : feedbackState === 'form' ? (
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
                <div className="btn-row">
                  <button className="btn-primary" onClick={handleSubmitFix}>
                    提交反馈
                  </button>
                  <button className="btn-ghost" onClick={() => setFeedbackState('idle')}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="feedback-bar">
                <span>结果准确吗？</span>
                <button className="positive" onClick={handleCorrect}>
                  准确
                </button>
                <button
                  className="negative"
                  onClick={() => {
                    setFeedbackState('form')
                    setFeedbackText('')
                    setCorrectedSql('')
                  }}
                >
                  需要修正
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
