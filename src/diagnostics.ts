import * as vscode from 'vscode';
import * as fs from 'fs';
import { buildDiagnosticsFromText } from './utils';

export function registerDiagnostics(context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('uv');

    async function refreshDiagnostics(document: vscode.TextDocument) {
        if (!document.fileName.endsWith('pyproject.toml')) return;

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) return;

        const lockPath = vscode.Uri.joinPath(workspaceFolder.uri, 'uv.lock');
        if (!fs.existsSync(lockPath.fsPath)) return;

        const lockText = fs.readFileSync(lockPath.fsPath, 'utf-8');
        const missingDeps = buildDiagnosticsFromText(document.getText(), lockText);

        const diagnostics = missingDeps.map(dep => {
            const index = document.getText().indexOf(dep);
            const position = document.positionAt(index);
            const range = new vscode.Range(position, position.translate(0, dep.length));
            return new vscode.Diagnostic(range, `Dependency "${dep}" missing from uv.lock`, vscode.DiagnosticSeverity.Warning);
        });

        diagnosticCollection.set(document.uri, diagnostics);
    }

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(refreshDiagnostics),
        vscode.workspace.onDidOpenTextDocument(refreshDiagnostics)
    );
}
