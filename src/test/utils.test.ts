import * as assert from 'assert';
import { buildVersionSpec, buildDiagnosticsFromText, buildLockCommand, buildUpgradeCommand } from '../utils';

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
