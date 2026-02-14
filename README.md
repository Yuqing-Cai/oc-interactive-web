# oc-interactive-web

一个可互动的 OC 轴选择网页：
- 用户自由多选轴要素（至少 3 项）
- 调用 OpenAI 兼容接口（可接 MiniMax M2.5）
- 生成“男主初始静态状态” + “MC基础身份（留白）”

## 目录结构

- `index.html` / `styles.css` / `app.js`：前端静态页面（可部署 GitHub Pages）
- `worker/index.js`：Cloudflare Worker 后端（保存 API Key，代理调用 LLM）
- `worker/wrangler.toml`：Worker 配置
- `OC.md`：你的原始设定文档

## 一次性准备

1. 安装 Node.js（推荐 18+）
2. 安装 Wrangler

```bash
npm install -g wrangler
```

3. 登录 Cloudflare

```bash
cd worker
wrangler login
```

## 部署后端（Cloudflare Workers）

在 `worker/` 下设置密钥：

```bash
wrangler secret put OPENAI_API_KEY
```

粘贴你的 MiniMax Key 回车保存。

如果你的 OpenAI 兼容地址不是默认值，可编辑 `worker/wrangler.toml`：

```toml
[vars]
OPENAI_API_URL = "https://api.minimax.chat/v1/chat/completions"
```

部署：

```bash
wrangler deploy
```

部署完成后会得到 URL，例如：
`https://oc-interactive-web-api.<subdomain>.workers.dev/generate`

## 部署前端（GitHub Pages）

本仓库前端是纯静态文件，直接启用 Pages：

1. GitHub 仓库 -> Settings -> Pages
2. Build and deployment 选择 `Deploy from a branch`
3. Branch 选 `main` + `/ (root)`
4. Save

几分钟后会有一个页面地址。

## 使用

打开网页后：
1. 在“Worker API 地址”填：`https://...workers.dev/generate`
2. 模型名默认 `MiniMax-M2.5`（可按你的接口要求改）
3. 勾选至少 3 个轴要素
4. 点击“生成初始剧本”

## 本地预览

直接用任何静态服务器都行，例如：

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 注意事项

- 不要把 API Key 放在前端。
- 前端只请求 Worker，Key 仅保存在 Worker secret。
- 若出现 CORS/401，优先检查：
  - Worker 是否重新部署
  - `OPENAI_API_KEY` 是否设置正确
  - `OPENAI_API_URL` 是否符合你供应商格式
