# 🔧 UV Toolkit

**UV Toolkit** is a Visual Studio Code extension that enhances your experience when working with [uv](https://github.com/astral-sh/uv), a Python package manager.

[![Install from VS Code Marketplace](https://img.shields.io/badge/Install-VS%20Code%20Marketplace-blue.svg)](https://marketplace.visualstudio.com/items?itemName=the0807.uv-toolkit)

## 📝 Overview

UV Toolkit is an essential tool for Python developers using uv. This extension provides various features such as syntax highlighting, package links, command palette integration, and more to make Python project management easier and more efficient.

## ⭐ Key Features at a Glance

* **Command Palette Integration** - Access uv commands directly from VS Code
* **Package Management** - Easily add, remove, and search for packages
* **Dependency Diagnostics** - Get warnings for missing dependencies
* **Package Links** - Click on package names to navigate to PyPI pages
* **Syntax Highlighting** - Enhanced colors for pyproject.toml and uv.lock files
* **Context Menu Integration** - Right-click on files to access UV commands

---

## ✨ Features

### 🎮 Command Palette Integration
Access common uv commands directly from the VS Code Command Palette:

| Command | Description |
|---------|-------------|
| `UV: Initialize Project` | Initialize a new Python project |
| `UV: Sync Dependencies` | Synchronize dependencies with uv.lock |
| `UV: Upgrade Packages` | Upgrade all packages |
| `UV: Clean Cache` | Clean uv cache |
| `UV: Add Package to Project` | Add a new package to your dependencies |
| `UV: Remove Package from pyproject.toml` | Remove a package from your dependencies |
| `UV: Search Package on PyPI` | Search for packages on PyPI and add them to your project |
| `UV: Generate Lock File` | Generate a uv.lock file from your pyproject.toml |
| `UV: Upgrade Dependencies` | Upgrade all dependencies or a specific package |
| `UV: Create Virtual Environment` | Create a new virtual environment |
| `UV: Run Python Script` | Run a Python script with uv |
| `UV: Add Script Dependency` | Add inline dependencies to a Python script |
| `UV: Install Python Version` | Install a specific Python version |
| `UV: Pin Python Version` | Pin a specific Python version for the project |
| `UV: Install Tool` | Install a Python tool with uv |
| `UV: Run Tool with UVX` | Run a Python tool in an ephemeral environment |

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

> **IMPORTANT**: This extension requires [uv](https://github.com/astral-sh/uv) to be installed on your system. The extension will not function properly without uv installed and available in your PATH.

* Visual Studio Code 1.70.0 or higher
* [uv](https://github.com/astral-sh/uv) installed and available in your PATH

### 💻 Installing uv

You can install uv using one of the following methods:

<details>
<summary><b>macOS / Linux</b></summary>

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
</details>

<details>
<summary><b>Windows</b></summary>

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
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
</details>

---

## 💡 Feedback & Contributions

We welcome feedback and contributions to improve this extension! Feel free to report issues or suggest improvements on our [GitHub repository](https://github.com/the0807/UV-Toolkit).
