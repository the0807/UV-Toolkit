import * as vscode from 'vscode';
import { registerLinkProvider } from './linkProvider';
import { registerCommands } from './commands';
import { registerDiagnostics } from './diagnostics';
import { registerPackageManager } from './packageManager';
import { registerLanguageModelTools } from './languageModelTools';

export function activate(context: vscode.ExtensionContext) {
    // Register providers
    registerLinkProvider(context);
    registerCommands(context);
    registerDiagnostics(context);
    registerPackageManager(context);
    
    // Register Language Model Tools for VS Code Copilot integration
    registerLanguageModelTools(context);
    
    // Register language configuration for pyproject.toml
    vscode.languages.setLanguageConfiguration('pyproject-toml', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
    });
}

export function deactivate() {}
