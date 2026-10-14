# Code Inspector

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/your-publisher-id.code-inspector?style=for-the-badge&logo=visual-studio-code&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=your-publisher-id.code-inspector)
[![CI Build & Test](https://img.shields.io/github/actions/workflow/status/your-org/code-inspector/ci.yml?style=for-the-badge&label=Build%20%26%20Test)](https://github.com/your-org/code-inspector/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**Code Inspector** brings intelligent, streamed inline code review and one-click refactoring directly into VS Code. Powered by Claude (Anthropic API) and backed by a blazing-fast Node.js caching tier with Redis, Code Inspector identifies bug risks, pinpoints complexity hot spots, suggests idiomatic naming, and delivers one-click refactors via native `WorkspaceEdit` diffs.

---

## 🎬 Demo

![Code Inspector Review & Refactor Workflow](https://raw.githubusercontent.com/your-org/code-inspector/main/media/demo.gif)
*(Placeholder: Highlight any function, trigger `Ctrl+Shift+K`, watch suggestions stream in real-time, and click "Apply" to edit code instantly.)*

---

## ✨ Features

- **⚡ Live Streaming Review**: Suggestions stream directly into a side webview panel (`ViewColumn.Beside`) as tokens arrive from Claude.
- **🚨 Bug Risk Identification**: Automatic severity categorization (`HIGH`, `MEDIUM`, `LOW`) with concrete line references and proposed fix code.
- **⚡ Complexity Scoring**: Real-time complexity evaluation highlighting nested branches, cognitive load, and edge-case fragility.
- **🏷️ Naming Improvements**: Inline rename suggestions comparing current identifiers to clean, idiomatic alternatives with semantic rationale.
- **🛠️ One-Click Refactor**: One-click application of suggestions using VS Code's `WorkspaceEdit` API, opening comparison diffs so you stay in total control.
- **🗄️ SHA-256 Redis Caching**: Every review payload is hashed (`sha256(code + language + mode)`) and cached for 24 hours to eliminate redundant LLM invocations and latency.
- **🎨 Native VS Code Theme Integration**: Fluid UI matching your editor theme using native CSS variables (`--vscode-editor-background`, `--vscode-button-background`, etc.).

---

## ⌨️ Commands

| Command | Command Identifier | Default Shortcut | Where Available | Description |
|---|---|---|---|---|
| **Code Inspector: Review Selection** | `codeInspector.reviewSelection` | `Ctrl+Shift+K` (Win/Linux)<br>`Cmd+Shift+K` (Mac) | Editor Selection & Context Menu | Analyzes currently selected function or block |
| **Code Inspector: Review File** | `codeInspector.reviewFile` | Palette | Active Editor | Performs a full-file architecture and bug audit |
| **Code Inspector: Refactor** | `codeInspector.refactor` | Palette | Active Editor | Refactors highlighted code for maximum readability |
| **Code Inspector: Clear Review Cache**| `codeInspector.clearCache` | Palette | Command Palette | Clears both local and backend Redis caches |

### Context Menu Integration
Right-click on any highlighted code to invoke **Code Inspector: Review this function** directly from the context menu.

---

## ⚙️ Configuration Settings

Configure Code Inspector in **Settings** (`Ctrl+,` or `Cmd+,`) under **Extensions → Code Inspector Configuration**:

| Setting | Type | Default | Description |
|---|---|---|---|
| `codeInspector.apiUrl` | `string` | `http://localhost:3000` | URL of the Code Inspector Express backend service |
| `codeInspector.apiKey` | `string` | `""` | Bearer token for authenticating extension requests with the backend |

---

## 🚀 Backend Deployment Guide

The Code Inspector backend is built on Express, Node.js, and TypeScript, backed by Redis and the Anthropic Claude SDK.

### Prerequisites
- Docker & Docker Compose **or** Node.js 20+ and Redis 7+
- Anthropic Claude API Key (`ANTHROPIC_API_KEY`)

### Option A: Running with Docker Compose (Recommended)

1. Clone repository and create `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your environment variables:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   CODE_INSPECTOR_API_KEY=your-secure-internal-bearer-token
   REDIS_URL=redis://redis:6379
   PORT=3000
   ```
3. Start Redis and backend:
   ```bash
   docker-compose up -d
   ```
4. Verify health status:
   ```bash
   curl http://localhost:3000/health
   # Returns: {"status":"ok","service":"code-inspector-backend",...}
   ```

### Option B: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start backend in development mode (with in-memory cache fallback)
npm run start --workspace=backend
```

---

## 🔒 Privacy & Security Notice

- **Code Transmission**: Selected code snippets or files are sent exclusively to your configured Code Inspector backend (`codeInspector.apiUrl`) via TLS/HTTP.
- **Claude Processing**: The backend forwards code to Anthropic's Claude API for inference. Data is processed in accordance with Anthropic's commercial API terms (not used for model training).
- **Caching**: Review results are cached in Redis under a deterministic SHA-256 hash for 24 hours. No source code files are saved to persistent disk. Cache can be cleared on demand at any time with `Code Inspector: Clear Review Cache`.
- **Authentication**: Requests between the extension and backend are secured with Bearer token authentication and per-instance rate limiting (30 requests/minute).

---

## 🛠️ Monorepo Architecture

```
code-inspector/
├── extension/                 # VS Code Extension Host
│   ├── src/
│   │   ├── extension.ts       # Activation & command wiring
│   │   ├── commands/          # reviewSelection, reviewFile, refactor, clearCache
│   │   ├── webview/           # ReviewPanel & HtmlBuilder
│   │   ├── services/          # apiClient & local cache
│   │   └── utils/             # editor helpers & sha256 hash
│   ├── media/                 # styles.css, script.js, icon.png
│   ├── esbuild.js             # High-speed bundling
│   └── package.json           # Extension manifest & contributes
├── backend/                   # Express + TypeScript Server
│   ├── src/
│   │   ├── index.ts           # Express server & routes
│   │   ├── routes/            # /review & /refactor endpoints
│   │   ├── services/          # Claude API streaming & Redis cache
│   │   ├── middleware/        # Bearer auth & instance rate limiting
│   │   └── utils/             # Parser & sha256 hasher
│   ├── Dockerfile
│   └── package.json
├── tests/
│   ├── extension/             # Vitest unit tests & @vscode/test-electron suite
│   └── backend/               # Vitest route tests with mocked Claude
├── docker-compose.yml         # Redis + Backend multi-container setup
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## 🧪 Testing

```bash
# Run all unit tests across both workspaces
npm test

# Run linter
npm run lint
```

---

## 📄 License

MIT License © 2026 Code Inspector Team. See [LICENSE](LICENSE) for details.
