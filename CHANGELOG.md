# Change Log

All notable changes to the "uv-toolkit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
