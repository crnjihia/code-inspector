import * as vscode from 'vscode';
import { ApiClient } from '../services/apiClient';
import { getApiUrl, getApiKey, getInstanceId } from '../utils/editor';
import { clearLocalCache } from '../services/cache';

export async function registerClearCache(_context: vscode.ExtensionContext) {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  const instanceId = getInstanceId();
  const client = new ApiClient(apiUrl, apiKey, instanceId);

  try {
    clearLocalCache();
    await client.clearCache();
    vscode.window.showInformationMessage('Code Inspector: Review cache cleared successfully');
  } catch (e: any) {
    vscode.window.showErrorMessage(`Code Inspector: Failed to clear cache: ${e.message}`);
  }
}
