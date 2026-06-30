import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { getInstallOptions } from './utils';

// Prevents repeated prompts within the same VS Code session
let prompted = false;

/**
 * Checks whether uv is available.
 *
 * When VS Code is launched from a GUI (app icon / desktop launcher) it does not
 * inherit the user's shell PATH, so tools installed via Homebrew (e.g.
 * /home/linuxbrew/.linuxbrew/bin on Linux, /opt/homebrew/bin on Apple Silicon)
 * or cargo (~/.cargo/bin) are invisible to a bare `execFile('uv', ...)`. To match
 * what the integrated terminal sees, detection runs through a login shell on
 * non-Windows platforms so rc/profile files (which set up brew/cargo PATH) load.
 *
 * Resolves true if found, false otherwise.
 */
export function isUvInstalled(): Promise<boolean> {
    if (process.platform === 'win32') {
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

    const shell = process.env.SHELL || '/bin/bash';
    return new Promise((resolve) => {
        // -l loads the login profile and -i loads interactive rc files
        // (~/.bashrc, ~/.zshrc), where brew/cargo add their PATH entries.
        // Detection is based on the shell exit code rather than stdout, because
        // interactive rc files often print banners/MOTD to stdout, which would
        // otherwise be mistaken for a successful `command -v` result.
        execFile(shell, ['-lic', 'command -v uv >/dev/null 2>&1'], (error) => {
            resolve(!error);
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
