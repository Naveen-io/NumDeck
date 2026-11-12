# Numpad Deck

<div align="center">

**Turn your laptop's physical numeric keypad into a customizable Elgato Stream Deck control surface.**

[![Rust](https://img.shields.io/badge/Rust-1.99-black?logo=rust)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-cyan?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6?logo=windows)](https://microsoft.com)

</div>

---

## ⚡ Overview

**Numpad Deck** is an ultra-lightweight, native Windows utility that repurposes unused physical numeric keypads into a high-performance macro deck and command centre.

- **Zero-Lag Event-Driven Interception**: Uses a native Windows low-level keyboard hook (`WH_KEYBOARD_LL`) in Rust with zero polling loops.
- **Micro Footprint**: Consumes under **40 MB idle RAM** and **<0.1% idle CPU**. The complete production NSIS installer is only **1.79 MB**.
- **NumLock State Independent**: Distinct scan code and extended-flag matching captures numpad keys reliably whether NumLock is ON or OFF, while preserving all regular typing and arrow keys.
- **Fail-Safe Restoration**: Instantly restores standard keyboard typing on toggle, exit, or via emergency release (`Ctrl + Alt + Shift + Esc`).
- **Stream Deck-Style Interaction**: Profiles, folders (sub-pages), macro sequences, custom colors, Lucide icons, and hotkey triggers.

---

## 📦 Download & Installers

Built production artifacts ready for Windows 10/11:

- **NSIS Installer**: [`src-tauri/target/release/bundle/nsis/Numpad Deck_1.0.0_x64-setup.exe`](file:///D:/Apps/Numdeck/src-tauri/target/release/bundle/nsis/Numpad%20Deck_1.0.0_x64-setup.exe) (1.79 MB)
- **MSI Installer**: [`src-tauri/target/release/bundle/msi/Numpad Deck_1.0.0_x64_en-US.msi`](file:///D:/Apps/Numdeck/src-tauri/target/release/bundle/msi/Numpad%20Deck_1.0.0_x64_en-US.msi) (2.52 MB)
- **Direct Standalone Binary**: [`src-tauri/target/release/numpad-deck.exe`](file:///D:/Apps/Numdeck/src-tauri/target/release/numpad-deck.exe)

---

## 🚀 Key Features

### 1. Central Interactive Deck Workspace
- Accurate representation of standard physical laptop numpad geometry (17-key layout with 2x tall `+` and `Enter`, 2x wide `0`, and compact 18-key 4x5 layout option).
- Real-time visual feedback: tiles animate with glowing halos when pressed on the physical keyboard.
- Live button editor: customize title, icon, accent color, and action binding.

### 2. Extensible Action Architecture
- **Launch Application**: Launch executables with custom CLI arguments and working directories.
- **Open URL**: Open websites in the user's default browser safely without shell injection.
- **Open Files & Folders**: Quick-access directories and files via Windows ShellExecute.
- **Simulate Shortcuts**: Send synthetic hotkeys (e.g. `Ctrl+Shift+Esc`, `Win+D`) marked with `0xDEC42` extra info so the hook never recurses.
- **Type Text**: Paste snippets or auto-type unicode text.
- **System & Media**: Volume Up/Down/Mute, Play/Pause, Next/Previous Track, Lock Workstation.
- **Folder Navigation**: Create nested button pages with automatic `Back` navigation.
- **Profile Switching**: Swap profiles directly from a single key.
- **Multi-Actions**: Execute sequential macro steps with customizable millisecond delays.

### 3. First-Launch Onboarding
- **Step 1 — Welcome**: Introduction to your new command centre.
- **Step 2 — Detect Keyboard**: Automatically inspects Windows RawInput devices, checks NumLock status, and provides an interactive key verification test.
- **Step 3 — Configure Deck Mode**: Configures the global activation shortcut (default: `Ctrl + Alt + F12`), tests the toggle live, and launches the workspace.

### 4. Profiles & Folder System
- Default built-in profiles: **General**, **Streaming**, **Coding**, **Gaming**, and **Editing**.
- Create, duplicate, rename, delete, export, and import profile backups.
- Folders open another 17-key layer with a designated Back key.

### 5. Native Windows Integration
- **System Tray**: Minimize-to-tray on window close, quick Deck Mode toggle, settings shortcut, and clean exit.
- **Diagnostics Utility**: Real-time event monitor showing virtual key codes (VK), hardware scan codes, and event types.

---

## 🛠️ Development & Building

### Prerequisites
- Windows 10/11
- Rust 1.80+ (MSVC toolchain)
- Node.js 18+ and npm

### Development Mode
```bash
npm install
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
```

---

## 🔬 Verified Performance Benchmarks

| Metric | Measured Real Value | Target / Requirement |
| :--- | :--- | :--- |
| **Idle Memory (WorkingSet)** | **39.44 MB** | < 80 MB |
| **Startup CPU Overhead** | **0.29 s** | < 1.0 s |
| **NSIS Installer Size** | **1.79 MB** | < 10 MB |
| **MSI Package Size** | **2.52 MB** | < 15 MB |
| **Keyboard Polling Loops** | **0 (Event-Driven Hook)** | 0 |
