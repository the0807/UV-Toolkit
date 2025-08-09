import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

function runCommand(cmd: string) {
    vscode.window.showInformationMessage(`Running: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error: ${stderr}`);
            return;
        }
        vscode.window.showInformationMessage(stdout);
    });
}

export function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        { command: 'uv.init', callback: initProject },
        { command: 'uv.sync', callback: syncDependencies },
        { command: 'uv.upgrade', callback: () => runCommand('uv pip install --upgrade') },
        { command: 'uv.cache.clean', callback: () => runCommand('uv cache clean') },
        { command: 'uv.generateLock', callback: generateLockFile },
        { command: 'uv.upgradeDependencies', callback: upgradeDependencies },
        { command: 'uv.manageVirtualEnv', callback: manageVirtualEnv },
        { command: 'uv.runScript', callback: runScript },
        { command: 'uv.addScriptDependency', callback: addScriptDependency },
        { command: 'uv.installPython', callback: installPython },
        { command: 'uv.pinPython', callback: pinPython },
        { command: 'uv.installTool', callback: installTool },
        { command: 'uv.runTool', callback: runTool },
        { command: 'uv.add', callback: addPackageToProject },
        { command: 'uv.addDev', callback: addDevPackageToProject }
    ];

    for (const { command, callback } of commands) {
        context.subscriptions.push(vscode.commands.registerCommand(command, callback));
    }
}

// Initialize a new Python project
async function initProject() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // Ask for project name
    const projectName = await vscode.window.showInputBox({
        placeHolder: 'Project name',
        prompt: 'Enter the name of the project',
        value: path.basename(workspaceRoot)
    });
    
    if (!projectName) return;
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Init Project');
    terminal.show();
    terminal.sendText(`uv init ${projectName}`);
}

// Sync dependencies with advanced options
async function syncDependencies() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // Ask for sync options
    const options = await vscode.window.showQuickPick([
        { label: 'Basic sync', description: 'Sync dependencies with default options' },
        { label: 'Sync from specific file', description: 'Sync dependencies from a specific requirements file' },
        { label: 'Sync specific groups', description: 'Sync specific dependency groups' }
    ], {
        placeHolder: 'Select sync options'
    });

    if (!options) return;

    let command = 'uv sync';
    
    if (options.label === 'Sync from specific file') {
        // Get requirements files in the workspace
        const files = await vscode.workspace.findFiles('**/requirements*.txt', '**/venv/**');
        
        if (files.length === 0) {
            vscode.window.showErrorMessage('No requirements files found in the workspace.');
            return;
        }
        
        // Get relative paths for display
        const relativePaths = files.map(file => {
            return path.relative(workspaceRoot, file.fsPath);
        });
        
        // Ask user to select a requirements file
        const selectedFile = await vscode.window.showQuickPick(relativePaths, {
            placeHolder: 'Select a requirements file'
        });
        
        if (!selectedFile) return;
        
        command += ` ${selectedFile}`;
    } else if (options.label === 'Sync specific groups') {
        const groups = await vscode.window.showInputBox({
            placeHolder: 'Enter groups (comma-separated, e.g. dev,test)',
            prompt: 'Specify which dependency groups to sync'
        });
        
        if (groups) {
            const groupsList = groups.split(',').map(g => g.trim());
            for (const group of groupsList) {
                command += ` --group ${group}`;
            }
        }
    }

    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Sync');
    terminal.show();
    terminal.sendText(command);
}

// Add a package to the project
async function addPackageToProject() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // Ask for package name
    const packageName = await vscode.window.showInputBox({
        placeHolder: 'Package name',
        prompt: 'Enter the package name to add'
    });
    
    if (!packageName) return;
    
    // Ask for package version (optional)
    const packageVersion = await vscode.window.showInputBox({
        placeHolder: 'Version constraint (optional, e.g. >=1.0.0)',
        prompt: 'Enter version constraint (optional)'
    });
    
    // Ask for extras (optional)
    const extras = await vscode.window.showInputBox({
        placeHolder: 'Extras (optional, e.g. dev,test)',
        prompt: 'Enter extras to include (optional)'
    });
    
    // Build command
    let command = `uv add ${packageName}`;
    
    if (packageVersion) {
        command += `==${packageVersion}`;
    }
    
    if (extras) {
        command += `[${extras}]`;
    }
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Add Package');
    terminal.show();
    terminal.sendText(command);
}

// Add a dev package to the project
async function addDevPackageToProject() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // Ask for package name
    const packageName = await vscode.window.showInputBox({
        placeHolder: 'Package name',
        prompt: 'Enter the package name to add as a dev dependency'
    });
    
    if (!packageName) return;
    
    // Ask for package version (optional)
    const packageVersion = await vscode.window.showInputBox({
        placeHolder: 'Version constraint (optional, e.g. >=1.0.0)',
        prompt: 'Enter version constraint (optional)'
    });
    
    // Ask for extras (optional)
    const extras = await vscode.window.showInputBox({
        placeHolder: 'Extras (optional, e.g. dev,test)',
        prompt: 'Enter extras to include (optional)'
    });
    
    // Build command with --dev flag
    let command = `uv add --dev ${packageName}`;
    
    if (packageVersion) {
        command += `==${packageVersion}`;
    }
    
    if (extras) {
        command += `[${extras}]`;
    }
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Add Dev Package');
    terminal.show();
    terminal.sendText(command);
}

// Add inline dependencies to a script
async function addScriptDependency() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // Get Python files in the workspace
    const files = await vscode.workspace.findFiles('**/*.py', '**/venv/**');
    
    if (files.length === 0) {
        vscode.window.showErrorMessage('No Python files found in the workspace.');
        return;
    }
    
    // Get relative paths for display
    const relativePaths = files.map(file => {
        return path.relative(workspaceRoot, file.fsPath);
    });
    
    // Ask user to select a script
    const selectedScript = await vscode.window.showQuickPick(relativePaths, {
        placeHolder: 'Select a Python script'
    });
    
    if (!selectedScript) return;
    
    // Ask for package name
    const packageName = await vscode.window.showInputBox({
        placeHolder: 'Package name',
        prompt: 'Enter the package name to add as a dependency'
    });
    
    if (!packageName) return;
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Add Script Dependency');
    terminal.show();
    terminal.sendText(`uv add --script ${selectedScript} ${packageName}`);
}

// Install Python versions
async function installPython() {
    // Ask for Python version
    const pythonVersion = await vscode.window.showInputBox({
        placeHolder: 'Python version (e.g. 3.11, 3.12)',
        prompt: 'Enter Python version to install'
    });
    
    if (!pythonVersion) return;
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Python Install');
    terminal.show();
    terminal.sendText(`uv python install ${pythonVersion}`);
}

// Pin Python version for the current project
async function pinPython() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }
    
    // Ask for Python version
    const pythonVersion = await vscode.window.showInputBox({
        placeHolder: 'Python version (e.g. 3.11, 3.12)',
        prompt: 'Enter Python version to pin'
    });
    
    if (!pythonVersion) return;
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Python Pin');
    terminal.show();
    terminal.sendText(`uv python pin ${pythonVersion}`);
}

// Install a tool with uv
async function installTool() {
    // Ask for tool name
    const toolName = await vscode.window.showInputBox({
        placeHolder: 'Tool name (e.g. ruff, black)',
        prompt: 'Enter the name of the tool to install'
    });
    
    if (!toolName) return;
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Tool Install');
    terminal.show();
    terminal.sendText(`uv tool install ${toolName}`);
}

// Run a tool with uvx
async function runTool() {
    // Ask for tool name
    const toolName = await vscode.window.showInputBox({
        placeHolder: 'Tool name (e.g. ruff, black)',
        prompt: 'Enter the name of the tool to run'
    });
    
    if (!toolName) return;
    
    // Ask for tool arguments
    const toolArgs = await vscode.window.showInputBox({
        placeHolder: 'Arguments (optional)',
        prompt: 'Enter arguments for the tool (optional)'
    });
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UVX Run Tool');
    terminal.show();
    terminal.sendText(`uvx ${toolName}${toolArgs ? ' ' + toolArgs : ''}`);
}

// Upgrade dependencies
async function upgradeDependencies() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml');
    
    if (!fs.existsSync(pyprojectPath)) {
        vscode.window.showErrorMessage('pyproject.toml file not found.');
        return;
    }

    // Ask for upgrade options
    const options = await vscode.window.showQuickPick([
        { label: 'Upgrade all', description: 'Upgrade all dependencies to their latest versions' },
        { label: 'Upgrade specific package', description: 'Upgrade a specific package to its latest version' }
    ], {
        placeHolder: 'Select upgrade options'
    });

    if (!options) return;

    let command = 'uv pip compile pyproject.toml -o uv.lock';
    
    if (options.label === 'Upgrade all') {
        command += ' --upgrade';
    } else if (options.label === 'Upgrade specific package') {
        // Parse pyproject.toml to get the list of dependencies
        const pyprojectContent = fs.readFileSync(pyprojectPath, 'utf-8');
        const depMatches = pyprojectContent.match(/\[dependencies\](.*?)(\n\[|\n*$)/s);
        
        if (!depMatches || !depMatches[1]) {
            vscode.window.showErrorMessage('No dependencies found in pyproject.toml');
            return;
        }
        
        const depsSection = depMatches[1];
        const packageRegex = /([a-zA-Z0-9_-]+)\s*=\s*["'][^"']*["']/g;
        const packages: string[] = [];
        
        let match;
        while ((match = packageRegex.exec(depsSection)) !== null) {
            packages.push(match[1]);
        }
        
        if (packages.length === 0) {
            vscode.window.showErrorMessage('No packages found in dependencies.');
            return;
        }
        
        const selectedPackage = await vscode.window.showQuickPick(packages, {
            placeHolder: 'Select a package to upgrade'
        });
        
        if (!selectedPackage) return;
        
        command += ` --upgrade-package ${selectedPackage}`;
    }

    // Show progress notification
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Upgrading dependencies',
        cancellable: false
    }, async (progress) => {
        try {
            // Run uv pip compile command to upgrade dependencies
            await new Promise<void>((resolve, reject) => {
                exec(command, { cwd: workspaceRoot }, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(stderr));
                        return;
                    }
                    resolve();
                });
            });
            
            vscode.window.showInformationMessage('Dependencies upgraded successfully.');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to upgrade dependencies: ${error.message}`);
        }
    });
}

// Create and manage virtual environments
async function manageVirtualEnv() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // Ask for venv options
    const options = await vscode.window.showQuickPick([
        { label: 'Create venv', description: 'Create a new virtual environment' },
        { label: 'Create venv with specific Python', description: 'Create a virtual environment with a specific Python version' }
    ], {
        placeHolder: 'Select virtual environment options'
    });

    if (!options) return;

    let command = 'uv venv';
    
    if (options.label === 'Create venv with specific Python') {
        const pythonVersion = await vscode.window.showInputBox({
            placeHolder: 'Enter Python version (e.g. 3.11, 3.12)',
            prompt: 'Specify which Python version to use'
        });
        
        if (pythonVersion) {
            command += ` --python ${pythonVersion}`;
        }
    }

    // Show progress notification
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Creating virtual environment',
        cancellable: false
    }, async (progress) => {
        try {
            // Run uv venv command to create virtual environment
            await new Promise<void>((resolve, reject) => {
                exec(command, { cwd: workspaceRoot }, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(stderr));
                        return;
                    }
                    resolve();
                });
            });
            
            vscode.window.showInformationMessage('Virtual environment created successfully.');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create virtual environment: ${error.message}`);
        }
    });
}

// Run Python scripts with uv
async function runScript() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // Get Python files in the workspace
    const files = await vscode.workspace.findFiles('**/*.py', '**/venv/**');
    
    if (files.length === 0) {
        vscode.window.showErrorMessage('No Python files found in the workspace.');
        return;
    }
    
    // Get relative paths for display
    const relativePaths = files.map(file => {
        return path.relative(workspaceRoot, file.fsPath);
    });
    
    // Ask user to select a script
    const selectedScript = await vscode.window.showQuickPick(relativePaths, {
        placeHolder: 'Select a Python script to run'
    });
    
    if (!selectedScript) return;
    
    // Ask for Python version (optional)
    const usePythonVersion = await vscode.window.showQuickPick(['Use default Python', 'Specify Python version'], {
        placeHolder: 'Select Python version option'
    });
    
    let command = 'uv run';
    
    if (usePythonVersion === 'Specify Python version') {
        const pythonVersion = await vscode.window.showInputBox({
            placeHolder: 'Enter Python version (e.g. 3.11, 3.12)',
            prompt: 'Specify which Python version to use'
        });
        
        if (pythonVersion) {
            command += ` --python ${pythonVersion}`;
        }
    }
    
    command += ` ${selectedScript}`;
    
    // Show terminal and run the command
    const terminal = vscode.window.createTerminal('UV Run');
    terminal.show();
    terminal.sendText(command);
}

// Generate uv.lock file from pyproject.toml with advanced options
async function generateLockFile() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const pyprojectPath = path.join(workspaceRoot, 'pyproject.toml');
    
    if (!fs.existsSync(pyprojectPath)) {
        vscode.window.showErrorMessage('pyproject.toml file not found.');
        return;
    }

    // Ask for compile options
    const options = await vscode.window.showQuickPick([
        { label: 'Basic compile', description: 'Generate lock file with default options' },
        { label: 'Include all extras', description: 'Include all optional dependencies' },
        { label: 'Specify extras', description: 'Include specific optional dependencies' },
        { label: 'Specify groups', description: 'Compile specific dependency groups' }
    ], {
        placeHolder: 'Select compile options'
    });

    if (!options) return;

    let command = 'uv pip compile pyproject.toml -o uv.lock';
    
    if (options.label === 'Include all extras') {
        command += ' --all-extras';
    } else if (options.label === 'Specify extras') {
        const extras = await vscode.window.showInputBox({
            placeHolder: 'Enter extras (comma-separated, e.g. dev,test)',
            prompt: 'Specify which extras to include'
        });
        
        if (extras) {
            const extrasList = extras.split(',').map(e => e.trim());
            for (const extra of extrasList) {
                command += ` --extra ${extra}`;
            }
        }
    } else if (options.label === 'Specify groups') {
        const groups = await vscode.window.showInputBox({
            placeHolder: 'Enter groups (comma-separated, e.g. dev,test)',
            prompt: 'Specify which dependency groups to include'
        });
        
        if (groups) {
            const groupsList = groups.split(',').map(g => g.trim());
            for (const group of groupsList) {
                command += ` --group ${group}`;
            }
        }
    }

    // Show progress notification
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating uv.lock file',
        cancellable: false
    }, async (progress) => {
        try {
            // Run uv pip compile command to generate lock file
            await new Promise<void>((resolve, reject) => {
                exec(command, { cwd: workspaceRoot }, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(stderr));
                        return;
                    }
                    resolve();
                });
            });
            
            vscode.window.showInformationMessage('uv.lock file generated successfully.');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to generate uv.lock file: ${error.message}`);
        }
    });
}
