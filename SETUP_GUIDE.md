# Stickrbook Setup Guide

Quick reference for setting up Stickrbook on different platforms.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** (optional) ([Download](https://git-scm.com/))
- **ComfyUI** installed and working ([Setup Guide](https://github.com/comfyanonymous/ComfyUI))
- **(Optional) NVIDIA GPU** with CUDA for faster AI processing

---

## 🚀 Quick Setup

### macOS / Linux

```bash
# 1. Make setup script executable
chmod +x setup-local.sh

# 2. Run setup
./setup-local.sh

# 3. Start all services
./start-all.sh
```

### Windows

**Option 1: Double-click** (Easiest)
1. Double-click `setup.bat`
2. Follow the prompts
3. Double-click `start.bat` to start services

**Option 2: PowerShell**
```powershell
# 1. Open PowerShell as Administrator
# 2. Allow script execution (one-time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Run setup
.\setup-local.ps1

# 4. Start all services
.\start-all.ps1
```

---

## 📁 Available Scripts

### macOS / Linux

| Script | Purpose |
|--------|---------|
| `setup-local.sh` | One-time setup (install dependencies, create database) |
| `start-all.sh` | Start all services (backend + frontend) |
| `stop-all.sh` | Stop all services |

### Windows

| Script | Purpose |
|--------|---------|
| `setup.bat` | One-time setup (double-click friendly) |
| `setup-local.ps1` | One-time setup (PowerShell) |
| `start.bat` | Start all services (double-click friendly) |
| `start-all.ps1` | Start all services (PowerShell) |
| `stop.bat` | Stop all services (double-click friendly) |
| `stop-all.ps1` | Stop all services (PowerShell) |

---

## 🔧 Manual Setup

If automated scripts don't work, follow the manual steps in [RUNBOOK.md](./RUNBOOK.md).

---

## 🧪 Verify Installation

After setup, verify everything works:

### 1. Check Backend
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

### 2. Check Frontend
Open browser: http://localhost:5173

### 3. Check ComfyUI Connection
```bash
curl http://localhost:8000/capabilities
# Expected: JSON with ComfyUI capabilities
```

---

## 🐛 Common Issues

### "Python not found"
- **macOS/Linux**: Install via `brew install python3` or download from python.org
- **Windows**: Download from python.org and check "Add to PATH" during installation

### "Node.js not found"
- Download from nodejs.org
- Verify: `node --version` should show v18 or higher

### "Permission denied" (macOS/Linux)
```bash
chmod +x setup-local.sh start-all.sh stop-all.sh
```

### "Execution Policy" error (Windows)
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Port already in use"
- **Backend (8000)**: Another app is using port 8000
- **Frontend (5173)**: Another Vite app is running
- **Solution**: Stop other services or run `./stop-all.sh` / `.\stop-all.ps1`

### "ComfyUI not connecting"
1. Make sure ComfyUI is running: http://localhost:8188
2. Check `backend/.env` has correct URL: `COMFYUI_URL=http://localhost:8188`

### "AI dependencies failed to install"
- **GPU users**: Make sure CUDA is installed
- **CPU users**: Set `MAGIC_MERGE_DEVICE=cpu` in `backend/.env`
- **Low disk space**: AI models need ~3GB free space

---

## 📊 System Requirements

### Minimum (CPU-only)
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 10GB free
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 20.04+

### Recommended (GPU)
- **CPU**: 8 cores
- **RAM**: 16GB
- **GPU**: NVIDIA RTX 3060+ (8GB VRAM)
- **Storage**: 20GB free
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 20.04+

---

## 🎯 Next Steps

After successful setup:

1. **Open the app**: http://localhost:5173
2. **Create a project**: Click "New Project"
3. **Generate assets**: Go to "Generate" tab
4. **Try the editor**: Go to "Edit" tab → "Try Advanced Editor"
5. **Read the docs**: See [RUNBOOK.md](./RUNBOOK.md) for detailed usage

---

## 📚 Additional Resources

- **Full Documentation**: [RUNBOOK.md](./RUNBOOK.md)
- **Integration Guide**: [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- **Commercial Plan**: [COMMERCIAL_INTEGRATION_PLAN.md](./COMMERCIAL_INTEGRATION_PLAN.md)
- **Photo Editor Docs**: [src/editor/README.md](./src/editor/README.md)

---

## 💬 Getting Help

If you encounter issues:

1. Check [RUNBOOK.md](./RUNBOOK.md) troubleshooting section
2. Check logs:
   - Backend: `backend/logs/` or `logs/backend.log`
   - Frontend: `logs/frontend.log`
3. Open an issue on GitHub

---

**Happy creating! 🎨**

