# Backend Setup Checklist

Use this checklist to verify your backend setup is complete and working.

## ✅ Prerequisites

- [ ] Python 3.11 or higher installed
  ```bash
  python --version
  ```

- [ ] ComfyUI installed and accessible
  ```bash
  # Check if ComfyUI is running
  curl http://127.0.0.1:8188/system_stats
  ```

- [ ] (Optional) Ollama with LLaVA model for validation
  ```bash
  ollama list | grep llava
  ```

## ✅ Installation Steps

- [ ] Navigate to backend directory
  ```bash
  cd backend
  ```

- [ ] Create virtual environment
  ```bash
  python -m venv venv
  ```

- [ ] Activate virtual environment
  ```bash
  # macOS/Linux:
  source venv/bin/activate
  
  # Windows:
  venv\Scripts\activate
  ```

- [ ] Install dependencies
  ```bash
  pip install -r requirements.txt
  ```

- [ ] Create .env file
  ```bash
  cp .env.example .env
  ```

- [ ] Edit .env with your settings
  ```bash
  # Edit these values in .env:
  # - COMFYUI_HOST (default: 127.0.0.1)
  # - COMFYUI_PORT (default: 8188)
  # - COMFYUI_OUTPUT_DIR (path to ComfyUI output folder)
  ```

## ✅ Verify File Structure

- [ ] Core files present
  ```bash
  ls -1 *.py
  # Should show: main.py, config.py, models.py, etc.
  ```

- [ ] Database module present
  ```bash
  ls -1 database/
  # Should show: __init__.py, models.py, repository.py, config.py
  ```

- [ ] Storyboard module present
  ```bash
  ls -1 storyboard/
  # Should show: routes.py, models.py, presets.py, etc.
  ```

- [ ] Workflow templates present
  ```bash
  ls -1 workflows/*.json
  # Should show 8 workflow JSON files
  ```

## ✅ Start the Server

- [ ] Start in development mode
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```

- [ ] Verify server is running
  ```bash
  # In a new terminal:
  curl http://localhost:8000/v1/health
  # Should return: {"status":"ok","comfyui":"connected"}
  ```

## ✅ Test API Endpoints

- [ ] Check API documentation
  - Open browser: http://localhost:8000/docs
  - Should see FastAPI Swagger UI

- [ ] Test health endpoint
  ```bash
  curl http://localhost:8000/v1/health
  ```

- [ ] Test capabilities endpoint
  ```bash
  curl http://localhost:8000/v1/capabilities
  ```

- [ ] Test presets endpoint
  ```bash
  curl http://localhost:8000/v1/storyboard/presets
  ```

- [ ] Test projects endpoint
  ```bash
  curl http://localhost:8000/v1/storyboard/projects
  ```

## ✅ Frontend Integration

- [ ] Update frontend .env
  ```bash
  # In the root stickrbook directory:
  echo "VITE_BACKEND_URL=http://localhost:8000" > .env
  echo "VITE_USE_MOCKS=false" >> .env
  ```

- [ ] Start frontend
  ```bash
  # In the root stickrbook directory:
  npm run dev
  ```

- [ ] Test frontend connection
  - Open browser: http://localhost:5173
  - Check browser console for API errors
  - Try creating a project or book

## ✅ Common Issues

### ComfyUI Connection Failed
```bash
# Check if ComfyUI is running:
curl http://127.0.0.1:8188/system_stats

# If not running, start ComfyUI:
cd /path/to/ComfyUI
python main.py --listen
```

### Port Already in Use
```bash
# Use a different port:
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Update frontend .env:
VITE_BACKEND_URL=http://localhost:8001
```

### Module Import Errors
```bash
# Make sure virtual environment is activated:
which python
# Should show: /path/to/backend/venv/bin/python

# Reinstall dependencies:
pip install -r requirements.txt
```

### Database Errors
```bash
# Initialize database:
alembic upgrade head

# Or delete and recreate:
rm storyboard.db
# Restart server - it will create a new database
```

## ✅ Success Criteria

You're all set when:
- ✅ Backend server starts without errors
- ✅ http://localhost:8000/docs shows API documentation
- ✅ Health check returns `{"status":"ok"}`
- ✅ Frontend can connect and make API calls
- ✅ You can create projects and books
- ✅ Image generation jobs can be submitted

## 🎉 Next Steps

Once everything is working:
1. Read the [backend/README.md](README.md) for detailed documentation
2. Explore the API at http://localhost:8000/docs
3. Try generating your first storybook image!
4. Check out the workflow templates in `workflows/` directory

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ComfyUI Documentation](https://github.com/comfyanonymous/ComfyUI)
- [Ollama Documentation](https://ollama.ai/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

