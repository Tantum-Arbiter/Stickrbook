# 🐳 Stickrbook Docker Guide

## Why Docker?

✅ **No dependency hell** - Everything works out of the box  
✅ **Consistent environment** - Same setup on any machine  
✅ **Easy startup** - One command to start everything  
✅ **Isolated** - Won't conflict with other Python/Node projects  

---

## Prerequisites

### 1. Install Docker Desktop

**Download:** https://www.docker.com/products/docker-desktop/

**Windows Requirements:**
- Windows 10/11 64-bit (Pro, Enterprise, or Education)
- WSL 2 enabled (Docker Desktop will help you set this up)
- At least 4GB RAM allocated to Docker

**After Installation:**
- Start Docker Desktop
- Wait for it to say "Docker Desktop is running"

---

### 2. ComfyUI (Still Runs Separately)

ComfyUI needs to run **outside** Docker because it needs direct GPU access.

**Start ComfyUI:**
```cmd
cd C:\path\to\your\ComfyUI
python main.py
```

Wait for: `"To see the GUI go to: http://127.0.0.1:8188"`

---

## 🚀 Quick Start (Windows)

### **Option 1: Double-Click (Easiest!)**

1. **Start ComfyUI** (in a separate terminal)
2. **Double-click:** `docker-start.bat`
3. **Wait** for browser to open to http://localhost:5173

That's it! 🎉

---

### **Option 2: Command Line**

```cmd
REM 1. Start ComfyUI first
cd C:\path\to\ComfyUI
python main.py

REM 2. In a new terminal, start Docker services
cd C:\Users\lco47\Workspace\Stickrbook
docker-compose up -d

REM 3. Open browser
start http://localhost:5173
```

---

## 📋 Docker Commands

### Start Services
```cmd
docker-compose up -d
```

### Stop Services
```cmd
docker-compose down
```

### View Logs
```cmd
REM All services
docker-compose logs -f

REM Just backend
docker-compose logs -f backend

REM Just frontend
docker-compose logs -f frontend
```

### Restart Services
```cmd
docker-compose restart
```

### Rebuild After Code Changes
```cmd
docker-compose down
docker-compose build
docker-compose up -d
```

### Check Status
```cmd
docker-compose ps
```

---

## 🔍 Verify Everything is Running

After starting, check these URLs:

| Service | URL | Expected |
|---------|-----|----------|
| **Frontend** | http://localhost:5173 | Stickrbook UI |
| **Backend** | http://localhost:8000/health | `{"status":"healthy"}` |
| **Backend API** | http://localhost:8000/docs | API Documentation |
| **ComfyUI** | http://localhost:8188 | ComfyUI Interface |

---

## 🎨 Story Generator with Docker

Once Docker services are running:

```cmd
cd C:\Users\lco47\Workspace\Stickrbook

REM Install dependencies (first time only)
pip install aiohttp rich

REM Generate images
python scripts\story_generator.py --style watercolour --count 5

REM Generate all styles
python scripts\story_generator.py --style all --count 5
```

The story generator runs on your **host machine** and connects to the **Dockerized backend**.

---

## 🛠️ Troubleshooting

### "Docker is not running"
- Start Docker Desktop
- Wait for the whale icon to stop animating
- Try again

### "Cannot connect to ComfyUI"
- Make sure ComfyUI is running on http://localhost:8188
- Check: `curl http://localhost:8188`
- Docker uses `host.docker.internal:8188` to connect to ComfyUI on your host

### "Port already in use"
- Stop other services using ports 8000 or 5173
- Or change ports in `docker-compose.yml`

### Backend won't start
```cmd
REM View backend logs
docker-compose logs backend

REM Restart backend
docker-compose restart backend
```

### Frontend won't start
```cmd
REM View frontend logs
docker-compose logs frontend

REM Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### "No space left on device"
```cmd
REM Clean up Docker
docker system prune -a
```

---

## 📁 File Structure

```
Stickrbook/
├── docker-compose.yml          # Main Docker configuration
├── docker-start.bat            # Windows startup script
├── docker-stop.bat             # Windows stop script
├── Dockerfile.dev              # Frontend Dockerfile
├── backend/
│   ├── Dockerfile              # Backend Dockerfile
│   ├── requirements.txt        # Python dependencies
│   └── requirements-ai.txt     # AI dependencies (optional)
└── scripts/
    └── story_generator.py      # Runs on host, connects to Docker backend
```

---

## 🔄 Development Workflow

### Making Code Changes

**Backend changes:**
```cmd
REM Code is mounted as volume - changes auto-reload!
REM Just edit files and save
```

**Frontend changes:**
```cmd
REM Code is mounted as volume - Vite hot-reloads!
REM Just edit files and save
```

**Dependency changes:**
```cmd
REM If you add new packages, rebuild:
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🎯 Complete Workflow

### First Time Setup
1. Install Docker Desktop
2. Clone/pull latest code
3. Start ComfyUI
4. Run `docker-start.bat`

### Daily Use
1. Start Docker Desktop (if not running)
2. Start ComfyUI
3. Run `docker-start.bat`
4. Start creating! 🎨

### Shutdown
1. Run `docker-stop.bat`
2. Stop ComfyUI (Ctrl+C)
3. Close Docker Desktop (optional)

---

## 💡 Pro Tips

1. **Keep Docker Desktop running** - It uses minimal resources when idle
2. **Use volumes** - Your data persists even if containers restart
3. **Check logs** - `docker-compose logs -f` shows real-time logs
4. **Clean up** - Run `docker system prune` monthly to free space
5. **GPU for AI** - ComfyUI runs on host for direct GPU access

---

## 🚀 Next Steps

Once Docker is running:

1. ✅ Verify all services at the URLs above
2. ✅ Test image generation in the UI
3. ✅ Run story generator: `python scripts\story_generator.py --style all --count 5`
4. ✅ Start creating your storybook! 📚

---

**Happy Dockerizing!** 🐳✨

