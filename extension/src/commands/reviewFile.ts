import * as vscode from 'vscode';
import { getApiUrl, getApiKey, getInstanceId } from '../utils/editor';
import { ReviewPanel } from '../webview/ReviewPanel';
import { ApiClient } from '../services/apiClient';

export async function registerReviewFile(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('Code Inspector: No active text editor open');
    return;
  }

  const code = editor.document.getText();
  if (!code.trim()) {
    vscode.window.showWarningMessage('Code Inspector: Current file is empty');
    return;
  }

  const language = editor.document.languageId;
  const filePath = editor.document.uri.fsPath;

  const panel = ReviewPanel.createOrShow(context.extensionUri);
  panel.updateTitle('Code Inspector Review — File');
  panel.setDocumentUri(editor.document.uri);
  panel.resetView('file', filePath);

  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  const instanceId = getInstanceId();
  const client = new ApiClient(apiUrl, apiKey, instanceId);

  await client.streamReview(
    { code, language, filePath, mode: 'file' },
    {
      onChunk: (chunk) => panel.appendChunk(chunk),
      onComplete: (data) => panel.setReviewData(data),
      onStatus: (status) => panel.setStatus(status),
      onError: (err) => panel.setError(err)
    }
  );
}
