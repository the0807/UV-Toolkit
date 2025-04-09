import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function registerPackageManager(context: vscode.ExtensionContext) {
    // Register package remove command
    const removePackageDisposable = vscode.commands.registerCommand('uv.removePackage', async () => {
        // Check if workspace is open
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace is open.');
            return;
        }

        // Find pyproject.toml file
        const pyprojectPath = path.join(workspaceFolders[0].uri.fsPath, 'pyproject.toml');
        
        if (!fs.existsSync(pyprojectPath)) {
            vscode.window.showErrorMessage('pyproject.toml file not found.');
            return;
        }

        // Read file content
        let content = fs.readFileSync(pyprojectPath, 'utf-8');
        
        // Extract packages from [dependencies] section
        const depMatches = content.match(/\[dependencies\](.*?)(\n\[|\n*$)/s);
        if (!depMatches || !depMatches[1]) {
            vscode.window.showInformationMessage('No dependencies found in pyproject.toml');
            return;
        }

        // Parse packages
        const depsSection = depMatches[1];
        const packageRegex = /([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/g;
        const packages: { name: string, version: string }[] = [];
        
        let match;
        while ((match = packageRegex.exec(depsSection)) !== null) {
            packages.push({
                name: match[1],
                version: match[2]
            });
        }

        if (packages.length === 0) {
            vscode.window.showInformationMessage('No packages found in dependencies.');
            return;
        }

        // Show quick pick with package names
        const selectedPackage = await vscode.window.showQuickPick(
            packages.map(pkg => `${pkg.name} (${pkg.version})`),
            { placeHolder: 'Select a package to remove' }
        );

        if (!selectedPackage) return;

        // Extract package name from selection
        const packageName = selectedPackage.split(' ')[0];

        // Remove package from dependencies
        const updatedContent = content.replace(
            /\[dependencies\](.*?)(\n\[|\n*$)/s,
            (match, deps, end) => {
                // Remove the package line
                const updatedDeps = deps.replace(
                    new RegExp(`\\s*${packageName}\\s*=\\s*["'][^"']*["']\\s*\\n?`, 'g'),
                    ''
                );
                return `[dependencies]${updatedDeps}${end}`;
            }
        );

        // Save file
        fs.writeFileSync(pyprojectPath, updatedContent);
        vscode.window.showInformationMessage(`Package ${packageName} removed`);
        
        // Update editor content if file is open
        const openDocuments = vscode.workspace.textDocuments;
        const pyprojectDoc = openDocuments.find(doc => doc.fileName === pyprojectPath);
        if (pyprojectDoc) {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                pyprojectDoc.uri,
                new vscode.Range(0, 0, pyprojectDoc.lineCount, 0),
                updatedContent
            );
            await vscode.workspace.applyEdit(edit);
        }
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
