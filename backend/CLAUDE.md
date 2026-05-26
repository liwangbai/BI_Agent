# Backend — TEXT-TO-SQL BI Agent

Python 后端服务，负责接收用户自然语言问题，通过 LLM 生成 SQL，执行查询，返回结构化数据供前端图表渲染。

## 技术栈

| 技术 | 用途 |
|------|------|
| Python 3.11+ | 运行环境 |
| FastAPI | Web 框架 |
| Uvicorn | ASGI 服务器 |
| LangChain + LangChain-OpenAI | TEXT-to-SQL 核心编排 |
| SQLAlchemy | 数据库 ORM & 连接管理 |
| Pydantic | 数据校验 & 序列化 |

## 目录结构

```
backend/
├── CLAUDE.md              # 本文件
├── pyproject.toml         # 项目元数据 & 依赖
├── .env                   # 环境变量（API Key 等）
└── app/
    ├── __init__.py
    ├── main.py            # FastAPI 应用入口 + /api/query 路由
    ├── models.py          # Pydantic 请求/响应模型
    ├── database.py        # SQLite 样本数据 + LangChain SQLDatabase
    └── llm.py             # LangChain ChatOpenAI + JSON 输出解析
```

## 分层架构

```
FastAPI 路由层 (main.py)
       │
       ▼
LangChain 编排层 (llm.py)  ← ChatOpenAI + ChatPromptTemplate + JsonOutputParser
       │
       ▼
LangChain 数据库层 (database.py) ← SQLDatabase + SQLAlchemy engine
```

FastAPI 负责 HTTP 层和模型校验，LangChain 只替换 TEXT→SQL 核心链路，不反噬 Web 层。

## 开发命令

```bash
uv sync                              # 安装依赖
uvicorn app.main:app --reload --port 8000   # 启动开发服务器
pytest                               # 运行测试
```

## TEXT-to-SQL 处理流程

```
用户输入自然语言
       │
       ▼
  FastAPI POST /api/query
       │
       ▼
  LangChain SQLDatabase.get_table_info() → schema DDL
       │
       ▼
  LangChain ChatOpenAI + JsonOutputParser → {{sql, chart_type}}
       │
       ▼
  SQLAlchemy execute → list[dict]
       │
       ▼
  FastAPI → QueryResponse JSON
```

## API 设计约定

- 路由前缀统一使用 `/api/`
- 请求/响应使用 JSON 格式
- 使用 Pydantic models 定义请求体和响应体
- 错误响应统一格式：`{"detail": "error message"}`

## 数据库集成

- 开发阶段使用 SQLite 内存库 + 样本数据
- 生产环境通过 `SQLDatabase.from_uri(DATABASE_URL)` 一键切换，不改代码
- 支持多数据库方言（SQLite 开发，PostgreSQL/MySQL/MSSQL 生产），prompt 自动注入目标库方言规则
- LangChain SQLDatabase 自动扫描表结构，表结构零硬编码

## 自进化记忆

- 记忆模型字段：`original_question`, `original_sql`, `user_feedback`, `corrected_sql`, `question_embedding`, `scope`（`global`/`schema`/`user`）
- `scope=schema` 的记忆绑定当前数据库 schema hash，切换数据库后隔离，防止旧库修正污染
- `scope=global` 的记忆（如 SQL 写法技巧）跨库保留
- 每次 LLM 生成 SQL 前，用当前问题向量检索 Top-K 相似记忆注入 prompt
