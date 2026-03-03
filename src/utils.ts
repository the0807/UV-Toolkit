const VERSION_OPERATORS = /^(>=|<=|==|!=|~=|>|<)/;

/**
 * Combines a package name and version constraint into a uv add argument string.
 * If the version already contains an operator, it is used as-is.
 * A bare version number (no operator) gets == prepended.
 */
export function buildVersionSpec(packageName: string, version: string | undefined): string {
    if (!version) {
        return packageName;
    }
    if (VERSION_OPERATORS.test(version)) {
        return `${packageName}${version}`;
    }
    return `${packageName}==${version}`;
}

/**
 * Returns the list of dependency names from pyproject.toml that are missing from uv.lock.
 */
export function buildDiagnosticsFromText(pyprojectText: string, lockText: string): string[] {
    const depNames = parseDependencyNames(pyprojectText);
    return depNames.filter(dep => !lockText.includes(dep));
}

/**
 * Builds a uv lock command string with optional extras or groups.
 */
export function buildLockCommand(
    mode: 'basic' | 'all-extras' | 'extras' | 'groups',
    extras?: string,
    groups?: string
): string {
    let command = 'uv lock';
    if (mode === 'all-extras') {
        command += ' --all-extras';
    } else if (mode === 'extras' && extras) {
        for (const e of extras.split(',').map(s => s.trim()).filter(Boolean)) {
            command += ` --extra ${e}`;
        }
    } else if (mode === 'groups' && groups) {
        for (const g of groups.split(',').map(s => s.trim()).filter(Boolean)) {
            command += ` --group ${g}`;
        }
    }
    return command;
}

/**
 * Builds a uv lock --upgrade command string.
 */
export function buildUpgradeCommand(type: 'all' | 'specific', packageName?: string): string {
    if (type === 'specific' && packageName) {
        return `uv lock --upgrade-package ${packageName}`;
    }
    return 'uv lock --upgrade';
}

export interface Pep723Metadata {
    requiresPython?: string;
    dependencies: string[];
}

/**
 * Parses PEP 723 inline script metadata from a Python source file.
 * Returns null if no "# /// script" block is found.
 */
export function parsePep723Metadata(text: string): Pep723Metadata | null {
    // Normalize line endings to handle CRLF (Windows) files
    const normalized = text.replace(/\r\n/g, '\n');

    const blockMatch = normalized.match(/^# \/\/\/ script\n((?:#[^\n]*\n)*?)# \/\/\/(?:\n|$)/m);
    if (!blockMatch) {
        return null;
    }

    // Strip leading "# " or "#" from each line to get raw TOML content
    const content = blockMatch[1].replace(/^# ?/gm, '');

    const requiresPythonMatch = content.match(/requires-python\s*=\s*"([^"]+)"/);
    const requiresPython = requiresPythonMatch?.[1];

    const depsBlockMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
    const dependencies: string[] = [];
    if (depsBlockMatch) {
        const depRegex = /"([^"]+)"/g;
        let m;
        while ((m = depRegex.exec(depsBlockMatch[1])) !== null) {
            dependencies.push(m[1]);
        }
    }

    return { requiresPython, dependencies };
}

/**
 * Parses package names from the [project].dependencies array in a pyproject.toml string.
 */
export function parseDependencyNames(pyprojectText: string): string[] {
    const arrayMatch = pyprojectText.match(/^\[project\][^\[]*?dependencies\s*=\s*\[(.*?)\]/ms);
    if (!arrayMatch) {
        return [];
    }

    const depsContent = arrayMatch[1];
    const names: string[] = [];

    // Extract package name from each entry, e.g. "requests>=2.0.0" or "pandas"
    const lineRegex = /"([a-zA-Z0-9_-]+)[^"]*"/g;
    let match;
    while ((match = lineRegex.exec(depsContent)) !== null) {
        names.push(match[1]);
    }

    return names;
}

/**
 * Returns the platform-specific uv installation script command.
 * Returns null for unsupported platforms.
 */
export function getInstallScript(platform: string): string | null {
    if (platform === 'darwin' || platform === 'linux') {
        return 'curl -LsSf https://astral.sh/uv/install.sh | sh';
    }
    if (platform === 'win32') {
        return 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"';
    }
    return null;
}
