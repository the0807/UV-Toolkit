# Change Log

All notable changes to the "uv-toolkit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.10] - 2026-03-25

### Fixed
- **Cross-platform Copilot tools**: Fix `createTerminalAndRun` using PowerShell-only commands (`Set-Location`, `Write-Host`) on all platforms (#8)
  - Now uses `cd` and `echo` on macOS/Linux, PowerShell commands only on Windows

## [0.1.9] - 2026-03-14

### Added
- **Multiple uv installation methods**: Platform-aware QuickPick UI for installing uv (#7)
  - macOS: Homebrew, Shell Script, Cargo
  - Windows: winget, PowerShell Script, Cargo
  - Linux: Shell Script, Cargo
- **Copilot `#uv-remove` tool**: Remove packages from dependencies via natural language
- **Copilot `#uv-search` tool**: Search for packages on PyPI via natural language

### Improved
- `UV: Install uv` command now shows a QuickPick with multiple installation options instead of running a single script
- Updated README with new Copilot tools and installation methods

## [0.1.8] - 2026-03-03

### Added
- **Auto uv Installer**: The extension now detects whether `uv` is installed on activation and prompts the user to install it if not found
  - Auto-prompt once per session when uv is missing
  - `UV: Install uv` command for manual installation via Command Palette
  - Platform-specific install scripts (curl for macOS/Linux, PowerShell for Windows)
  - Notification with "Restart Window" button after installation starts
  - `#uv-install` Copilot tool for natural language installation
- **PEP 723 Interpreter Selection**: Automatically sets the VS Code Python interpreter when opening a script with PEP 723 inline metadata (`# /// script` block)
  - Reads `requires-python` constraint and calls `uv python find` to locate the interpreter
  - Sets `python.defaultInterpreterPath` for the workspace and shows an info notification
  - Cache invalidation on file save to re-detect after metadata changes
  - `UV: Set Interpreter for PEP 723 Script` command for manual triggering
  - `#uv-pep723` Copilot tool for natural language interpreter setup
  - `#uv-activate-venv` Copilot tool added to tool reference list

### Fixed
- **Version constraints**: Adding a package with a bare version number (e.g. `1.0.0`) now correctly produces `package==1.0.0` instead of `package1.0.0`
- **uv lock commands**: `UV: Generate Lock File` and `UV: Upgrade Dependencies` now use the correct `uv lock` commands instead of the old `uv pip compile` / `uv pip install --upgrade` commands
- **Diagnostics on open**: Dependency diagnostics now run immediately when a `pyproject.toml` file is opened, not only on subsequent edits
- **Remove package**: `UV: Remove Package` now runs `uv remove <package>` in a terminal instead of directly editing `pyproject.toml`, keeping the lock file in sync

## [0.1.7] - 2025-08-11

- **Version was bumped incorrectly, updated to 0.1.7 instead**

## [0.1.2] - 2025-08-11

- **Test for workflow execution**

## [0.1.1] - 2025-08-11

### Added
- **Open VSX**: Extension packaging and publishing now fully compatible with Open VSX Registry
- **Virtual Environment Activation**: Direct command to activate UV-managed virtual environments

### Improved
- Updated release pipeline to streamline multi-marketplace publishing

## [0.1.0] - 2025-08-09

### Added
- **VS Code Copilot Integration**: Full support for VS Code Language Model Tools API
  - 13 interactive tools for UV package management through Copilot agent mode
  - Natural language interface for UV commands (e.g., "Add pandas to my project")
  - Tool references: #uv-init, #uv-sync, #uv-add, #uv-upgrade, #uv-clean, etc.
  - Rich confirmation dialogs with Markdown formatting
  - Comprehensive error handling for LLM consumption
  - Seamless integration with existing UV command implementations

### Improved
- Enhanced package.json with Language Model Tools configuration
- Updated extension activation to register tools automatically
- Improved TypeScript architecture with proper tool interfaces
- Enhanced documentation with Copilot usage examples

## [0.0.2] - 2025-04-09

### Fixed
- Bug fixes and stability improvements

## [0.0.1] - 2025-04-09

### Added
- Python project initialization (uv.init)
- Dependency synchronization and management (uv.sync)
- Package addition and removal (uv.add, uv.removePackage)
- Package search on PyPI (uv.searchPackage)
- Lock file generation and management (uv.generateLock)
- Dependency upgrades (uv.upgradeDependencies)
- Virtual environment creation and management (uv.manageVirtualEnv)
- Python script execution (uv.runScript)
- Script dependency addition (uv.addScriptDependency)
- Python version installation and pinning (uv.installPython, uv.pinPython)
- Tool installation and execution (uv.installTool, uv.runTool)
- Link provider for pyproject.toml and uv.lock files
- Diagnostics for detecting mismatches between pyproject.toml and uv.lock files

### Improved
- Enhanced syntax highlighting for pyproject.toml files
- Syntax highlighting support for uv.lock files
- Easy command access through context menus
