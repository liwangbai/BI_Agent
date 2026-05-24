# TEXT-TO-SQL BI Agent

用户输入自然语言问题，后端通过 LLM 将自然语言转换为 SQL，执行查询后将结果通过 ECharts 图表渲染返回前端展示。

## 架构

```
用户浏览器 (React + ECharts)
        │
        ▼
   Vite Dev Server (:5173) ──proxy──▶  FastAPI (:8000)
                                           │
                                           ▼
                                      LLM (OpenAI/Anthropic)
                                           │
                                           ▼
                                      SQL Database
```

- **前端**: React 18 + TypeScript + Vite + ECharts (echarts-for-react)
- **后端**: Python FastAPI + SQLAlchemy + OpenAI/Anthropic SDK

## 目录结构

```
TEXT_TO_SQL_BI_AGENT/
├── CLAUDE.md              # 本文件 — 项目整体说明
├── frontend/              # Web 前端项目
│   ├── CLAUDE.md          # 前端开发说明
│   └── ...
└── backend/               # Python 后端项目
    ├── CLAUDE.md          # 后端开发说明
    └── ...
```

## 快速启动

### 后端

```bash
cd backend
uv sync                    # 安装依赖
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
pnpm install               # 安装依赖
pnpm dev                   # 启动开发服务器 (:5173)
```

前端 Vite 已配置代理，`/api/*` 请求自动转发到后端 `http://localhost:8000`。

## 子项目

- [前端开发说明](./frontend/CLAUDE.md)
- [后端开发说明](./backend/CLAUDE.md)
