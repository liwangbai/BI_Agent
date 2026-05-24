# Text-to-SQL BI Agent

自然语言输入 → LLM 生成 SQL → 执行查询 → ECharts 图表展示

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite + ECharts |
| 后端 | Python FastAPI + SQLAlchemy + OpenAI SDK |

## 项目结构

```
├── frontend/    # Web 前端 (React + Vite + ECharts)
└── backend/     # API 后端 (FastAPI + LLM + SQL)
```

## 快速启动

### 后端

```bash
cd backend
uv sync
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端开发服务器运行在 `http://localhost:5173`，`/api/*` 请求自动代理到后端 `:8000`。

## 工作原理

1. 用户输入自然语言问题
2. 后端通过 LLM 将问题转换为 SQL
3. 执行 SQL 查询数据库
4. 查询结果格式化为 JSON 返回前端
5. 前端通过 ECharts 渲染图表
