import * as vscode from 'vscode';

export class HtmlBuilder {
  constructor(
    private readonly webview: vscode.Webview,
    private readonly extensionUri: vscode.Uri
  ) {}

  private _getUri(path: string): vscode.Uri {
    const onDiskPath = vscode.Uri.joinPath(this.extensionUri, path);
    return this.webview.asWebviewUri(onDiskPath);
  }

  public build(): string {
    const styleUri = this._getUri('media/styles.css');
    const scriptUri = this._getUri('media/script.js');
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${this.webview.cspSource} https: data:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet" />
  <title>Code Inspector</title>
</head>
<body>
  <div class="inspector-container">
    <header class="inspector-header">
      <div class="inspector-header-left">
        <div class="inspector-logo-badge">CI</div>
        <div>
          <h1 class="inspector-title">Code Inspector</h1>
          <div class="inspector-subtitle" id="targetFile">No file selected</div>
        </div>
      </div>
      <div id="statusBadge" class="status-badge ready">Ready</div>
    </header>

    <div id="metricBar" class="metric-bar hidden">
      <div class="metric-card" id="metricBugs">
        <span class="metric-label">Bug Risks</span>
        <span class="metric-val" id="countBugs">0</span>
      </div>
      <div class="metric-card" id="metricComplexity">
        <span class="metric-label">Complexity</span>
        <span class="metric-val" id="scoreComplexity">0</span>
      </div>
      <div class="metric-card" id="metricNaming">
        <span class="metric-label">Naming</span>
        <span class="metric-val" id="countNaming">0</span>
      </div>
      <div class="metric-card" id="metricRefactors">
        <span class="metric-label">Refactors</span>
        <span class="metric-val" id="countRefactors">0</span>
      </div>
    </div>

    <!-- Live streaming buffer view -->
    <div id="streamSection" class="stream-section hidden">
      <div class="stream-header">
        <div class="pulse-indicator"></div>
        <span>Streaming Claude Review...</span>
      </div>
      <div id="streamConsole" class="stream-console"></div>
    </div>

    <!-- Structured Sections -->
    <div id="reviewSections" class="review-sections">
      <section id="sectionBugs" class="review-group hidden">
        <h2 class="group-title">🚨 Bug Risks</h2>
        <div id="bugsContainer" class="cards-list"></div>
      </section>

      <section id="sectionComplexity" class="review-group hidden">
        <h2 class="group-title">⚡ Complexity Analysis</h2>
        <div id="complexityContainer" class="cards-list"></div>
      </section>

      <section id="sectionNaming" class="review-group hidden">
        <h2 class="group-title">🏷️ Naming Improvements</h2>
        <div id="namingContainer" class="cards-list"></div>
      </section>

      <section id="sectionRefactors" class="review-group hidden">
        <h2 class="group-title">🛠️ Refactor Suggestions</h2>
        <div id="refactorsContainer" class="cards-list"></div>
      </section>
    </div>

    <div id="emptyState" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">Highlight code and press <kbd>Ctrl+Shift+K</kbd> or right-click to run <strong>Code Inspector</strong>.</p>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
