# Getting Started with StickrBook

## 🎯 What You Need to Run

Since you're working cross-platform (Windows/Mac), here's what you need:

### ✅ **Right Now - Mock Mode (No Backend)**

You can start using the app **immediately** with mock data:

```bash
# The .env file is already configured for mock mode
npm run dev
```

Then open **http://localhost:5173** in your browser.

### What Works in Mock Mode:
- ✅ Full UI exploration
- ✅ Create projects and books
- ✅ Test all the new storybook themes
- ✅ Click "Generate" button (returns placeholder images)
- ✅ All UI interactions and workflows

### What Doesn't Work:
- ❌ Real AI image generation
- ❌ Actual ComfyUI integration
- ❌ Persistent data storage

---

## 🔧 **Later - Real Backend (For AI Generation)**

To get **real AI image generation**, you need a separate backend server.

### Backend Requirements:

The backend is **NOT included** in this repository. You need:

1. **Python FastAPI server** that implements the StickrBook API
2. **ComfyUI** running for Stable Diffusion image generation
3. **Database** for storing projects/books/pages

### Expected Backend Structure:

```
backend/
├── main.py              # FastAPI app
├── requirements.txt     # Python dependencies
├── api/
│   ├── projects.py     # Project endpoints
│   ├── books.py        # Book endpoints
│   └── generation.py   # Image generation
├── comfyui/            # ComfyUI integration
└── storage/            # File storage
```

### To Run with Real Backend:

1. **Get or build the backend** (not in this repo)
2. **Start the backend server**:
   ```bash
   cd path/to/backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Update your `.env` file**:
   ```env
   VITE_USE_MOCKS=false
   VITE_BACKEND_URL=http://localhost:8000
   ```

4. **Restart the frontend**:
   ```bash
   npm run dev
   ```

---

## 🎨 Using the New Features

### 1. **Select a Storybook Theme**

At the top of the Generate panel, you'll see a dropdown with themes:
- 🧚 Classic Fairy Tale
- 🗺️ Adventure Story
- 📚 Educational
- 🌙 Bedtime Story
- etc.

Each theme automatically applies:
- Art style guidance
- Child-safe negative prompts
- Appropriate color palettes

### 2. **Choose a Preset**

Pick from Scene, Character, or Object presets. They'll inherit your selected theme's style.

### 3. **Generate**

Click the "Generate Variations" button. In mock mode, you'll see placeholder images. With a real backend, you'll get AI-generated images.

---

## 🐛 Troubleshooting

### "Cannot connect to backend server"

**In Mock Mode:** This shouldn't happen. Check that `.env` has `VITE_USE_MOCKS=true`

**In Real Mode:** 
- Make sure backend is running: `curl http://localhost:8000/v1/health`
- Check `.env` has correct `VITE_BACKEND_URL`
- Restart dev server after changing `.env`

### "Please create or select a book first"

You need to:
1. Create a project (left sidebar)
2. Create a book inside that project
3. Then you can generate images

### Mock images not showing

The mock returns SVG placeholders. They should display immediately. Check browser console for errors.

---

## 📚 Next Steps

1. **Explore the UI** in mock mode
2. **Test the new themes** and presets
3. **Find or build the backend** if you need real AI generation
4. **Customize the themes** in `src/components/generate/PromptInput.tsx`

---

## 🆘 Need Help?

- Check `README.md` for full documentation
- Review API types in `src/api/types.ts` to understand backend requirements
- Look at mock handlers in `src/test/mocks/handlers.ts` for API examples

