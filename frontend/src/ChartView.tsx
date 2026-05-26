import ReactECharts from 'echarts-for-react'
import type { QueryResponse } from './api'

interface Props {
  result: QueryResponse
  viewMode: 'chart' | 'table'
}

function EmptyState() {
  return (
    <div className="empty-state">
      <svg className="empty-icon" viewBox="0 0 64 64" width="64" height="64">
        <rect x="8" y="12" width="48" height="40" rx="4" fill="none" stroke="#d1d5db" strokeWidth="2" />
        <line x1="8" y1="22" x2="56" y2="22" stroke="#d1d5db" strokeWidth="2" />
        <circle cx="16" cy="18" r="2" fill="#d1d5db" />
        <circle cx="24" cy="18" r="2" fill="#d1d5db" />
        <circle cx="32" cy="18" r="2" fill="#d1d5db" />
        <rect x="12" y="28" width="30" height="4" rx="2" fill="#e5e7eb" />
        <rect x="12" y="36" width="24" height="4" rx="2" fill="#e5e7eb" />
        <rect x="12" y="44" width="18" height="4" rx="2" fill="#e5e7eb" />
      </svg>
      <p>查询无结果</p>
    </div>
  )
}

function TableView({ result }: { result: QueryResponse }) {
  const { columns, data } = result
  if (data.length === 0) return <EmptyState />
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col}>{String(row[col] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ChartView({ result, viewMode }: Props) {
  const { columns, data, chart_type } = result

  if (viewMode === 'table') {
    return <TableView result={result} />
  }

  if (data.length === 0) {
    return <EmptyState />
  }

  // table 类型切到图表视图时，默认用柱状图
  const seriesType = chart_type === 'table' ? 'bar' : chart_type as 'bar' | 'line' | 'pie'

  const xCol = columns[0]
  const yCols = columns.slice(1)

  if (chart_type === 'pie') {
    const option = {
      tooltip: { trigger: 'item' as const },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: data.map((row) => ({
            name: String(row[xCol] ?? ''),
            value: Number(row[yCols[0]]) || 0,
          })),
        },
      ],
    }
    return <ReactECharts option={option} style={{ height: 400 }} />
  }

  // 检测多指标量级差异：如果最大值/最小值 > 10，用双 Y 轴
  const yRanges = yCols.map((col) => {
    const vals = data.map((row) => Number(row[col]) || 0)
    return { col, min: Math.min(...vals), max: Math.max(...vals) }
  })
  const allMax = Math.max(...yRanges.map((r) => r.max))
  const allMin = Math.min(...yRanges.map((r) => r.min), 1)
  const useDualAxis = yCols.length === 2 && allMax / allMin > 10

  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: yCols.length > 1 ? {} : undefined,
    grid: { left: '3%', right: useDualAxis ? '8%' : '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: data.map((row) => String(row[xCol] ?? '')),
      axisLabel: { rotate: 30 },
    },
    yAxis: useDualAxis
      ? [
          { type: 'value' as const, name: yCols[0] },
          { type: 'value' as const, name: yCols[1] },
        ]
      : { type: 'value' as const },
    series: yCols.map((col, i) => ({
      type: seriesType,
      name: col,
      yAxisIndex: useDualAxis ? i : 0,
      data: data.map((row) => Number(row[col]) || 0),
    })),
  }

  return <ReactECharts option={option} style={{ height: 400 }} />
}
