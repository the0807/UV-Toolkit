import * as assert from 'assert';
import { buildVersionSpec, buildDiagnosticsFromText, buildLockCommand, buildUpgradeCommand, parsePep723Metadata, getInstallScript, getInstallOptions } from '../utils';

suite('buildVersionSpec', () => {
    test('adds == to bare version number without operator', () => {
        assert.strictEqual(buildVersionSpec('requests', '1.0.0'), 'requests==1.0.0');
    });

    test('keeps >= operator as-is', () => {
        assert.strictEqual(buildVersionSpec('requests', '>=1.0.0'), 'requests>=1.0.0');
    });

    test('keeps <= operator as-is', () => {
        assert.strictEqual(buildVersionSpec('requests', '<=2.0.0'), 'requests<=2.0.0');
    });

    test('keeps == operator as-is', () => {
        assert.strictEqual(buildVersionSpec('requests', '==1.5.0'), 'requests==1.5.0');
    });

    test('keeps ~= operator as-is', () => {
        assert.strictEqual(buildVersionSpec('requests', '~=1.0'), 'requests~=1.0');
    });

    test('returns package name only when version is empty or undefined', () => {
        assert.strictEqual(buildVersionSpec('requests', ''), 'requests');
        assert.strictEqual(buildVersionSpec('requests', undefined), 'requests');
    });
});

suite('buildLockCommand', () => {
    test('basic lock command', () => {
        assert.strictEqual(buildLockCommand('basic'), 'uv lock');
    });

    test('includes all-extras flag', () => {
        assert.strictEqual(buildLockCommand('all-extras'), 'uv lock --all-extras');
    });

    test('includes specific extras', () => {
        assert.strictEqual(buildLockCommand('extras', 'dev,test'), 'uv lock --extra dev --extra test');
    });

    test('includes specific groups', () => {
        assert.strictEqual(buildLockCommand('groups', undefined, 'dev,test'), 'uv lock --group dev --group test');
    });
});

suite('buildUpgradeCommand', () => {
    test('upgrades all packages', () => {
        assert.strictEqual(buildUpgradeCommand('all'), 'uv lock --upgrade');
    });

    test('upgrades a specific package', () => {
        assert.strictEqual(buildUpgradeCommand('specific', 'requests'), 'uv lock --upgrade-package requests');
    });
});

suite('buildDiagnosticsFromText - pyproject.toml parsing', () => {
    test('parses array-style dependencies under [project] section', () => {
        const pyprojectText = `
[project]
name = "my-project"
dependencies = [
    "requests>=2.0.0",
    "numpy==1.24.0",
    "pandas",
]
`;
        const lockText = 'name = "requests"\nname = "numpy"';
        const missing = buildDiagnosticsFromText(pyprojectText, lockText);
        assert.deepStrictEqual(missing, ['pandas']);
    });

    test('returns empty array when all dependencies are in lock file', () => {
        const pyprojectText = `
[project]
dependencies = [
    "requests>=2.0.0",
    "numpy==1.24.0",
]
`;
        const lockText = 'name = "requests"\nname = "numpy"';
        const missing = buildDiagnosticsFromText(pyprojectText, lockText);
        assert.deepStrictEqual(missing, []);
    });

    test('returns empty array when no dependencies section exists', () => {
        const pyprojectText = `
[project]
name = "my-project"
`;
        const missing = buildDiagnosticsFromText(pyprojectText, '');
        assert.deepStrictEqual(missing, []);
    });
});

suite('parsePep723Metadata', () => {
    test('parses requires-python and dependencies from valid PEP 723 block', () => {
        const text = `#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "requests>=2.0",
#   "cowsay",
# ]
# ///
import requests
`;
        const result = parsePep723Metadata(text);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.requiresPython, '>=3.12');
        assert.deepStrictEqual(result!.dependencies, ['requests>=2.0', 'cowsay']);
    });

    test('returns null when no PEP 723 block present', () => {
        const text = `import requests\nprint("hello")`;
        assert.strictEqual(parsePep723Metadata(text), null);
    });

    test('handles block with requires-python only (no dependencies)', () => {
        const text = `# /// script\n# requires-python = ">=3.11"\n# ///\n`;
        const result = parsePep723Metadata(text);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.requiresPython, '>=3.11');
        assert.deepStrictEqual(result!.dependencies, []);
    });

    test('handles block with dependencies only (no requires-python)', () => {
        const text = `# /// script\n# dependencies = [\n#   "cowsay",\n# ]\n# ///\n`;
        const result = parsePep723Metadata(text);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.requiresPython, undefined);
        assert.deepStrictEqual(result!.dependencies, ['cowsay']);
    });

    test('ignores non-script PEP 723 blocks', () => {
        const text = `# /// test\n# requires-python = ">=3.12"\n# ///\n`;
        assert.strictEqual(parsePep723Metadata(text), null);
    });

    test('handles CRLF line endings', () => {
        const text = "# /// script\r\n# requires-python = \">=3.11\"\r\n# ///\r\n";
        const result = parsePep723Metadata(text);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.requiresPython, '>=3.11');
    });

    test('handles closing delimiter at end of file with no trailing newline', () => {
        const text = "# /// script\n# requires-python = \">=3.11\"\n# ///";
        const result = parsePep723Metadata(text);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result!.requiresPython, '>=3.11');
    });
});

suite('getInstallScript', () => {
    test('returns curl command on linux', () => {
        assert.strictEqual(
            getInstallScript('linux'),
            'curl -LsSf https://astral.sh/uv/install.sh | sh'
        );
    });

    test('returns curl command on darwin (macOS)', () => {
        assert.strictEqual(
            getInstallScript('darwin'),
            'curl -LsSf https://astral.sh/uv/install.sh | sh'
        );
    });

    test('returns powershell command on win32', () => {
        assert.strictEqual(
            getInstallScript('win32'),
            'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
        );
    });

    test('returns null on unsupported platform', () => {
        assert.strictEqual(getInstallScript('freebsd'), null);
    });
});

suite('getInstallOptions', () => {
    test('darwin includes brew, shell script, and cargo', () => {
        const options = getInstallOptions('darwin');
        const labels = options.map(o => o.label);
        assert.deepStrictEqual(labels, ['Homebrew', 'Shell Script', 'Cargo']);
    });

    test('linux includes shell script and cargo', () => {
        const options = getInstallOptions('linux');
        const labels = options.map(o => o.label);
        assert.deepStrictEqual(labels, ['Shell Script', 'Cargo']);
    });

    test('win32 includes winget, powershell script, and cargo', () => {
        const options = getInstallOptions('win32');
        const labels = options.map(o => o.label);
        assert.deepStrictEqual(labels, ['winget', 'PowerShell Script', 'Cargo']);
    });

    test('unsupported platform returns only cargo', () => {
        const options = getInstallOptions('freebsd');
        assert.strictEqual(options.length, 1);
        assert.strictEqual(options[0].label, 'Cargo');
    });
});
