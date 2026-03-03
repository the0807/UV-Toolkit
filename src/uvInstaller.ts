import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { getInstallScript } from './utils';

// Prevents repeated prompts within the same VS Code session
let prompted = false;

/**
 * Checks whether uv is available in PATH.
 * Resolves true if found, false on ENOENT (not installed), rejects on other errors.
 */
export function isUvInstalled(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        execFile('uv', ['--version'], (error) => {
            if (!error) {
                resolve(true);
                return;
            }
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                resolve(false);
                return;
            }
            reject(error);
        });
    });
}

/**
 * Opens a terminal and runs the platform-specific install script.
 * Shows an info message offering to restart the window when done.
 */
export async function installUv(): Promise<void> {
    const script = getInstallScript(process.platform);
    if (!script) {
        vscode.window.showWarningMessage(
            'Unsupported platform. Install uv manually: https://docs.astral.sh/uv/'
        );
        return;
    }

    const terminal = vscode.window.createTerminal('uv Installer');
    terminal.show();
    terminal.sendText(script);

    const selection = await vscode.window.showInformationMessage(
        'uv installation started. Restart window when complete.',
        'Restart Window'
    );
    if (selection === 'Restart Window') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
}

/**
 * Checks whether uv is installed and, if not, prompts once per session.
 */
export async function checkAndPromptUvInstall(): Promise<void> {
    if (prompted) { return; }

    let installed: boolean;
    try {
        installed = await isUvInstalled();
    } catch {
        // Unexpected error — skip silently
        return;
    }

    if (installed) {
        prompted = true;
        return;
    }

    prompted = true;
    const selection = await vscode.window.showInformationMessage(
        'uv is not installed. Install now?',
        'Install',
        'Dismiss'
    );
    if (selection === 'Install') {
        await installUv();
    }
}

/**
 * Registers the manual `uv.installUv` command.
 */
export function registerUvInstaller(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('uv.installUv', async () => {
            let installed: boolean;
            try {
                installed = await isUvInstalled();
            } catch {
                installed = false;
            }

            if (installed) {
                vscode.window.showInformationMessage('uv is already installed.');
                return;
            }
            await installUv();
        })
    );
}
