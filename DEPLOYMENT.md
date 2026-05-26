# 部署指南

## 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器 | 阿里云轻量应用服务器 |
| IP | 112.74.44.125 |
| 域名 | wpyai.cn |
| 系统 | CentOS + 宝塔面板 |
| 项目路径 | /root/opt/bi-agent |
| Git 仓库 | https://github.com/liwangbai/BI_Agent.git |

## 部署架构

```
浏览器 (:443)
    │
    ▼
Nginx (:80) ──▶ FastAPI (:8000)
                    │
                    ├── /api/*     → API 逻辑
                    └── /*         → 前端静态文件 (Vite build)
```

前后端合并部署为一个 Docker 容器，FastAPI 托管前端静态文件。容器端口仅绑定 `127.0.0.1`，外部通过 Nginx 反向代理访问。

## 服务器环境

- Docker 已安装
- 宝塔面板管理 Nginx 和 SSL 证书

## 构建 & 部署流程

### 部署脚本

脚本位于 `/root/opt/bi-agent/deploy.sh`：

```bash
#!/bin/bash
set -e

cd /root/opt/bi-agent

echo ">>> 拉取最新代码..."
git pull origin main

echo ">>> 重新构建并启动服务..."
docker-compose up -d --build

echo ">>> 等待服务启动..."
sleep 5

if curl -sf http://localhost:8000/api/health > /dev/null; then
    echo ">>> 部署成功! 服务已就绪"
else
    echo ">>> 警告: 健康检查未通过，请检查日志"
    docker-compose logs --tail=50 app
    exit 1
fi
```

```bash
chmod +x /root/opt/bi-agent/deploy.sh
```

### 更新流程

1. 本地修改代码，commit 并 push：
   ```bash
   git add .
   git commit -m "描述改动"
   git push origin main
   ```

2. SSH 到服务器执行部署：
   ```bash
   ssh root@112.74.44.125
   /root/opt/bi-agent/deploy.sh
   ```

### 仅重启（不重新构建）

```bash
cd /root/opt/bi-agent
docker-compose restart
```

### 首次部署

```bash
git clone https://github.com/liwangbai/BI_Agent.git /root/opt/bi-agent
cd /root/opt/bi-agent
cp .env.example .env
vim .env
# 构建前端
cd frontend && pnpm install && pnpm build && cd ..
docker-compose up -d
```

## 环境变量

环境变量通过 `/root/opt/bi-agent/.env` 文件配置：

```bash
# .env 文件
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_DIALECT=postgresql
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Nginx 配置

Nginx 配置由宝塔面板管理。主站点配置位于 `/www/server/panel/vhost/nginx/wpyai.cn.conf`，为 BI Agent 新增路由：

```nginx
# BI Agent 路由（追加到现有 wpyai.cn 配置中）
location /bi {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

```bash
# 修改后重载
nginx -t && systemctl reload nginx
```

## Docker Compose

```yaml
# /root/opt/bi-agent/docker-compose.yml
services:
  app:
    build: ./backend
    container_name: bi-agent
    ports:
      - "127.0.0.1:8000:8000"
    env_file:
      - .env
    restart: always
    volumes:
      - ./backend/app:/app/app:ro
```

## 故障排查

```bash
# 容器是否运行
docker ps | grep bi-agent

# 服务日志
docker-compose logs -f --tail=100 app

# 端口是否在监听
ss -tlnp | grep 8000

# 本地测试接口
curl http://localhost:8000/api/health

# Nginx 日志
tail -f /www/wwwlogs/wpyai.cn.log
tail -f /www/wwwlogs/wpyai.cn.error.log

# 容器资源占用
docker stats bi-agent
```

## 注意事项

- 宝塔面板管理 SSL 证书自动续签，不要手动改证书文件
- 修改 Nginx 配置时不要影响已有的 `/ws` 和 `/api/v1` 路由
- 容器端口仅绑定 `127.0.0.1`，必须通过 Nginx 访问，不要改为 `0.0.0.0`
