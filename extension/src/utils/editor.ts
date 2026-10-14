import * as vscode from 'vscode';

export function getApiUrl(): string {
  const codeConfig = vscode.workspace.getConfiguration('code');
  const inspectorConfig = vscode.workspace.getConfiguration('codeInspector');
  return (
    codeConfig.get<string>('apiUrl') ||
    inspectorConfig.get<string>('apiUrl') ||
    'http://localhost:3000'
  );
}

export function getApiKey(): string {
  const codeConfig = vscode.workspace.getConfiguration('code');
  const inspectorConfig = vscode.workspace.getConfiguration('codeInspector');
  return (
    codeConfig.get<string>('apiKey') ||
    inspectorConfig.get<string>('apiKey') ||
    ''
  );
}

export function getInstanceId(): string {
  return vscode.env.sessionId || vscode.env.machineId || 'vscode-code-inspector';
}

export interface SelectionInfo {
  code: string;
  range: vscode.Range;
  language: string;
  filePath: string;
}

export function getEditorSelection(editor: vscode.TextEditor): SelectionInfo | null {
  const document = editor.document;
  const selection = editor.selection;

  let range: vscode.Range;
  let code: string;

  if (!selection.isEmpty) {
    range = new vscode.Range(selection.start, selection.end);
    code = document.getText(range);
  } else {
    // If no text selected, try detecting current line or whole document
    const currentLine = document.lineAt(selection.active.line);
    range = currentLine.range;
    code = currentLine.text;
  }

  return {
    code,
    range,
    language: document.languageId,
    filePath: document.uri.fsPath
  };
}

export async function applyWorkspaceEdit(
  documentUri: vscode.Uri,
  range: vscode.Range,
  newText: string,
  description = 'Code Inspector Suggestion'
): Promise<boolean> {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(documentUri, range, newText);

  const success = await vscode.workspace.applyEdit(edit);
  if (success) {
    vscode.window.showInformationMessage(`Applied: ${description}`);
  } else {
    vscode.window.showErrorMessage(`Failed to apply: ${description}`);
  }
  return success;
}

export async function showDiff(
  originalUri: vscode.Uri,
  newText: string,
  title = 'Code Inspector Diff'
): Promise<void> {
  try {
    const untitledDoc = await vscode.workspace.openTextDocument({
      content: newText,
      language: vscode.window.activeTextEditor?.document.languageId || 'plaintext'
    });
    await vscode.commands.executeCommand('vscode.diff', originalUri, untitledDoc.uri, title);
  } catch (err) {
    console.warn('Could not show diff view:', err);
  }
}
