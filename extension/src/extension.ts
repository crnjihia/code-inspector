import * as vscode from 'vscode';
import { registerReviewSelection } from './commands/reviewSelection';
import { registerReviewFile } from './commands/reviewFile';
import { registerRefactor } from './commands/refactor';
import { registerClearCache } from './commands/clearCache';

export function activate(context: vscode.ExtensionContext) {
  // Primary Code Inspector commands
  context.subscriptions.push(
    vscode.commands.registerCommand('codeInspector.reviewSelection', async () => {
      await registerReviewSelection(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeInspector.reviewFile', async () => {
      await registerReviewFile(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeInspector.refactor', async () => {
      await registerRefactor(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codeInspector.clearCache', async () => {
      await registerClearCache(context);
    })
  );

}

export function deactivate() {}
