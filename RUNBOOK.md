# Stickrbook Local Setup Runbook

Complete guide to get everything running locally with one script.

> **Quick Start?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for platform-specific quick setup instructions.

---

## 📋 Prerequisites

Before running the setup script, ensure you have:

- [ ] **Python 3.10+** installed (`python --version`)
- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **npm** or **pnpm** installed (`npm --version`)
- [ ] **Git** installed (`git --version`)
- [ ] **ComfyUI** already installed and working
- [ ] **(Optional) NVIDIA GPU** with CUDA for AI features

### Platform-Specific Notes

**macOS:**
- Use Homebrew for easy installation: `brew install python node`
- Scripts use bash (`.sh` files)

**Windows:**
- Download installers from official websites
- Use PowerShell (`.ps1` files) or batch files (`.bat` for double-click)
- May need to enable script execution: `Set-ExecutionPolicy RemoteSigned`

**Linux:**
- Use your package manager: `apt install python3 nodejs npm`
- Scripts use bash (`.sh` files)

---

## 🚀 Quick Start (One Command)

### macOS / Linux

```bash
# Make script executable and run
chmod +x setup-local.sh
./setup-local.sh
```

### Windows (PowerShell)

```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-local.ps1
```

This will:
1. ✅ Check all prerequisites
2. ✅ Install frontend dependencies
3. ✅ Install backend dependencies
4. ✅ Set up environment variables
5. ✅ Initialize database
6. ✅ (Optional) Install AI dependencies
7. ✅ Start all services

---

## 📝 Manual Setup (Step by Step)

If you prefer to run steps manually:

### Step 1: Clone Repository (if not already done)
```bash
git clone https://github.com/Tantum-Arbiter/Stickrbook.git
cd Stickrbook
```

### Step 2: Frontend Setup
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Step 3: Backend Setup

**macOS / Linux:**
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install base dependencies
pip install -r requirements.txt

# Initialize database
alembic upgrade head

# (Optional) Install AI dependencies for Magic Merge
pip install -r requirements-ai.txt

cd ..
```

**Windows (PowerShell):**
```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install base dependencies
pip install -r requirements.txt

# Initialize database
alembic upgrade head

# (Optional) Install AI dependencies for Magic Merge
pip install -r requirements-ai.txt

cd ..
```

### Step 4: Configure ComfyUI Connection
```bash
# Edit backend/.env
cd backend
cp .env.example .env
nano .env
```

Add:
```bash
COMFYUI_URL=http://localhost:8188
MAGIC_MERGE_DEVICE=cuda  # or 'cpu' if no GPU
```

### Step 5: Start Services

**macOS / Linux:**

**Terminal 1 - ComfyUI** (if not already running):
```bash
cd /path/to/ComfyUI
python main.py
# Wait for: "To see the GUI go to: http://127.0.0.1:8188"
```

**Terminal 2 - Backend**:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Wait for: "Application startup complete"
```

**Terminal 3 - Frontend**:
```bash
npm run dev
# Wait for: "Local: http://localhost:5173"
```

**Windows (PowerShell):**

**Terminal 1 - ComfyUI** (if not already running):
```powershell
cd \path\to\ComfyUI
python main.py
# Wait for: "To see the GUI go to: http://127.0.0.1:8188"
```

**Terminal 2 - Backend**:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Wait for: "Application startup complete"
```

**Terminal 3 - Frontend**:
```powershell
npm run dev
# Wait for: "Local: http://localhost:5173"
```

### Step 6: Verify Everything Works
```bash
# Run verification script
./verify-setup.sh
```

---

## 🔧 Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
```

### Backend (backend/.env)
```bash
# ComfyUI
COMFYUI_URL=http://localhost:8188

# Database
DATABASE_URL=sqlite:///./stickrbook.db

# Storage
STORAGE_ROOT=./storage

# Magic Merge
MAGIC_MERGE_DEVICE=cuda  # or 'cpu'
TRANSFORMERS_CACHE=./models  # Optional: cache AI models

# Optional: PostgreSQL (for production)
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost/stickrbook
```

---

## 🧪 Testing the Setup

### 1. Test Frontend
```bash
# Open browser
open http://localhost:5173

# You should see the Stickrbook UI
```

### 2. Test Backend
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

### 3. Test ComfyUI Connection
```bash
curl http://localhost:8000/capabilities
# Expected: JSON with ComfyUI capabilities
```

### 4. Test Magic Merge (if AI installed)
```bash
curl -X POST http://localhost:8000/v1/magic-merge/segment \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'
# Expected: JSON with mask data
```

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend won't start

**Error: "Error loading ASGI app. Could not import module 'main'"**

This means you're not in the correct directory or the virtual environment isn't activated.

**Fix:**
```bash
# macOS/Linux
# 1. Navigate to backend directory
cd backend

# 2. Verify you're in the right place
pwd  # Should show: .../Stickrbook/backend
ls main.py  # Should show: main.py

# 3. Activate virtual environment
source venv/bin/activate

# 4. Start uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

```powershell
# Windows
# 1. Navigate to backend directory
cd backend

# 2. Verify you're in the right place
pwd  # Should show: ...\Stickrbook\backend
ls main.py  # Should show: main.py

# 3. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 4. Start uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Other backend issues:**
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### ComfyUI not connecting
```bash
# Check if ComfyUI is running
curl http://localhost:8188
# If fails, start ComfyUI first

# Check backend .env has correct URL
cat backend/.env | grep COMFYUI_URL
```

### Magic Merge errors

**Error: "no onnxruntime backend found, please install rembg with cpu or gpu support"**

This means AI dependencies aren't installed. You have two options:

**Error: "module 'onnxruntime' has no attribute 'set_default_logger_severity'"**

This is a compatibility issue between `rembg` and `onnxruntime`. The fix has been applied to the code, but you may need to reinstall dependencies:

```bash
# macOS/Linux
cd backend
source venv/bin/activate
pip uninstall rembg onnxruntime -y
pip install -r requirements-ai.txt
```

```powershell
# Windows
cd backend
.\venv\Scripts\Activate.ps1
pip uninstall rembg onnxruntime -y
pip install -r requirements-ai.txt
```

If the error persists, try pinning specific versions:
```bash
pip install onnxruntime==1.16.3
pip install rembg==2.0.50
```

**Option 1: Install AI Dependencies (Recommended)**

**macOS/Linux:**
```bash
cd backend
source venv/bin/activate

# Install AI dependencies
pip install -r requirements-ai.txt

# For GPU support (NVIDIA only) - replace onnxruntime with GPU version
pip uninstall onnxruntime -y
pip install onnxruntime-gpu
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# For CPU only (default), edit backend/.env:
# MAGIC_MERGE_DEVICE=cpu
```

**Windows:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1

# Install AI dependencies
pip install -r requirements-ai.txt

# For GPU support (NVIDIA only) - replace onnxruntime with GPU version
pip uninstall onnxruntime -y
pip install onnxruntime-gpu
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# For CPU only (default), edit backend/.env:
# MAGIC_MERGE_DEVICE=cpu
```

**Note:** The `requirements-ai.txt` includes `onnxruntime` (CPU version) by default. If you have an NVIDIA GPU, replace it with `onnxruntime-gpu` for better performance.

**Option 2: Temporarily Disable Magic Merge (Quick Start)**

If you want to run the app without AI features:

1. Edit `backend/main.py`
2. Comment out line 39:
   ```python
   # from magic_merge.routes import router as magic_merge_router
   ```
3. Comment out line 288:
   ```python
   # app.include_router(magic_merge_router)
   ```
4. Restart the backend

This allows you to use all features except Magic Merge. You can enable it later by installing AI dependencies and uncommenting those lines.

### Database errors
```bash
# Reset database
cd backend
rm stickrbook.db
alembic upgrade head
```

---

## 📦 What Gets Installed

### Frontend Dependencies (~500MB)
- React, TypeScript, Vite
- Zustand (state management)
- Konva (canvas rendering)
- Lucide icons
- TailwindCSS

### Backend Dependencies (~200MB)
- FastAPI, Uvicorn
- SQLAlchemy, Alembic
- Pydantic, httpx
- Pillow (image processing)

### AI Dependencies (Optional, ~3GB)
- rembg (background removal)
- transformers (CLIP, Depth-Anything)
- torch, torchvision (PyTorch)
- opencv-python (Poisson blending)
- scikit-learn, scipy

---

## 🎯 Next Steps

After setup is complete:

1. **Create a Project**
   - Go to http://localhost:5173
   - Click "New Project"
   - Create your first book

2. **Generate Assets**
   - Go to "Generate" tab
   - Enter a prompt: "A magical forest"
   - Click "Generate"
   - Wait for ComfyUI to generate images

3. **Try Photo Editor**
   - Go to "Edit" tab
   - Click an asset to load it
   - Click "Try Advanced Editor"
   - Import another asset and use Magic Merge

4. **Create a Story**
   - Go to "Story" tab
   - Add text to your pages
   - Export your storybook!

---

## 🔄 Daily Workflow

**macOS / Linux:**
```bash
# Start everything (run from project root)
./start-all.sh

# Stop everything
./stop-all.sh
```

**Windows (PowerShell):**
```powershell
# Start everything (run from project root)
.\start-all.ps1

# Stop everything
.\stop-all.ps1
```

---

## 📊 System Requirements

### Minimum (CPU-only)
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 10GB free
- **Speed**: Magic Merge ~15-30s

### Recommended (GPU)
- **CPU**: 8 cores
- **RAM**: 16GB
- **GPU**: NVIDIA RTX 3060+ (8GB VRAM)
- **Storage**: 20GB free
- **Speed**: Magic Merge ~4-6s

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run `./verify-setup.sh` to diagnose
3. Check logs in `backend/logs/`
4. Open an issue on GitHub

---

**Setup complete! Happy creating! 🎨**

