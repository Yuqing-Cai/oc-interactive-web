# OC命运生成器（oc-interactive-web）

一个开箱即玩的 OC 轴选择网页：
- 至少选择 3 项轴要素
- 自动识别模式：
  - 未选 F/X/T/G → **开场静态模式**
  - 选了 F/X/T/G 任一 → **完整时间线骨架模式（细节留白）**
- 输出玩家上帝视角 + MC 视角信息

---

## 直接使用（推荐）

无需部署，直接打开：

**https://yuqing-cai.github.io/oc-interactive-web/**

使用步骤：
1. 填 Worker API 地址（一次保存，后续自动记住）
2. 选模型（默认 MiniMax-M2.5）
3. 勾选轴（至少 3 项）
4. 点击生成

> 你只想“直接玩”，看到这里就够了。

---

## 项目结构（给维护者）

- `index.html` / `styles.v5.css` / `app.v5.js`：前端页面
- `worker/index.js`：后端代理与生成逻辑（含静默校验/修复）
- `OC.md`：原始轴文档

---

## 可选：自建后端（只有你要换 Key 或改模型时才需要）

### 1) 准备

```bash
npm install -g wrangler
cd /home/lnln/.openclaw/workspace/oc-interactive-web/worker
wrangler login
```

### 2) 配置 Key

```bash
wrangler secret put OPENAI_API_KEY
```

### 3) （可选）配置 OpenAI 兼容地址

编辑 `worker/wrangler.toml`：

```toml
[vars]
OPENAI_API_URL = "https://api.minimax.chat/v1/chat/completions"
```

### 4) 部署

```bash
wrangler deploy
```

部署后把返回的 `/generate` 地址贴回前端即可。

---

## 当前生成规则（简版）

- 同样输入可能产生不同男主；每次返回其中一种高完成度实现。
- 如果结构/信息密度不足，Worker 会静默二次修复。
- 修复过程不会显示给玩家，玩家只会看到最终成稿。

---

## 常见问题

### Q1: 我只是普通用户，不会命令行，怎么办？
A: 直接用 Pages 链接即可，不需要部署。

### Q2: 为什么我改了代码但网页没变化？
A: 通常是缓存。可以加版本参数访问，如 `?v=commitid`，或改资源文件名（v5/v6）。

### Q3: 生成结果太短/漏段落怎么办？
A: 先确认 Worker 已部署最新版本；当前版本已带静默校验与自动修复。
