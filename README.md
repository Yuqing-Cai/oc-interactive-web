# OC 命运生成器 v3

一个面向原创角色与关系创作的命运编织工具。它把人物设计拆成 16 个叙事轴与 1 个文字调色板，并将已选轴组织成可见的因果线，而不只是把若干标签拼成提示词。

> v3 正在开发中。当前版本优先完成轴选择、因果推导、双语界面、结果工作台与安全的 API 接入边界；真实模型尚未接入。

## 当前能做什么

- 以「处境 → 内核 → 关系 → 命运 → 调色」五章组织 16+1 个轴。
- 随选择逐步形成命运主干、分支、缺口与生成模式。
- 支持中文 / English、随机起步、补全因果缺口、全量重掷与撤销。
- 在开发或预览构建中生成确定性的本地样稿，用来完整体验流程与检查界面。
- 为将来的默认体验与自定义模型接入保留明确、互不混用的配置边界。

## API 状态（重要）

目前没有接入任何付费 API，也没有默认提供商、默认模型或内置 Key：

- **默认体验**：配置暂留空；正式构建会在未配置服务端能力时关闭真实生成，不会静默回退到旧接口。
- **自定义体验（BYOK）**：提供商注册表暂留空，因此提供商、模型 ID 与 Key 输入当前不可用；等确定供应商并完成适配器后再开放。
- **预览样稿**：开发环境默认可用；若要发布可体验的静态预览，可显式设置 `VITE_ENABLE_MOCK_GENERATION=true`。样稿完全在浏览器本地、按当前选择确定性生成，不联网，也不冒充大模型输出。

### Key 的保存与安全边界

自定义体验开放后，Key 只会进入当前页面的内存，不写入 `localStorage`、`sessionStorage`、Cookie、IndexedDB 或应用日志；刷新、离开页面或主动清除时即失效。安全提示必须与输入框同时展示。

但浏览器内 BYOK **不等同于服务端保管密钥**：Key 在一次调用期间仍存在于页面内存和网络请求中，可能受到恶意扩展、被注入的脚本、受损设备或供应商端日志策略影响。使用者应当使用限额、可撤销、用途单一的 Key；默认体验的项目方 Key 只能放在服务端，绝不能写进前端构建产物。

开放任一 BYOK 提供商前，还必须同时确认其浏览器 CORS 支持，并把经过审核的接口域名加入页面的 `connect-src` 白名单；只登记名称而未完成这两项时，生成入口仍应保持关闭。

## 本地开发

要求 Node.js `^20.19.0` 或 `>=22.12.0`，包管理器为 pnpm 10。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Vite 会输出本地访问地址。开发环境启用确定性本地样稿，不需要 API Key。

常用检查：

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

`pnpm build` 默认构建真实发布形态：没有 API 配置时，生成入口保持关闭。若只想生成一份可交互的在线预览包，可临时启用本地样稿：

```bash
# macOS / Linux
VITE_ENABLE_MOCK_GENERATION=true pnpm build

# PowerShell
$env:VITE_ENABLE_MOCK_GENERATION = "true"; pnpm build
```

复制 `.env.example` 为 `.env.local` 也可以控制该开关。不要在任何 `VITE_` 变量中存放密钥——它们会被打进浏览器可读的前端代码。

## GitHub Pages 子路径预览

Vite 使用相对资源路径（`base: "./"`），因此构建结果可以放在 Pages 站点的子目录，不必替换现有首页。例如，把启用样稿后的 `dist/` 内容发布到 Pages 来源分支的 `v3-preview/` 目录，预览地址将是：

```text
https://yuqing-cai.github.io/oc-fate-generator/v3-preview/
```

该目录只是发布产物；源码仍在正常分支中维护。正式上线真实模型前，应关闭样稿开关并先完成服务端代理、速率限制、滥用防护与密钥管理。

## 项目结构

```text
.
├── src/
│   ├── api/          # 空配置、提供商注册表与短暂 Key 生命周期
│   ├── app/          # 页面状态、文案与本地预览生成
│   ├── domain/       # 轴数据、稳定 ID 与因果推导
│   ├── main.ts       # 应用入口
│   └── styles.css    # 响应式界面
├── index.html
├── vite.config.ts
├── tsconfig.json
└── docs/
```

## 设计资料

- [轴设计说明](docs/axis-design-guide.md)
- [cn-failure-atlas](https://github.com/Yuqing-Cai/cn-failure-atlas) — 生成质量约束的参考分类体系

## License

- Code: MIT
- Art / Content: Non-commercial, learning only

---

## English

OC Fate Generator v3 is a bilingual, structured character-and-relationship workbench built around 16 narrative axes plus one prose palette. Selected axes progressively form a visible causal thread.

The v3 API layer is intentionally empty: there is no bundled provider, model, project key, or legacy endpoint. Development mode—and preview builds made with `VITE_ENABLE_MOCK_GENERATION=true`—use deterministic local sample output with no network request. Future BYOK keys are transient in-memory values cleared on refresh or navigation, but browser-side BYOK must not be treated as equivalent to server-side secret storage.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

The relative Vite base allows `dist/` to be hosted beneath a GitHub Pages subpath such as `/oc-fate-generator/v3-preview/`.
