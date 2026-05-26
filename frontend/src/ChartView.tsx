import ReactECharts from 'echarts-for-react'
import type { QueryResponse } from './api'

interface Props {
  result: QueryResponse
  viewMode: 'chart' | 'table'
}

function EmptyState() {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 64 64" width="80" height="80">
        <rect x="8" y="12" width="48" height="40" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="8" y1="22" x2="56" y2="22" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="16" cy="18" r="2.5" fill="#cbd5e1" />
        <circle cx="25" cy="18" r="2.5" fill="#cbd5e1" />
        <circle cx="34" cy="18" r="2.5" fill="#cbd5e1" />
        <rect x="12" y="28" width="32" height="5" rx="2.5" fill="#e2e8f0" />
        <rect x="12" y="37" width="26" height="5" rx="2.5" fill="#e2e8f0" />
        <rect x="12" y="46" width="20" height="5" rx="2.5" fill="#e2e8f0" />
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

  const seriesType = chart_type === 'table' ? 'bar' : chart_type as 'bar' | 'line' | 'pie'
  const xCol = columns[0]
  const yCols = columns.slice(1)

  if (chart_type === 'pie') {
    const option = {
      tooltip: { trigger: 'item' as const },
      series: [
        {
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '55%'],
          label: { show: true, formatter: '{b}: {d}%' },
          data: data.map((row) => ({
            name: String(row[xCol] ?? ''),
            value: Number(row[yCols[0]]) || 0,
          })),
        },
      ],
    }
    return <ReactECharts option={option} style={{ height: 420 }} />
  }

  const yRanges = yCols.map((col) => {
    const vals = data.map((row) => Number(row[col]) || 0)
    return { col, min: Math.min(...vals), max: Math.max(...vals) }
  })
  const allMax = Math.max(...yRanges.map((r) => r.max))
  const allMin = Math.min(...yRanges.map((r) => r.min), 1)
  const useDualAxis = yCols.length === 2 && allMax / allMin > 10

  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: yCols.length > 1 ? { bottom: 0 } : undefined,
    grid: { left: '3%', right: useDualAxis ? '8%' : '4%', bottom: yCols.length > 1 ? '12%' : '8%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: data.map((row) => String(row[xCol] ?? '')),
      axisLabel: { rotate: 30, fontSize: 11 },
    },
    yAxis: useDualAxis
      ? [
          { type: 'value' as const, name: yCols[0], nameTextStyle: { fontSize: 11 } },
          { type: 'value' as const, name: yCols[1], nameTextStyle: { fontSize: 11 } },
        ]
      : { type: 'value' as const },
    series: yCols.map((col, i) => ({
      type: seriesType,
      name: col,
      yAxisIndex: useDualAxis ? i : 0,
      data: data.map((row) => Number(row[col]) || 0),
      barMaxWidth: 40,
    })),
  }

  return <ReactECharts option={option} style={{ height: 420 }} />
}
