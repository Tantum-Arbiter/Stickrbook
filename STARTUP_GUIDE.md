# 🚀 Stickrbook Startup Guide (Windows)

## Quick Start - One Command!

**Double-click** `start_all.bat` in your project root folder.

This will automatically start:
1. ✅ ComfyUI
2. ✅ Backend (FastAPI)
3. ✅ Frontend (React)

---

## Manual Startup (Step by Step)

### Step 1: Start ComfyUI

**Open Command Prompt #1:**
```cmd
cd C:\Users\lco47\Workspace\Stickrbook\ComfyUI
run_nvidia_gpu.bat
```

**Wait for**: `"To see the GUI go to: http://127.0.0.1:8188"`

---

### Step 2: Start Backend

**Open Command Prompt #2:**
```cmd
cd C:\Users\lco47\Workspace\Stickrbook\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Wait for**: `"Application startup complete"`

---

### Step 3: Start Frontend

**Open Command Prompt #3:**
```cmd
cd C:\Users\lco47\Workspace\Stickrbook
npm start
```

**Wait for**: Browser opens to `http://localhost:3000`

---

## Verification

After starting, verify everything is running:

| Service | URL | Expected Result |
|---------|-----|-----------------|
| ComfyUI | http://127.0.0.1:8188 | ComfyUI interface |
| Backend API Docs | http://localhost:8000/docs | Swagger API documentation |
| Backend Health | http://localhost:8000/health | `{"status":"healthy"}` |
| Frontend | http://localhost:3000 | Stickrbook UI |

---

## Story Generator

Once everything is running, generate images:

**Open Command Prompt #4:**
```cmd
cd C:\Users\lco47\Workspace\Stickrbook

REM Install dependencies (first time only)
pip install -r scripts\requirements.txt

REM Generate 5 watercolour images
scripts\generate_story.bat watercolour 5

REM Generate all 5 styles (75 images!)
scripts\generate_story.bat all 5
```

---

## Troubleshooting

### ComfyUI won't start
- Check if Python is installed: `python --version`
- Make sure you're in the ComfyUI directory
- Try: `python main.py` instead of the batch file

### Backend won't start
- Install uvicorn: `pip install uvicorn fastapi`
- Check if port 8000 is already in use
- Try a different port: `uvicorn main:app --port 8001`

### Frontend won't start
- Install dependencies: `npm install`
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and run `npm install` again

### "Connection refused" in Story Generator
- Make sure backend is running on http://localhost:8000
- Check: `curl http://localhost:8000/health`
- Restart the backend

---

## Stopping Services

**Option 1**: Close each Command Prompt window

**Option 2**: Press `Ctrl+C` in each terminal

**Option 3**: Task Manager → End the processes:
- `python.exe` (ComfyUI)
- `python.exe` (Backend/Uvicorn)
- `node.exe` (Frontend)

---

## Quick Reference

```cmd
# Start ComfyUI
cd ComfyUI && run_nvidia_gpu.bat

# Start Backend
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start Frontend
npm start

# Generate Images
scripts\generate_story.bat all 5
```

---

## Tips

💡 **Use the `start_all.bat` script** for one-click startup!

💡 **Keep terminals open** - closing them stops the services

💡 **Check health endpoint** before generating images

💡 **First generation is slow** - model loading takes time

💡 **Subsequent generations are fast** - ~10-20s per image

---

Happy creating! 🎨✨

