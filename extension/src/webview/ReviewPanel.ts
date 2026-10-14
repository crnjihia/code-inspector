import * as vscode from 'vscode';
import { HtmlBuilder } from './HtmlBuilder';
import { applyWorkspaceEdit, showDiff } from '../utils/editor';

export class ReviewPanel {
  public static currentPanel: ReviewPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _currentDocumentUri: vscode.Uri | undefined;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };

    this._setHtml();

    // Listen for messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        await this._handleWebviewMessage(message);
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri): ReviewPanel {
    const column = vscode.ViewColumn.Beside;

    if (ReviewPanel.currentPanel) {
      ReviewPanel.currentPanel._panel.reveal(column);
      return ReviewPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'codeInspectorReview',
      'Code Inspector Review',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    ReviewPanel.currentPanel = new ReviewPanel(panel, extensionUri);
    return ReviewPanel.currentPanel;
  }

  public setDocumentUri(uri: vscode.Uri) {
    this._currentDocumentUri = uri;
  }

  public dispose() {
    ReviewPanel.currentPanel = undefined;
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }

  private _setHtml() {
    const html = new HtmlBuilder(this._panel.webview, this._extensionUri).build();
    this._panel.webview.html = html;
  }

  public resetView(mode: string, filePath: string) {
    this._panel.webview.postMessage({
      type: 'reset',
      mode,
      filePath
    });
  }

  public appendChunk(chunk: string) {
    this._panel.webview.postMessage({ type: 'chunk', text: chunk });
  }

  public setReviewData(data: any) {
    this._panel.webview.postMessage({ type: 'complete', data });
  }

  public setStatus(status: string) {
    this._panel.webview.postMessage({ type: 'status', status });
  }

  public setError(error: string) {
    this._panel.webview.postMessage({ type: 'error', error });
  }

  public updateTitle(title: string) {
    this._panel.title = title;
  }

  private async _handleWebviewMessage(message: any) {
    const activeEditor = vscode.window.activeTextEditor;
    const documentUri = this._currentDocumentUri || activeEditor?.document.uri;

    if (!documentUri) {
      vscode.window.showErrorMessage('No target document found to apply edits');
      return;
    }

    const document = await vscode.workspace.openTextDocument(documentUri);

    switch (message.command) {
      case 'applyBugFix': {
        const { line, fix, id } = message;
        const targetLine = Math.max(0, (parseInt(line, 10) || 1) - 1);
        if (targetLine < document.lineCount) {
          const lineObj = document.lineAt(targetLine);
          const success = await applyWorkspaceEdit(
            documentUri,
            lineObj.range,
            fix,
            `Fix bug at line ${line}`
          );
          if (success) {
            this._panel.webview.postMessage({ type: 'applied', id });
          }
        }
        break;
      }

      case 'applyRename': {
        const { line, current, suggested, id } = message;
        const targetLine = Math.max(0, (parseInt(line, 10) || 1) - 1);
        if (targetLine < document.lineCount) {
          const lineText = document.lineAt(targetLine).text;
          const charIndex = lineText.indexOf(current);
          if (charIndex !== -1) {
            const range = new vscode.Range(
              targetLine,
              charIndex,
              targetLine,
              charIndex + current.length
            );
            const success = await applyWorkspaceEdit(
              documentUri,
              range,
              suggested,
              `Rename '${current}' to '${suggested}'`
            );
            if (success) {
              this._panel.webview.postMessage({ type: 'applied', id });
            }
          }
        }
        break;
      }

      case 'applyRefactor': {
        const { code, id } = message;
        // If selection is present or replace active function / document
        const targetRange = activeEditor && !activeEditor.selection.isEmpty
          ? activeEditor.selection
          : new vscode.Range(0, 0, document.lineCount, 0);

        const success = await applyWorkspaceEdit(
          documentUri,
          targetRange,
          code,
          'Refactor suggestion'
        );

        if (success) {
          await showDiff(documentUri, code, 'Refactored Comparison');
          this._panel.webview.postMessage({ type: 'applied', id });
        }
        break;
      }
    }
  }
}
