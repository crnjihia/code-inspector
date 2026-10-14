import * as assert from 'assert';
import * as vscode from 'vscode';

export async function runAll(): Promise<void> {
  testExtensionActivation();
  testRegisteredCommands();
}

export function testExtensionActivation() {
  const extension = vscode.extensions.getExtension('your-publisher-id.code-inspector') ||
                    vscode.extensions.all.find(ext => ext.id.includes('code-inspector') || ext.id.includes('kagua-dev-tool'));
  assert.ok(extension !== undefined, 'Code Inspector extension should be found');
}

export async function testRegisteredCommands() {
  const commands = await vscode.commands.getCommands(true);
  const inspectorCommands = [
    'codeInspector.reviewSelection',
    'codeInspector.reviewFile',
    'codeInspector.refactor',
    'codeInspector.clearCache',
    'kagua.review',
    'kagua.reviewSelection',
    'kagua.reviewFile',
    'kagua.refactor',
    'kagua.clearCache'
  ];

  for (const cmd of inspectorCommands) {
    assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
  }
}
