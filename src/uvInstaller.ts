import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { getInstallOptions } from './utils';

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
 * Shows a QuickPick with platform-specific installation methods and runs the selected one.
 */
export async function installUv(): Promise<void> {
    const options = getInstallOptions(process.platform);

    if (options.length === 0) {
        vscode.window.showWarningMessage(
            'Unsupported platform. Install uv manually: https://docs.astral.sh/uv/'
        );
        return;
    }

    const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an installation method for uv',
    });

    if (!selected) {
        return;
    }

    const terminal = vscode.window.createTerminal('uv Installer');
    terminal.show();
    terminal.sendText(selected.command);

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
