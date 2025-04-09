import * as vscode from 'vscode';

export function registerLinkProvider(context: vscode.ExtensionContext) {
    // Provider for uv.lock files
    const uvLockProvider: vscode.DocumentLinkProvider = {
        provideDocumentLinks(document: vscode.TextDocument) {
            const links: vscode.DocumentLink[] = [];
            for (let line = 0; line < document.lineCount; line++) {
                const text = document.lineAt(line).text;
                const match = text.match(/^name = "([a-zA-Z0-9-_]+)"/);
                if (match) {
                    const pkgName = match[1];
                    const start = text.indexOf("name = ") + 8;
                    const end = start + pkgName.length;
                    const linkRange = new vscode.Range(line, start, line, end);
                    const uri = vscode.Uri.parse(`https://pypi.org/project/${pkgName}/`);
                    links.push(new vscode.DocumentLink(linkRange, uri));
                }
            }
            return links;
        }
    };

    // Provider for pyproject.toml files
    const pyprojectProvider: vscode.DocumentLinkProvider = {
        provideDocumentLinks(document: vscode.TextDocument) {
            const links: vscode.DocumentLink[] = [];
            
            // Track sections
            let inProjectSection = false;
            let inDependenciesSection = false;
            let inDependenciesArray = false;
            
            for (let line = 0; line < document.lineCount; line++) {
                const text = document.lineAt(line).text;
                const trimmedText = text.trim();
                
                // Skip empty lines and comments
                if (trimmedText === '' || trimmedText.startsWith('#')) {
                    continue;
                }
                
                // Check if we're entering the project section
                if (trimmedText === '[project]') {
                    inProjectSection = true;
                    inDependenciesSection = false;
                    inDependenciesArray = false;
                    continue;
                }
                
                // Check if we're entering a dependencies section
                if (trimmedText === '[dependencies]' || trimmedText === '[dev-dependencies]') {
                    inProjectSection = false;
                    inDependenciesSection = true;
                    inDependenciesArray = false;
                    continue;
                }
                
                // Check if we're leaving a section
                if ((inProjectSection || inDependenciesSection) && 
                    trimmedText.startsWith('[') && trimmedText.endsWith(']')) {
                    inProjectSection = false;
                    inDependenciesSection = false;
                    inDependenciesArray = false;
                    continue;
                }
                
                // Check if we're entering dependencies array in project section
                if (inProjectSection && trimmedText === 'dependencies = [') {
                    inDependenciesArray = true;
                    continue;
                }
                
                // Check if we're leaving dependencies array
                if (inDependenciesArray && trimmedText === ']') {
                    inDependenciesArray = false;
                    continue;
                }
                
                // Process dependencies in project section array
                if (inDependenciesArray) {
                    // Match package in array format: "package>=version"
                    const arrayMatch = trimmedText.match(/^\s*"([a-zA-Z0-9_-]+)(?:>=|==|<=|>|<|~=|!=|[^a-zA-Z0-9_-])(.*?)"/);
                    if (arrayMatch) {
                        const pkgName = arrayMatch[1];
                        const start = text.indexOf(pkgName);
                        const end = start + pkgName.length;
                        const linkRange = new vscode.Range(line, start, line, end);
                        const uri = vscode.Uri.parse(`https://pypi.org/project/${pkgName}/`);
                        links.push(new vscode.DocumentLink(linkRange, uri));
                        continue;
                    }
                }
                
                // Process dependencies in traditional section
                if (inDependenciesSection) {
                    // Match package name in key-value format
                    const match = trimmedText.match(/^([a-zA-Z0-9_-]+)\s*=/);
                    if (match) {
                        const pkgName = match[1];
                        const start = text.indexOf(pkgName);
                        const end = start + pkgName.length;
                        const linkRange = new vscode.Range(line, start, line, end);
                        const uri = vscode.Uri.parse(`https://pypi.org/project/${pkgName}/`);
                        links.push(new vscode.DocumentLink(linkRange, uri));
                    }
                }
            }
            
            // For debugging
            console.log(`Found ${links.length} links in pyproject.toml`);
            
            return links;
        }
    };

    // Register for both pyproject-toml and regular toml languages
    context.subscriptions.push(
        vscode.languages.registerDocumentLinkProvider({ language: 'uvlock' }, uvLockProvider),
        vscode.languages.registerDocumentLinkProvider({ language: 'pyproject-toml' }, pyprojectProvider),
        vscode.languages.registerDocumentLinkProvider({ language: 'toml', pattern: '**/pyproject.toml' }, pyprojectProvider)
    );
}
