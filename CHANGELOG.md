# Change Log

All notable changes to the "uv-toolkit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
