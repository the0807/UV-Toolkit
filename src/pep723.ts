import * as vscode from 'vscode';
import * as os from 'os';
import { execFile } from 'child_process';
import { parsePep723Metadata, buildUvExecEnv } from './utils';

// Cache processed files to avoid re-running on every editor switch.
// Cleared on save so updated PEP 723 metadata is picked up.
const processedFiles = new Set<string>();

export function registerPep723Provider(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(handleDocument),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) { handleDocument(editor.document); }
        }),
        vscode.workspace.onDidSaveTextDocument(document => {
            if (document.fileName.endsWith('.py')) {
                processedFiles.delete(document.fileName);
            }
        }),
        vscode.commands.registerCommand('uv.setPep723Interpreter', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !editor.document.fileName.endsWith('.py')) {
                vscode.window.showWarningMessage('Open a Python script with a PEP 723 block first.');
                return;
            }
            const metadata = parsePep723Metadata(editor.document.getText());
            if (!metadata?.requiresPython) {
                vscode.window.showWarningMessage('No PEP 723 requires-python found in this file.');
                return;
            }
            await setInterpreterForPep723(editor.document, metadata.requiresPython);
        })
    );
}

async function handleDocument(document: vscode.TextDocument) {
    if (!document.fileName.endsWith('.py')) { return; }
    if (processedFiles.has(document.fileName)) { return; }

    const metadata = parsePep723Metadata(document.getText());
    if (!metadata?.requiresPython) { return; }

    processedFiles.add(document.fileName);
    await setInterpreterForPep723(document, metadata.requiresPython);
}

async function setInterpreterForPep723(
    document: vscode.TextDocument,
    requiresPython: string
): Promise<void> {
    return new Promise<void>((resolve) => {
        const env = buildUvExecEnv(process.env, process.platform, os.homedir());
        execFile('uv', ['python', 'find', requiresPython], { env }, (error, stdout, stderr) => {
            if (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    vscode.window.showErrorMessage('uv is not installed or not in PATH.');
                } else {
                    const isNotFound = stderr.toLowerCase().includes('no interpreter') ||
                                       stderr.toLowerCase().includes('not found');
                    if (isNotFound) {
                        vscode.window.showWarningMessage(
                            `Python ${requiresPython} not found. Run 'uv python install ${requiresPython}' first.`
                        );
                    } else {
                        vscode.window.showErrorMessage(`uv error: ${stderr || error.message}`);
                    }
                }
                resolve();
                return;
            }

            const interpreterPath = stdout.trim();
            if (!interpreterPath) { resolve(); return; }

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
            const target = workspaceFolder
                ? vscode.ConfigurationTarget.WorkspaceFolder
                : vscode.ConfigurationTarget.Global;
            const scope = workspaceFolder?.uri;

            vscode.workspace.getConfiguration('python', scope)
                .update('defaultInterpreterPath', interpreterPath, target)
                .then(() => {
                    const versionMatch = interpreterPath.match(/cpython-(\d+\.\d+)/);
                    const label = versionMatch ? versionMatch[1] : requiresPython;
                    vscode.window.showInformationMessage(
                        `Python ${label} interpreter set for PEP 723 script.`
                    );
                    resolve();
                }, (err: Error) => {
                    vscode.window.showErrorMessage(`Failed to set interpreter: ${err.message}`);
                    resolve();
                });
        });
    });
}
