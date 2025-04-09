import * as vscode from 'vscode';
import * as fs from 'fs';

export function registerDiagnostics(context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('uv');

    async function refreshDiagnostics(document: vscode.TextDocument) {
        if (!document.fileName.endsWith('pyproject.toml')) return;

        const pyprojectText = document.getText();
        const depMatches = [...pyprojectText.matchAll(/\[dependencies\](.*?)(\n\[|\n*$)/gs)];
        const allDeps = depMatches.flatMap(match => match[1].match(/([a-zA-Z0-9_-]+)\s*=\s*["'][^"']+["']/g) || []);
        const depNames = allDeps.map(dep => dep.split('=')[0].trim());

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) return;

        const lockPath = vscode.Uri.joinPath(workspaceFolder.uri, 'uv.lock');
        if (!fs.existsSync(lockPath.fsPath)) return;

        const lockText = fs.readFileSync(lockPath.fsPath, 'utf-8');
        const missingDeps = depNames.filter(dep => !lockText.includes(dep));

        const diagnostics = missingDeps.map(dep => {
            const index = document.getText().indexOf(dep);
            const position = document.positionAt(index);
            const range = new vscode.Range(position, position.translate(0, dep.length));
            return new vscode.Diagnostic(range, `Dependency "${dep}" missing from uv.lock`, vscode.DiagnosticSeverity.Warning);
        });

        diagnosticCollection.set(document.uri, diagnostics);
    }

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(refreshDiagnostics)
    );
}
