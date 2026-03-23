# 🔧 UV Toolkit

**UV Toolkit** is a Visual Studio Code extension that enhances your experience when working with [uv](https://github.com/astral-sh/uv), a Python package manager.

[![Install from VS Code Marketplace](https://img.shields.io/badge/Install-VS%20Code%20Marketplace-blue.svg)](https://marketplace.visualstudio.com/items?itemName=the0807.uv-toolkit)
[![Install from Open VSX](https://img.shields.io/badge/Install-Open%20VSX-purple.svg)](https://open-vsx.org/extension/the0807/uv-toolkit)

## 📝 Overview

UV Toolkit is an essential tool for Python developers using uv. This extension provides various features such as syntax highlighting, package links, command palette integration, and more to make Python project management easier and more efficient.

## ⭐ Key Features at a Glance

* **VS Code Copilot Integration** - Use UV commands through Copilot agent mode with natural language
* **Command Palette Integration** - Access uv commands directly from VS Code
* **Auto uv Installer** - Automatically detects if uv is missing and offers to install it
* **PEP 723 Interpreter** - Auto-sets the Python interpreter from inline script metadata
* **Package Management** - Easily add, remove, and search for packages
* **Dependency Diagnostics** - Get warnings for missing dependencies
* **Package Links** - Click on package names to navigate to PyPI pages
* **Syntax Highlighting** - Enhanced colors for pyproject.toml and uv.lock files
* **Context Menu Integration** - Right-click on files to access UV commands

---

## ✨ Features

### 🤖 VS Code Copilot Integration

UV Toolkit integrates seamlessly with VS Code Copilot's agent mode, allowing you to use natural language to execute UV commands. Once installed, you can interact with UV through Copilot using the following tools:

| Tool Reference | Description | Example Usage |
|----------------|-------------|---------------|
| `#uv-init` | Initialize a new Python project | "Initialize a new UV project called 'my-app'" |
| `#uv-sync` | Sync project dependencies | "Sync my project dependencies" |
| `#uv-add` | Add a package to the project | "Add the requests package to my project" |
| `#uv-upgrade` | Upgrade packages | "Upgrade all my packages to the latest versions" |
| `#uv-clean` | Clean UV cache | "Clean the UV cache to free up space" |
| `#uv-lock` | Generate lock file | "Generate a lock file for my project" |
| `#uv-venv` | Create virtual environment | "Create a virtual environment with Python 3.11" |
| `#uv-run` | Run Python script | "Run my main.py script" |
| `#uv-script-dep` | Add script dependency | "Add numpy as a dependency to my script.py" |
| `#uv-python-install` | Install Python version | "Install Python 3.12" |
| `#uv-python-pin` | Pin Python version | "Pin Python 3.11 for this project" |
| `#uv-tool-install` | Install Python tool | "Install the ruff linting tool" |
| `#uvx-run` | Run tool with UVX | "Run black formatter on my code" |
| `#uv-activate-venv` | Activate virtual environment | "Activate the virtual environment" |
| `#uv-pep723` | Set Python interpreter for PEP 723 script | "Set the interpreter for my script.py" |
| `#uv-install` | Install uv package manager | "Install uv on my machine" |
| `#uv-remove` | Remove a package from the project | "Remove the requests package from my project" |
| `#uv-search` | Search for a package on PyPI | "Search for the flask package on PyPI" |

#### Example Conversations with Copilot:

**User:** "I need to start a new Python project with UV"  
**Copilot:** I'll help you initialize a new UV project. *[Uses #uv-init tool]*

**User:** "Add pandas and numpy to my data science project"  
**Copilot:** I'll add those packages to your project. *[Uses #uv-add tool]*

**User:** "My dependencies are out of sync, can you fix that?"
**Copilot:** I'll sync your project dependencies. *[Uses #uv-sync tool]*

**User:** "Remove flask from my project"
**Copilot:** I'll remove flask from your dependencies. *[Uses #uv-remove tool]*

**User:** "Search for a package called httpx on PyPI"
**Copilot:** I'll look that up for you. *[Uses #uv-search tool]*

### ⚡ Auto uv Installer

When the extension activates, it automatically checks whether `uv` is installed. If not found, a prompt appears offering to install it immediately.

* **Auto-detection on startup** — prompts once per session if uv is missing
* **Manual install** — run `UV: Install uv` from the Command Palette at any time
* **Multiple install methods** — choose from platform-aware options: Homebrew (macOS), winget (Windows), Cargo (cross-platform), or official install scripts
* **Restart suggestion** — after installation starts, a notification offers to reload the window

### 🐍 PEP 723 Interpreter Selection

When you open a Python script containing [PEP 723 inline metadata](https://peps.python.org/pep-0723/) (`# /// script` block), the extension automatically reads the `requires-python` constraint, finds the matching interpreter via `uv python find`, and sets it as the VS Code Python interpreter.

```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["requests>=2.0"]
# ///
import requests
```

* **Auto-detection** — triggers when the file is opened or becomes active
* **Interpreter update** — sets `python.defaultInterpreterPath` for the workspace
* **Info notification** — confirms which Python version was selected
* **Manual command** — run `UV: Set Interpreter for PEP 723 Script` to trigger manually

### 🎮 Command Palette Integration
Access common uv commands directly from the VS Code Command Palette:

| Command | Description |
|---------|-------------|
| `UV: Initialize Project` | Initialize a new Python project |
| `UV: Sync Dependencies` | Synchronize dependencies with uv.lock |
| `UV: Upgrade Packages` | Upgrade all packages |
| `UV: Clean Cache` | Clean uv cache |
| `UV: Add Package to Project` | Add a new package to your dependencies |
| `UV: Add Dev Package to Project` | Add a new package to your development dependencies |
| `UV: Remove Package from pyproject.toml` | Remove a package from your dependencies |
| `UV: Search Package on PyPI` | Search for packages on PyPI and add them to your project |
| `UV: Generate Lock File` | Generate a uv.lock file from your pyproject.toml |
| `UV: Upgrade Dependencies` | Upgrade all dependencies or a specific package |
| `UV: Create Virtual Environment` | Create a new virtual environment |
| `UV: Activate Virtual Environment` | Activate an existing virtual environment |
| `UV: Run Python Script` | Run a Python script with uv |
| `UV: Add Script Dependency` | Add inline dependencies to a Python script |
| `UV: Install Python Version` | Install a specific Python version |
| `UV: Pin Python Version` | Pin a specific Python version for the project |
| `UV: Install Tool` | Install a Python tool with uv |
| `UV: Run Tool with UVX` | Run a Python tool in an ephemeral environment |
| `UV: Set Interpreter for PEP 723 Script` | Set the Python interpreter based on a script's inline metadata |
| `UV: Install uv` | Install the uv package manager |

### 📦 Package Management
Easily add, remove, and search for packages with interactive dialogs.

### 🔍 Dependency Diagnostics
Get warnings when dependencies in your `pyproject.toml` are missing from `uv.lock`.

### 🔗 Package Links
Click on package names in `uv.lock` and `pyproject.toml` files to navigate directly to their PyPI pages. This makes it easy to check package documentation, versions, and other information.

### 📄 Syntax Highlighting
Enhanced syntax highlighting for pyproject.toml and uv.lock files with custom colors for better readability:

* **Section headers** are highlighted in bold blue
* **Keys** are highlighted in light blue
* **Values** are highlighted based on their type (string, number, boolean)
* **Package names** are highlighted in teal and bold
* **Version numbers** are highlighted in yellow
* **Comments** are highlighted in green and italic

### 📋 Context Menu Integration
Right-click on pyproject.toml files in the explorer or editor to access UV commands directly from the context menu.

---

## 📋 Requirements

> **NOTE**: This extension requires [uv](https://github.com/astral-sh/uv) to be installed on your system. If uv is not found, the extension will automatically offer to install it for you on activation.

* Visual Studio Code 1.70.0 or higher
* [uv](https://github.com/astral-sh/uv) installed and available in your PATH

### 💻 Installing uv

You can install uv using one of the following methods:

<details>
<summary><b>macOS (Homebrew)</b></summary>

```bash
brew install uv
```
</details>

<details>
<summary><b>macOS / Linux (Shell Script)</b></summary>

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
</details>

<details>
<summary><b>Windows (winget)</b></summary>

```powershell
winget install astral-sh.uv
```
</details>

<details>
<summary><b>Windows (PowerShell Script)</b></summary>

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
</details>

<details>
<summary><b>Using Cargo</b></summary>

```bash
cargo install uv
```
</details>

<details>
<summary><b>Using pip</b></summary>

```bash
pip install uv
```
</details>

<details>
<summary><b>Using pipx</b></summary>

```bash
pipx install uv
```
</details>

<details>
<summary><b>Updating uv</b></summary>

If you've already installed uv, you can update to the latest version with:

```bash
uv self update
```
</details>

For more detailed installation instructions, visit the [official uv installation documentation](https://github.com/astral-sh/uv).

---

## ⚙️ Extension Settings

This extension doesn't have any specific settings.

---

## 📖 Usage

### Basic Usage

1. Open a Python project that uses uv
2. Use the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "UV" to see available commands
3. Click on package names in `uv.lock` and `pyproject.toml` to navigate to PyPI

### Command Usage

<details>
<summary><b>🚀 Project Management</b></summary>

* **UV: Initialize Project**: Initialize a new Python project. Enter a project name to run the uv init command and create a basic project structure.
</details>

<details>
<summary><b>📦 Package Management</b></summary>

* **UV: Add Package to Project**: Add a new package to your project. You can enter the package name, version constraint, and extras.
* **UV: Remove Package from pyproject.toml**: Remove a package from your pyproject.toml file. You can select which package to remove.
* **UV: Search Package on PyPI**: Search for packages on PyPI. You can select a package from the search results to add to your project.
* **UV: Upgrade Packages**: Upgrade all packages to their latest versions.
</details>

<details>
<summary><b>🔄 Dependency Management</b></summary>

* **UV: Sync Dependencies**: Synchronize dependencies with uv.lock. You can choose between basic sync, sync from a specific file, or sync specific groups.
* **UV: Generate Lock File**: Generate a uv.lock file from your pyproject.toml. You can choose between basic compile, include all extras, specify extras, or specify groups.
* **UV: Upgrade Dependencies**: Upgrade all dependencies or a specific package. You can select which package to upgrade.
</details>

<details>
<summary><b>🧪 Virtual Environment Management</b></summary>

* **UV: Create Virtual Environment**: Create a new virtual environment. You can choose between creating a basic venv or creating a venv with a specific Python version.
</details>

<details>
<summary><b>▶️ Python Script Execution</b></summary>

* **UV: Run Python Script**: Run a Python script with uv. You can select which script to run and optionally specify a Python version.
* **UV: Add Script Dependency**: Add inline dependencies to a Python script. You can select a script and a package to add.
</details>

<details>
<summary><b>🐍 Python Version Management</b></summary>

* **UV: Install Python Version**: Install a specific Python version. You can enter which Python version to install.
* **UV: Pin Python Version**: Pin a specific Python version for the project. You can enter which Python version to pin.
</details>

<details>
<summary><b>🛠️ Tool Management</b></summary>

* **UV: Install Tool**: Install a Python tool with uv. You can enter the name of the tool to install.
* **UV: Run Tool with UVX**: Run a Python tool in an ephemeral environment. You can enter the name of the tool to run and optionally enter tool arguments.
</details>

<details>
<summary><b>🧹 Miscellaneous</b></summary>

* **UV: Clean Cache**: Clean the uv cache.
* **UV: Install uv**: Install the uv package manager. Checks if uv is already installed and, if not, shows a QuickPick with platform-aware installation methods (Homebrew, winget, Cargo, or official scripts).
* **UV: Set Interpreter for PEP 723 Script**: Manually trigger PEP 723 interpreter detection for the active Python script.
</details>

---

## 💡 Feedback & Contributions

We welcome feedback and contributions to improve this extension! Feel free to report issues or suggest improvements on our [GitHub repository](https://github.com/the0807/UV-Toolkit).
