import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Tool parameter interfaces
export interface InitProjectParams {
    projectName?: string;
}

export interface SyncDependenciesParams {
    syncType?: 'basic' | 'from-file' | 'groups';
    requirementsFile?: string;
    groups?: string;
}

export interface AddPackageParams {
    packageName: string;
    version?: string;
    extras?: string;
}

export interface AddDevPackageParams {
    packageName: string;
    version?: string;
    extras?: string;
}

export interface UpgradePackagesParams {
    upgradeType?: 'all' | 'specific';
    packageName?: string;
}

export interface CleanCacheParams {
    // No parameters needed
}

export interface GenerateLockParams {
    includeExtras?: 'none' | 'all' | 'specific';
    extras?: string;
    groups?: string;
}

export interface CreateVenvParams {
    pythonVersion?: string;
}

export interface RunScriptParams {
    scriptPath: string;
    pythonVersion?: string;
}

export interface AddScriptDependencyParams {
    scriptPath: string;
    packageName: string;
}

export interface InstallPythonParams {
    pythonVersion: string;
}

export interface PinPythonParams {
    pythonVersion: string;
}

export interface InstallToolParams {
    toolName: string;
}

export interface RunToolParams {
    toolName: string;
    arguments?: string;
}

export interface ActivateVirtualEnvParams {
    // No parameters needed - the tool will auto-detect or prompt for venv selection
}

// Base class for UV tools
abstract class UVToolBase<T> implements vscode.LanguageModelTool<T> {
    protected workspaceRoot: string | undefined;
    protected currentWorkingDirectory: string | undefined;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        this.workspaceRoot = workspaceFolders ? workspaceFolders[0].uri.fsPath : undefined;
        
        // Get the directory of the currently active file, if any
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri.scheme === 'file') {
            this.currentWorkingDirectory = path.dirname(activeEditor.document.uri.fsPath);
        } else {
            this.currentWorkingDirectory = this.workspaceRoot;
        }
    }

    protected async selectWorkingDirectory(): Promise<string> {
        if (!this.workspaceRoot) {
            throw new Error('No workspace is open. Please open a folder or workspace to use UV tools.');
        }

        // If current working directory is the same as workspace root, no need to ask
        if (this.currentWorkingDirectory === this.workspaceRoot) {
            return this.workspaceRoot;
        }

        // If we have multiple potential directories, ask the user
        if (this.currentWorkingDirectory && this.currentWorkingDirectory !== this.workspaceRoot) {
            const workspaceRelative = path.relative(this.workspaceRoot, this.currentWorkingDirectory);
            
            const choice = await vscode.window.showQuickPick([
                {
                    label: `Workspace Root`,
                    description: this.workspaceRoot,
                    detail: 'Use the root directory of the workspace'
                },
                {
                    label: `Current Folder`,
                    description: this.currentWorkingDirectory,
                    detail: `Use the current folder (${workspaceRelative})`
                }
            ], {
                placeHolder: 'Select directory for UV operation',
                title: 'Choose Working Directory'
            });

            if (!choice) {
                throw new Error('Operation cancelled: No directory selected');
            }

            return choice.description!;
        }

        return this.workspaceRoot;
    }

    protected checkWorkspace(): boolean {
        if (!this.workspaceRoot) {
            throw new Error('No workspace is open. Please open a folder or workspace to use UV tools.');
        }
        return true;
    }

    protected async executeCommand(command: string, workingDir?: string): Promise<string> {
        const cwd = workingDir || await this.selectWorkingDirectory();
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    reject(new Error(`Command failed: ${stderr || error.message}`));
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    protected async createTerminalAndRun(command: string, terminalName: string, workingDir?: string): Promise<void> {
        const cwd = workingDir || await this.selectWorkingDirectory();
        const terminal = vscode.window.createTerminal({ 
            name: terminalName
        });
        terminal.show();
        
        // Change to the working directory explicitly and then run the command
        // Use PowerShell compatible commands since we're on Windows
        const cdCommand = `Set-Location "${cwd}"`;
        const pwdCommand = `Write-Host "Working directory: $(Get-Location)"`;
        const fullCommand = `${cdCommand}; ${pwdCommand}; ${command}`;
        
        terminal.sendText(fullCommand);
    }

    abstract prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<T>,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.PreparedToolInvocation>;

    abstract invoke(
        options: vscode.LanguageModelToolInvocationOptions<T>,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.LanguageModelToolResult>;
}

// Tool implementations
export class InitProjectTool extends UVToolBase<InitProjectParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<InitProjectParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const projectName = options.input.projectName || path.basename(selectedDir);
        
        return {
            invocationMessage: `Initializing UV project: ${projectName}`,
            confirmationMessages: {
                title: 'Initialize UV Project',
                message: new vscode.MarkdownString(
                    `Initialize a new Python project with UV?\n\n` +
                    `**Project name:** \`${projectName}\`\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will create a \`pyproject.toml\` file and set up the project structure.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<InitProjectParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const projectName = options.input.projectName || path.basename(selectedDir);
            const command = `uv init ${projectName}`;
            
            await this.createTerminalAndRun(command, 'UV Init Project', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated UV project initialization for "${projectName}" in ${selectedDir}. Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to initialize project: ${error.message}`);
        }
    }
}

export class SyncDependenciesTool extends UVToolBase<SyncDependenciesParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<SyncDependenciesParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { syncType = 'basic', requirementsFile, groups } = options.input;
        
        let description = 'Sync dependencies with default options';
        if (syncType === 'from-file' && requirementsFile) {
            description = `Sync from requirements file: ${requirementsFile}`;
        } else if (syncType === 'groups' && groups) {
            description = `Sync specific groups: ${groups}`;
        }
        
        return {
            invocationMessage: 'Syncing project dependencies',
            confirmationMessages: {
                title: 'Sync Dependencies',
                message: new vscode.MarkdownString(
                    `Sync project dependencies using UV?\n\n` +
                    `**Operation:** ${description}\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will install or update dependencies based on your project configuration.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<SyncDependenciesParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { syncType = 'basic', requirementsFile, groups } = options.input;
            
            let command = 'uv sync';
            
            if (syncType === 'from-file' && requirementsFile) {
                command += ` ${requirementsFile}`;
            } else if (syncType === 'groups' && groups) {
                const groupsList = groups.split(',').map((g: string) => g.trim());
                for (const group of groupsList) {
                    command += ` --group ${group}`;
                }
            }
            
            await this.createTerminalAndRun(command, 'UV Sync', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated dependency sync. Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to sync dependencies: ${error.message}`);
        }
    }
}

export class AddPackageTool extends UVToolBase<AddPackageParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<AddPackageParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { packageName, version, extras } = options.input;
        
        let packageSpec = packageName;
        if (version) packageSpec += `==${version}`;
        if (extras) packageSpec += `[${extras}]`;
        
        return {
            invocationMessage: `Adding package: ${packageSpec}`,
            confirmationMessages: {
                title: 'Add Package',
                message: new vscode.MarkdownString(
                    `Add Python package to the project?\n\n` +
                    `**Package:** \`${packageSpec}\`\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will add the package to your \`pyproject.toml\` and install it.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<AddPackageParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { packageName, version, extras } = options.input;
            
            let command = `uv add ${packageName}`;
            if (version) command += `==${version}`;
            if (extras) command += `[${extras}]`;
            
            await this.createTerminalAndRun(command, 'UV Add Package', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated package addition for "${packageName}". Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to add package: ${error.message}`);
        }
    }
}

export class AddDevPackageTool extends UVToolBase<AddDevPackageParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<AddDevPackageParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { packageName, version, extras } = options.input;
        
        let packageSpec = packageName;
        if (version) packageSpec += `==${version}`;
        if (extras) packageSpec += `[${extras}]`;
        
        return {
            invocationMessage: `Adding dev package: ${packageSpec}`,
            confirmationMessages: {
                title: 'Add Dev Package',
                message: new vscode.MarkdownString(
                    `Add Python package as a development dependency?\n\n` +
                    `**Package:** \`${packageSpec}\`\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will add the package to your \`pyproject.toml\` dev dependencies and install it.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<AddDevPackageParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { packageName, version, extras } = options.input;
            
            let command = `uv add --dev ${packageName}`;
            if (version) command += `==${version}`;
            if (extras) command += `[${extras}]`;
            
            await this.createTerminalAndRun(command, 'UV Add Dev Package', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated dev package addition for "${packageName}". Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to add dev package: ${error.message}`);
        }
    }
}

export class UpgradePackagesTool extends UVToolBase<UpgradePackagesParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<UpgradePackagesParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { upgradeType = 'all', packageName } = options.input;
        
        const description = upgradeType === 'specific' && packageName 
            ? `Upgrade specific package: ${packageName}`
            : 'Upgrade all packages to latest versions';
        
        return {
            invocationMessage: 'Upgrading packages',
            confirmationMessages: {
                title: 'Upgrade Packages',
                message: new vscode.MarkdownString(
                    `Upgrade project packages?\n\n` +
                    `**Operation:** ${description}\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will update packages to their latest compatible versions.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<UpgradePackagesParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { upgradeType = 'all', packageName } = options.input;
            
            if (upgradeType === 'specific' && packageName) {
                // For specific package upgrade, we need to check pyproject.toml
                const pyprojectPath = path.join(selectedDir, 'pyproject.toml');
                if (!fs.existsSync(pyprojectPath)) {
                    throw new Error('pyproject.toml file not found.');
                }
                
                const command = `uv pip compile pyproject.toml -o uv.lock --upgrade-package ${packageName}`;
                await this.executeCommand(command);
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Successfully upgraded package "${packageName}" to its latest compatible version.`)
                ]);
            } else {
                // Upgrade all packages
                const command = 'uv pip install --upgrade';
                await this.createTerminalAndRun(command, 'UV Upgrade', selectedDir);
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Successfully initiated package upgrade for all packages. Check the terminal for progress and results.`)
                ]);
            }
        } catch (error: any) {
            throw new Error(`Failed to upgrade packages: ${error.message}`);
        }
    }
}

export class CleanCacheTool extends UVToolBase<CleanCacheParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<CleanCacheParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        // Cache cleaning doesn't require working directory selection
        return {
            invocationMessage: 'Cleaning UV cache',
            confirmationMessages: {
                title: 'Clean Cache',
                message: new vscode.MarkdownString(
                    `Clean UV package cache?\n\n` +
                    `This will remove cached packages to free up disk space and resolve potential caching issues.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<CleanCacheParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const command = 'uv cache clean';
            await this.createTerminalAndRun(command, 'UV Clean Cache');
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated cache cleaning. Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to clean cache: ${error.message}`);
        }
    }
}

export class GenerateLockTool extends UVToolBase<GenerateLockParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<GenerateLockParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { includeExtras = 'none', extras, groups } = options.input;
        
        let description = 'Generate lock file from pyproject.toml';
        if (includeExtras === 'all') {
            description += ' (including all extras)';
        } else if (includeExtras === 'specific' && extras) {
            description += ` (extras: ${extras})`;
        }
        if (groups) {
            description += ` (groups: ${groups})`;
        }
        
        return {
            invocationMessage: 'Generating lock file',
            confirmationMessages: {
                title: 'Generate Lock File',
                message: new vscode.MarkdownString(
                    `Generate uv.lock file from pyproject.toml?\n\n` +
                    `**Operation:** ${description}\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will create a lock file to pin exact dependency versions.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<GenerateLockParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { includeExtras = 'none', extras, groups } = options.input;
            
            let command = 'uv lock';
            
            if (includeExtras === 'all') {
                command += ' --all-extras';
            } else if (includeExtras === 'specific' && extras) {
                const extrasList = extras.split(',').map((e: string) => e.trim());
                for (const extra of extrasList) {
                    command += ` --extra ${extra}`;
                }
            }
            
            if (groups) {
                const groupsList = groups.split(',').map((g: string) => g.trim());
                for (const group of groupsList) {
                    command += ` --group ${group}`;
                }
            }
            
            await this.createTerminalAndRun(command, 'UV Generate Lock', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated lock file generation. Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to generate lock file: ${error.message}`);
        }
    }
}

export class CreateVenvTool extends UVToolBase<CreateVenvParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<CreateVenvParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { pythonVersion } = options.input;
        
        let description = 'Create virtual environment';
        if (pythonVersion) {
            description += ` with Python ${pythonVersion}`;
        }
        
        return {
            invocationMessage: description,
            confirmationMessages: {
                title: 'Create Virtual Environment',
                message: new vscode.MarkdownString(
                    `Create a virtual environment with UV?\n\n` +
                    `**Directory:** \`${selectedDir}\`\n` +
                    (pythonVersion ? `**Python Version:** \`${pythonVersion}\`\n` : '') +
                    `\nThis will create an isolated Python environment for the project.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<CreateVenvParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { pythonVersion } = options.input;
            
            let command = 'uv venv';
            if (pythonVersion) {
                command += ` --python ${pythonVersion}`;
            }
            
            await this.createTerminalAndRun(command, 'UV Create Venv', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated virtual environment creation. Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to create virtual environment: ${error.message}`);
        }
    }
}

export class RunScriptTool extends UVToolBase<RunScriptParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<RunScriptParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { scriptPath, pythonVersion } = options.input;
        
        return {
            invocationMessage: `Running script: ${scriptPath}`,
            confirmationMessages: {
                title: 'Run Python Script',
                message: new vscode.MarkdownString(
                    `Run Python script with UV?\n\n` +
                    `**Script:** \`${scriptPath}\`\n` +
                    `**Directory:** \`${selectedDir}\`\n` +
                    (pythonVersion ? `**Python Version:** \`${pythonVersion}\`\n` : '') +
                    `\nThis will execute the script using UV's managed environment.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<RunScriptParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { scriptPath, pythonVersion } = options.input;
            
            let command = `uv run ${scriptPath}`;
            if (pythonVersion) {
                command = `uv run --python ${pythonVersion} ${scriptPath}`;
            }
            
            await this.createTerminalAndRun(command, 'UV Run Script', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated script execution for "${scriptPath}". Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to run script: ${error.message}`);
        }
    }
}

export class AddScriptDependencyTool extends UVToolBase<AddScriptDependencyParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<AddScriptDependencyParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { scriptPath, packageName } = options.input;
        
        return {
            invocationMessage: `Adding dependency ${packageName} to ${scriptPath}`,
            confirmationMessages: {
                title: 'Add Script Dependency',
                message: new vscode.MarkdownString(
                    `Add inline dependency to Python script?\n\n` +
                    `**Script:** \`${scriptPath}\`\n` +
                    `**Package:** \`${packageName}\`\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will add the package as an inline dependency to the script.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<AddScriptDependencyParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { scriptPath, packageName } = options.input;
            
            const command = `uv add --script ${scriptPath} ${packageName}`;
            
            await this.createTerminalAndRun(command, 'UV Add Script Dependency', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated adding dependency "${packageName}" to script "${scriptPath}". Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to add script dependency: ${error.message}`);
        }
    }
}

export class InstallPythonTool extends UVToolBase<InstallPythonParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<InstallPythonParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { pythonVersion } = options.input;
        
        return {
            invocationMessage: `Installing Python ${pythonVersion}`,
            confirmationMessages: {
                title: 'Install Python Version',
                message: new vscode.MarkdownString(
                    `Install Python version with UV?\n\n` +
                    `**Python Version:** \`${pythonVersion}\`\n\n` +
                    `This will install the specified Python version using UV's Python management.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<InstallPythonParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const { pythonVersion } = options.input;
            
            const command = `uv python install ${pythonVersion}`;
            
            await this.createTerminalAndRun(command, 'UV Install Python');
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated Python ${pythonVersion} installation. Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to install Python: ${error.message}`);
        }
    }
}

export class PinPythonTool extends UVToolBase<PinPythonParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<PinPythonParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        const { pythonVersion } = options.input;
        
        return {
            invocationMessage: `Pinning Python ${pythonVersion}`,
            confirmationMessages: {
                title: 'Pin Python Version',
                message: new vscode.MarkdownString(
                    `Pin Python version for the project?\n\n` +
                    `**Python Version:** \`${pythonVersion}\`\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will set the Python version for the current project.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<PinPythonParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();
            const { pythonVersion } = options.input;
            
            const command = `uv python pin ${pythonVersion}`;
            
            await this.createTerminalAndRun(command, 'UV Pin Python', selectedDir);
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated Python ${pythonVersion} pinning for the project. Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to pin Python: ${error.message}`);
        }
    }
}

export class InstallToolTool extends UVToolBase<InstallToolParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<InstallToolParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { toolName } = options.input;
        
        return {
            invocationMessage: `Installing tool: ${toolName}`,
            confirmationMessages: {
                title: 'Install Tool',
                message: new vscode.MarkdownString(
                    `Install Python tool globally with UV?\n\n` +
                    `**Tool:** \`${toolName}\`\n\n` +
                    `This will install the tool globally using UV's tool management.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<InstallToolParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const { toolName } = options.input;
            
            const command = `uv tool install ${toolName}`;
            
            await this.createTerminalAndRun(command, 'UV Install Tool');
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated tool installation for "${toolName}". Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to install tool: ${error.message}`);
        }
    }
}

export class ActivateVirtualEnvTool extends UVToolBase<ActivateVirtualEnvParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<ActivateVirtualEnvParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        this.checkWorkspace();
        const selectedDir = await this.selectWorkingDirectory();
        
        return {
            invocationMessage: 'Activating virtual environment',
            confirmationMessages: {
                title: 'Activate Virtual Environment',
                message: new vscode.MarkdownString(
                    `Activate a virtual environment?\n\n` +
                    `**Directory:** \`${selectedDir}\`\n\n` +
                    `This will search for existing virtual environments and activate one in a new terminal. If no virtual environment is found, you'll have the option to create one.`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ActivateVirtualEnvParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            this.checkWorkspace();
            const selectedDir = await this.selectWorkingDirectory();

            // Common virtual environment paths to check
            const commonVenvPaths = [
                path.join(selectedDir, '.venv'),
                path.join(selectedDir, 'venv'),
                path.join(selectedDir, '.env'),
                path.join(selectedDir, 'env')
            ];

            // Find existing virtual environments
            const existingVenvs: string[] = [];
            for (const venvPath of commonVenvPaths) {
                if (fs.existsSync(venvPath)) {
                    // Check if it's a valid virtual environment
                    const activateScript = process.platform === 'win32' 
                        ? path.join(venvPath, 'Scripts', 'activate.bat')
                        : path.join(venvPath, 'bin', 'activate');
                    
                    if (fs.existsSync(activateScript)) {
                        existingVenvs.push(venvPath);
                    }
                }
            }

            let selectedVenvPath: string;

            if (existingVenvs.length === 0) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`No virtual environments found in ${selectedDir}. You can create one using the "UV: Create Virtual Environment" command or the create_venv tool.`)
                ]);
            } else if (existingVenvs.length === 1) {
                // Only one virtual environment found, use it
                selectedVenvPath = existingVenvs[0];
            } else {
                // Multiple virtual environments found, use the first one (.venv is preferred)
                selectedVenvPath = existingVenvs[0];
            }

            // Determine the activation command based on the platform
            let activationCommand: string;
            if (process.platform === 'win32') {
                // Windows
                const activateScript = path.join(selectedVenvPath, 'Scripts', 'activate.bat');
                activationCommand = `"${activateScript}"`;
            } else {
                // Unix-like systems (macOS, Linux)
                const activateScript = path.join(selectedVenvPath, 'bin', 'activate');
                activationCommand = `source "${activateScript}"`;
            }

            // Create a new terminal and activate the virtual environment
            const terminal = vscode.window.createTerminal({
                name: 'UV Virtual Environment',
                cwd: selectedDir
            });
            
            terminal.show();
            terminal.sendText(activationCommand);
            
            const venvName = path.basename(selectedVenvPath);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully activated virtual environment "${venvName}" in a new terminal. The virtual environment is now active and ready to use.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to activate virtual environment: ${error.message}`);
        }
    }
}

export class RunToolTool extends UVToolBase<RunToolParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<RunToolParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { toolName, arguments: args } = options.input;
        
        let description = `Run tool: ${toolName}`;
        if (args) {
            description += ` with arguments: ${args}`;
        }
        
        return {
            invocationMessage: description,
            confirmationMessages: {
                title: 'Run Tool with UVX',
                message: new vscode.MarkdownString(
                    `Run Python tool with UVX?\n\n` +
                    `**Tool:** \`${toolName}\`\n` +
                    (args ? `**Arguments:** \`${args}\`\n` : '') +
                    `\nThis will execute the tool using UVX (UV's tool runner).`
                )
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<RunToolParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const { toolName, arguments: args } = options.input;
            
            let command = `uvx ${toolName}`;
            if (args) {
                command += ` ${args}`;
            }
            
            await this.createTerminalAndRun(command, 'UVX Run Tool');
            
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Successfully initiated tool execution for "${toolName}". Check the terminal for progress and results.`)
            ]);
        } catch (error: any) {
            throw new Error(`Failed to run tool: ${error.message}`);
        }
    }
}

// Registration function
export function registerLanguageModelTools(context: vscode.ExtensionContext) {
    try {
        context.subscriptions.push(vscode.lm.registerTool('init_project', new InitProjectTool()));
        context.subscriptions.push(vscode.lm.registerTool('sync_dependencies', new SyncDependenciesTool()));
        context.subscriptions.push(vscode.lm.registerTool('add_package', new AddPackageTool()));
        context.subscriptions.push(vscode.lm.registerTool('add_dev_package', new AddDevPackageTool()));
        context.subscriptions.push(vscode.lm.registerTool('upgrade_packages', new UpgradePackagesTool()));
        context.subscriptions.push(vscode.lm.registerTool('clean_cache', new CleanCacheTool()));
        context.subscriptions.push(vscode.lm.registerTool('generate_lock', new GenerateLockTool()));
        context.subscriptions.push(vscode.lm.registerTool('create_venv', new CreateVenvTool()));
        context.subscriptions.push(vscode.lm.registerTool('run_script', new RunScriptTool()));
        context.subscriptions.push(vscode.lm.registerTool('add_script_dependency', new AddScriptDependencyTool()));
        context.subscriptions.push(vscode.lm.registerTool('install_python', new InstallPythonTool()));
        context.subscriptions.push(vscode.lm.registerTool('pin_python', new PinPythonTool()));
        context.subscriptions.push(vscode.lm.registerTool('install_tool', new InstallToolTool()));
        context.subscriptions.push(vscode.lm.registerTool('run_tool', new RunToolTool()));
        context.subscriptions.push(vscode.lm.registerTool('activate_venv', new ActivateVirtualEnvTool()));
    } catch (error) {
        console.warn('Failed to register some language model tools:', error);
    }
}
