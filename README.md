# Code Inspector 🔍⚡

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/crnjihia.code-inspector?style=for-the-badge&logo=visual-studio-code&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=crnjihia.code-inspector)
[![CI Build & Test](https://img.shields.io/github/actions/workflow/status/crnjihia/code-inspector/ci.yml?style=for-the-badge&label=Build%20%26%20Test)](https://github.com/crnjihia/code-inspector/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Claude Powered](https://img.shields.io/badge/Anthropic-Claude--3.5--Sonnet-d97706.svg?style=for-the-badge)](https://anthropic.com)
[![Live Showcase](https://img.shields.io/badge/Live_Showcase-GitHub_Pages-00f0ff?style=for-the-badge&logo=github)](https://crnjihia.github.io/code-inspector/)

**Code Inspector** brings intelligent, streamed inline code review and one-click refactoring directly into Visual Studio Code. Powered by Claude 3.5 Sonnet and backed by a low-latency Node.js caching tier with Redis, Code Inspector detects critical bug risks, pinpoints complexity hot spots, suggests clean naming improvements, and applies refactors with native `WorkspaceEdit` diffs.

---

## 📸 Overview & Live Preview

![Code Inspector Inline Review & Webview Panel](media/screenshot.png)

*Highlight any function or file block, press `Ctrl+Shift+K`, and review streamed suggestions with instantaneous one-click fixes.*

---

## 🚀 Key Features

- **⚡ Real-Time Streaming Review**: Suggestions stream directly into an integrated side panel (`ViewColumn.Beside`) as tokens arrive from Claude via Server-Sent Events (SSE).
- **🚨 Intelligent Bug Risk Detection**: Automatic categorization into `HIGH`, `MEDIUM`, and `LOW` severity with exact line references, clear descriptions, and instant **Apply Fix** actions.
- **⚡ Cognitive Complexity Scoring**: Quantitative complexity analysis highlighting deeply nested conditional branches and fragile edge cases.
- **🏷️ Idiomatic Naming Refinements**: Identifies cryptic abbreviations or non-standard identifiers (`disc` → `discount`) with side-by-side diff previews and one-click **Apply Rename**.
- **🛠️ One-Click Refactoring**: Transforms functions into clean, declarative implementations using native `vscode.WorkspaceEdit`, automatically presenting comparison diffs.
- **🗄️ SHA-256 Redis Caching Layer**: Hashes inputs (`sha256(code + language + mode)`) and caches results for 24 hours to prevent redundant API calls and deliver sub-50ms repeat reviews.
- **🛡️ Built-in Offline Dev Fallback**: Includes realistic development stream fallback when running offline or without an Anthropic API key.
- **🎨 Native VS Code Theme Integration**: Fluid UI inheriting your editor's CSS variables (`--vscode-editor-background`, `--vscode-button-background`, etc.) for zero visual dissonance.

---

## 🏗️ Architecture

```mermaid
graph LR
    subgraph VS Code Extension
        Editor[Active Code Editor] -->|Ctrl+Shift+K| Client[Extension Client]
        Client -->|SSE Stream| Panel[Webview Side Panel]
        Panel -->|Apply Edits| WorkspaceEdit[WorkspaceEdit API]
        WorkspaceEdit -->|Updates Code| Editor
    end

    subgraph Backend Service
        Client -->|POST /review| API[Express Server]
        API -->|Check Hash| Cache[(Redis 7 Cache)]
        Cache -.->|Cache Hit| API
        API -->|Cache Miss| Claude[Claude 3.5 Sonnet API]
        Claude -->|Stream Tokens| API
        API -->|Store 24h TTL| Cache
    end
```

---

## ⌨️ Command Reference

| Command | Command Identifier | Default Shortcut | Context / Availability | Description |
|---|---|---|---|---|
| **Code Inspector: Review Selection** | `codeInspector.reviewSelection` | `Ctrl+Shift+K` (Win/Linux)<br>`Cmd+Shift+K` (macOS) | Active Editor Selection & Context Menu | Audits selected function or highlighted lines |
| **Code Inspector: Review File** | `codeInspector.reviewFile` | Command Palette | Active Editor | Performs full-file audit from top to bottom |
| **Code Inspector: Refactor** | `codeInspector.refactor` | Command Palette | Active Editor | Refactors highlighted function for readability |
| **Code Inspector: Clear Review Cache**| `codeInspector.clearCache` | Command Palette | Global | Clears both backend Redis and local caches |

### Context Menu Quick Action
Right-click on any selected block of code to invoke **"Code Inspector: Review this function"** directly from the editor context menu.

---

## ⚙️ Configuration

Configure settings in **VS Code Settings** (`Ctrl+,` or `Cmd+,`) under **Extensions → Code Inspector Configuration**:

| Setting | Type | Default | Description |
|---|---|---|---|
| `code.apiUrl` | `string` | `http://localhost:3000` | Backend API endpoint for Code Inspector service |
| `code.apiKey` | `string` | `""` | Bearer token for authenticating extension requests |
| `codeInspector.apiUrl` | `string` | `http://localhost:3000` | Alias for backend API endpoint |
| `codeInspector.apiKey` | `string` | `""` | Alias for backend API key |

---

## 🚀 Backend Quickstart

The Code Inspector backend is powered by Node.js, Express, TypeScript, Redis, and the Anthropic Claude SDK.

### Option A: Docker Compose (Production Ready)

1. Clone repository:
   ```bash
   git clone https://github.com/crnjihia/code-inspector.git
   cd code-inspector
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=3000
   ANTHROPIC_API_KEY=sk-ant-api03-...
   CODE_INSPECTOR_API_KEY=your-secure-bearer-token
   REDIS_URL=redis://redis:6379
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

4. Verify health:
   ```bash
   curl http://localhost:3000/health
   # Returns: {"status":"ok","service":"code-inspector-backend",...}
   ```

### Option B: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Build backend and extension
npm run build

# 3. Start backend in local dev mode (with automatic in-memory cache)
npm run start --workspace=backend
```

---

## 🧪 Testing

Code Inspector includes automated test suites covering backend routes, rate limiting, token streaming, and extension command utilities:

```bash
# Run unit tests across all workspaces
npm run test

# Run linter
npm run lint

# Build extension VSIX package
cd extension
npx @vscode/vsce package --no-git-tag-version
```

---

## 🔒 Privacy & Security

- **Direct Communication**: Code Inspector communicates solely with your configured backend URL (`code.apiUrl`). No third-party tracking or telemetry is included.
- **Token Protection**: Backend routes are protected with Bearer token authentication and rate-limited to 30 requests per minute per extension instance ID.
- **Cache Control**: All cached review JSON stored in Redis is indexed by SHA-256 hashes (`sha256(code + language + mode)`) and automatically expires after 24 hours. You can clear the cache on demand using `codeInspector.clearCache`.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Copyright © 2026 Christopher Njihia.
