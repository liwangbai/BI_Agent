# Frontend — TEXT-TO-SQL BI Agent

Web 前端，提供自然语言输入界面，展示 ECharts 图表渲染的查询结果。

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 & 开发服务器 |
| ECharts (echarts-for-react) | 数据可视化图表 |
| pnpm | 包管理器 |

## 目录结构

```
frontend/
├── CLAUDE.md              # 本文件
├── package.json
├── vite.config.ts         # Vite 配置（含 API 代理）
├── tsconfig.json          # TS 项目引用
├── tsconfig.app.json      # 应用 TS 配置
├── tsconfig.node.json     # Node 端 TS 配置
├── index.html             # 入口 HTML
└── src/
    ├── main.tsx           # React 挂载入口
    ├── App.tsx            # 根组件
    └── vite-env.d.ts      # Vite 类型声明
```

## 开发命令

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器 (http://localhost:5173)
pnpm build      # 生产构建
pnpm preview    # 预览生产构建
```

## API 对接约定

- 前端通过 Vite proxy 转发 `/api/*` 到后端 `http://localhost:8000`
- 后端 API 返回 JSON 格式数据
- 请求/响应结构待业务开发时定义

## ECharts 集成方式

- 使用 `echarts-for-react` 封装组件
- ECharts 配置通过 `option` prop 传入
- 图表数据由后端 API 返回，前端转换为 ECharts option 格式

## 编码约定

- 使用 TypeScript 严格模式
- 组件使用函数组件 + Hooks
- 文件命名：组件用 PascalCase（如 `ChartView.tsx`），工具函数用 camelCase
