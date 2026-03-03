import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseDependencyNames } from './utils';

export function registerPackageManager(context: vscode.ExtensionContext) {
    // Register package remove command
    const removePackageDisposable = vscode.commands.registerCommand('uv.removePackage', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace is open.');
            return;
        }

        const pyprojectPath = path.join(workspaceFolders[0].uri.fsPath, 'pyproject.toml');
        if (!fs.existsSync(pyprojectPath)) {
            vscode.window.showErrorMessage('pyproject.toml file not found.');
            return;
        }

        const packages = parseDependencyNames(fs.readFileSync(pyprojectPath, 'utf-8'));
        if (packages.length === 0) {
            vscode.window.showInformationMessage('No packages found in dependencies.');
            return;
        }

        const selectedPackage = await vscode.window.showQuickPick(packages, {
            placeHolder: 'Select a package to remove'
        });
        if (!selectedPackage) return;

        const terminal = vscode.window.createTerminal('UV Remove Package');
        terminal.show();
        terminal.sendText(`uv remove ${selectedPackage}`);
    });

    context.subscriptions.push(removePackageDisposable);

    // Register package search command
    const searchPackageDisposable = vscode.commands.registerCommand('uv.searchPackage', async () => {
        // Check if workspace is open
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace is open.');
            return;
        }

        // Get search query
        const searchQuery = await vscode.window.showInputBox({
            placeHolder: 'Package name',
            prompt: 'Enter package name to search on PyPI'
        });

        if (!searchQuery) return;

        // Show progress while searching
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Searching for "${searchQuery}" on PyPI`,
            cancellable: false
        }, async (progress) => {
            try {
                // Use node-fetch or similar to search PyPI
                // This is a simplified example - in a real extension, you would use proper API calls
                const response = await fetch(`https://pypi.org/pypi/${searchQuery}/json`);
                
                if (response.ok) {
                    const data = await response.json() as any;
                    const latestVersion = data.info.version;
                    const description = data.info.summary;
                    
                    // Show package info and ask to add
                    const action = await vscode.window.showInformationMessage(
                        `${searchQuery} (${latestVersion}): ${description}`,
                        'Add to dependencies',
                        'Cancel'
                    );
                    
                    if (action === 'Add to dependencies') {
                        // Execute the add package command with pre-filled values
                        vscode.commands.executeCommand('uv.add', {
                            packageName: searchQuery,
                            packageVersion: latestVersion
                        });
                    }
                } else if (response.status === 404) {
                    vscode.window.showErrorMessage(`Package "${searchQuery}" not found on PyPI`);
                } else {
                    vscode.window.showErrorMessage(`Error searching PyPI: ${response.statusText}`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error searching PyPI: ${error.message}`);
            }
        });
    });

    context.subscriptions.push(searchPackageDisposable);
}
