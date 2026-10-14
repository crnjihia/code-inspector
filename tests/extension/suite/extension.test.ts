import * as assert from 'assert';
import * as vscode from 'vscode';

export async function runAll(): Promise<void> {
  testExtensionActivation();
  testRegisteredCommands();
}

export function testExtensionActivation() {
  const extension = vscode.extensions.getExtension('crnjihia.code-inspector') ||
                    vscode.extensions.all.find(ext => ext.id.includes('code-inspector'));
  assert.ok(extension !== undefined, 'Code Inspector extension should be found');
}

export async function testRegisteredCommands() {
  const commands = await vscode.commands.getCommands(true);
  const inspectorCommands = [
    'codeInspector.reviewSelection',
    'codeInspector.reviewFile',
    'codeInspector.refactor',
    'codeInspector.clearCache'
  ];

  for (const cmd of inspectorCommands) {
    assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
  }
}
