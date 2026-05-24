# Backend — TEXT-TO-SQL BI Agent

Python 后端服务，负责接收用户自然语言问题，通过 LLM 生成 SQL，执行查询，返回结构化数据供前端图表渲染。

## 技术栈

| 技术 | 用途 |
|------|------|
| Python 3.11+ | 运行环境 |
| FastAPI | Web 框架 |
| Uvicorn | ASGI 服务器 |
| SQLAlchemy | 数据库 ORM & 连接管理 |
| OpenAI SDK | LLM 调用 (TEXT-to-SQL 核心) |
| Pydantic | 数据校验 & 序列化 |

## 目录结构

```
backend/
├── CLAUDE.md              # 本文件
├── pyproject.toml         # 项目元数据 & 依赖
└── app/
    ├── __init__.py
    └── main.py            # FastAPI 应用入口
```

## 开发命令

```bash
uv sync                              # 安装依赖
uvicorn app.main:app --reload --port 8000   # 启动开发服务器
pytest                               # 运行测试
```

## TEXT-to-SQL 处理流程（规划）

```
用户输入自然语言
       │
       ▼
  FastAPI 接收请求
       │
       ▼
  LLM 生成 SQL（含表结构上下文、few-shot 示例）
       │
       ▼
  SQL 安全校验 & 执行（通过 SQLAlchemy）
       │
       ▼
  结果格式化 & 返回 JSON
```

## API 设计约定

- 路由前缀统一使用 `/api/`
- 请求/响应使用 JSON 格式
- 使用 Pydantic models 定义请求体和响应体
- 错误响应统一格式：`{"detail": "error message"}`

## 数据库集成

- 使用 SQLAlchemy 2.0 风格（`select()` + `execute()`）
- 数据库连接通过 `config.yaml` 或环境变量注入，一行不改代码切换库
- 支持多数据库方言（SQLite 开发，PostgreSQL/MySQL/MSSQL 生产），prompt 自动注入目标库方言规则，SQL 输出后校验方言兼容性
- 启动时自动扫描 `information_schema` 生成表/字段/关系摘要，向量化存入本地索引供 LLM 检索，表结构零硬编码

## 自进化记忆

- 记忆模型字段：`original_question`, `original_sql`, `user_feedback`, `corrected_sql`, `question_embedding`, `scope`（`global`/`schema`/`user`）
- `scope=schema` 的记忆绑定当前数据库 schema hash，切换数据库后隔离，防止旧库修正污染
- `scope=global` 的记忆（如 SQL 写法技巧）跨库保留
- 每次 LLM 生成 SQL 前，用当前问题向量检索 Top-K 相似记忆注入 prompt
