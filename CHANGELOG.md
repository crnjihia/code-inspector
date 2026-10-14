# Changelog

All notable changes to the **Code Inspector** extension and backend service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-10-09

### Added
- **VS Code Extension Core**:
  - Activation on `onCommand:codeInspector.reviewSelection`, `onCommand:codeInspector.reviewFile`, `onCommand:codeInspector.refactor`, `onCommand:codeInspector.clearCache`, and lazy `onLanguage:*`.
  - Commands:
    - `codeInspector.reviewSelection`: Review highlighted block or enclosing function.
    - `codeInspector.reviewFile`: Review active document from top to bottom.
    - `codeInspector.refactor`: One-click refactor with instant code transformation.
    - `codeInspector.clearCache`: Clear backend Redis cache and local extension cache.
  - Editor context menu shortcut: "Code Inspector: Review this function" under editor selection context.
  - Default keybinding: `Ctrl+Shift+K` (Windows/Linux) and `Cmd+Shift+K` (macOS).
  - Configurable settings: `codeInspector.apiUrl` and `codeInspector.apiKey`.

- **Streaming Webview Side Panel**:
  - Side panel rendering in `ViewColumn.Beside` with persistent state.
  - Live Server-Sent Events (SSE) streaming updates with dynamic pulse indicator.
  - 4 structured review sections:
    - **Bug Risks**: High/Medium/Low severity badges, line indicator, code fix block, and "Apply Fix" button.
    - **Complexity Analysis**: Cognitive/cyclomatic complexity score and identified issues list.
    - **Naming Improvements**: Side-by-side rename diffs (`old` → `new`), line indicator, and "Apply Rename" button.
    - **Refactor Suggestions**: Range scope, reason, refactored code snippet, and "Apply Refactor" button.
  - Native VS Code theme styling adapting smoothly to any editor theme.
  - One-click fix application via `vscode.WorkspaceEdit` with diff comparison view.

- **Node.js & Express Backend**:
  - `POST /review`: Computes SHA-256 hash of code, queries Redis cache, streams Claude response on cache miss, caches parsed JSON for 24 hours.
  - `POST /refactor`: Calls Claude model to refactor function with clean formatting.
  - `GET /health`: Health-check endpoint returning uptime and service status.
  - `POST /cache/clear`: Flushes Redis and in-memory caches.
  - Redis cache with graceful in-memory fallback for offline or local dev.
  - Rate limiting middleware: 30 requests/minute per extension instance ID.
  - Bearer token authentication middleware for API protection.

- **Developer Experience & Infrastructure**:
  - Dual workspace setup (extension + backend monorepo).
  - esbuild bundling for near-instant extension builds.
  - Dockerfile and multi-container `docker-compose.yml` (Redis 7 + Node.js 20).
  - Full test suite: Vitest for backend routes and extension units, `@vscode/test-electron` runner for extension integration.
  - GitHub Actions CI (`.github/workflows/ci.yml`) and automated marketplace release pipeline (`.github/workflows/publish.yml`).
