# TEXT-TO-SQL BI Agent

用户输入自然语言问题，后端通过 LLM 将自然语言转换为 SQL，执行查询后将结果通过 ECharts 图表渲染返回前端展示。

## 核心约束

- **数据库迁移能力**：Agent 必须能从开发环境的测试库无缝切换到任意企业生产库。切换数据库只需改配置文件（连接信息 + 方言），不改一行代码。
- **Schema 自动感知**：连接新库后自动扫描表结构，生成向量索引供 LLM 检索。不硬编码任何表名或字段名。
- **记忆隔离**：自进化记忆按 scope 标记（`global` 跨库通用 / `schema` 绑定当前库 / `user` 绑定用户），切换数据库时 schema 级记忆隔离，防止旧库的修正经验污染新库的 prompt。

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
- **后端**: Python FastAPI + LangChain + SQLAlchemy + DeepSeek (OpenAI-compatible)

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
- [部署指南](./DEPLOYMENT.md)
