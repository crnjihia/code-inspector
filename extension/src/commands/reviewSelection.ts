import * as vscode from 'vscode';
import { getApiUrl, getApiKey, getInstanceId, getEditorSelection } from '../utils/editor';
import { ReviewPanel } from '../webview/ReviewPanel';
import { ApiClient } from '../services/apiClient';

export async function registerReviewSelection(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('Code Inspector: No active text editor open');
    return;
  }

  const selectionInfo = getEditorSelection(editor);
  if (!selectionInfo || !selectionInfo.code.trim()) {
    vscode.window.showWarningMessage('Code Inspector: Please highlight code or place cursor inside a function to review');
    return;
  }

  const { code, language, filePath } = selectionInfo;

  const panel = ReviewPanel.createOrShow(context.extensionUri);
  panel.updateTitle('Code Inspector Review — Selection');
  panel.setDocumentUri(editor.document.uri);
  panel.resetView('selection', filePath);

  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  const instanceId = getInstanceId();
  const client = new ApiClient(apiUrl, apiKey, instanceId);

  await client.streamReview(
    { code, language, filePath, mode: 'selection' },
    {
      onChunk: (chunk) => panel.appendChunk(chunk),
      onComplete: (data) => panel.setReviewData(data),
      onStatus: (status) => panel.setStatus(status),
      onError: (err) => panel.setError(err)
    }
  );
}
