import * as vscode from 'vscode';
import { getApiUrl, getApiKey, getInstanceId, applyWorkspaceEdit, showDiff } from '../utils/editor';
import { ApiClient } from '../services/apiClient';

export async function registerRefactor(_context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('Code Inspector: No active text editor open');
    return;
  }

  const selection = editor.selection;
  const targetRange = !selection.isEmpty
    ? selection
    : new vscode.Range(0, 0, editor.document.lineCount, 0);

  const code = editor.document.getText(targetRange);
  if (!code.trim()) {
    vscode.window.showWarningMessage('Code Inspector: Selected code is empty');
    return;
  }

  const language = editor.document.languageId;
  const filePath = editor.document.uri.fsPath;

  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  const instanceId = getInstanceId();
  const client = new ApiClient(apiUrl, apiKey, instanceId);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Code Inspector: Refactoring code with Claude...',
      cancellable: false
    },
    async () => {
      try {
        const refactored = await client.refactor({ code, language, filePath });
        const success = await applyWorkspaceEdit(
          editor.document.uri,
          targetRange,
          refactored,
          'Claude Refactor'
        );

        if (success) {
          await showDiff(editor.document.uri, refactored, 'Refactored Result');
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Code Inspector: Refactor failed: ${err.message}`);
      }
    }
  );
}
