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

  // Backward compatibility aliases
  context.subscriptions.push(
    vscode.commands.registerCommand('kagua.review', async () => {
      await registerReviewSelection(context);
    }),
    vscode.commands.registerCommand('kagua.reviewSelection', async () => {
      await registerReviewSelection(context);
    }),
    vscode.commands.registerCommand('kagua.reviewFile', async () => {
      await registerReviewFile(context);
    }),
    vscode.commands.registerCommand('kagua.refactor', async () => {
      await registerRefactor(context);
    }),
    vscode.commands.registerCommand('kagua.clearCache', async () => {
      await registerClearCache(context);
    })
  );
}

export function deactivate() {}
