# StickrBook Backend - Story Renderer API

A FastAPI wrapper for ComfyUI that provides a clean, queue-based API for children's storybook image generation with **local validation and automatic retry**.

---

## 🎯 Key Features

- **Local Validation**: Uses Ollama Vision (LLaVA) to validate images on the GPU machine
- **Automatic Retry**: Failed images are regenerated up to 3x before returning
- **Only Validated Images Sent**: Frontend only receives quality-checked, consistent images
- **Character Consistency**: IP-Adapter workflow for pixel-perfect character matching
- **Art Style Presets**: 23 styles including Bluey, Gruffalo, and Zog-inspired aesthetics
- **Storyboard Management**: Full project, book, page, and asset management

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.11+
- **ComfyUI** running locally (default: http://127.0.0.1:8188)
- **Ollama** with LLaVA model for validation (optional but recommended)

### Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional)
cp .env.example .env
```

### Configuration

Create a `.env` file or set environment variables:

```env
# Server settings
HOST=0.0.0.0
PORT=8000

# ComfyUI settings
COMFYUI_HOST=127.0.0.1
COMFYUI_PORT=8188
COMFYUI_OUTPUT_DIR=C:\ComfyUI\output

# Worker settings
RENDER_WORKERS=1
JOB_QUEUE_MAX=20

# Authentication (optional)
WORKER_API_KEY=your-secret-key

# Output directory
OUTPUT_DIR=./outputs
```

### Running the Server

```bash
# Development mode with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Storyboard UI**: http://localhost:8000/storyboard

---

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI server with validation loop
├── validator.py         # Ollama Vision validation
├── workflow_builder.py  # ComfyUI workflow templates
├── comfyui_client.py    # ComfyUI HTTP client
├── models.py            # Pydantic models
├── job_queue.py         # Async job queue
├── config.py            # Configuration
├── requirements.txt     # Dependencies
├── database/            # SQLAlchemy database models
│   ├── models.py
│   ├── repository.py
│   └── config.py
├── storyboard/          # Storyboard API routes
│   ├── routes.py
│   ├── models.py
│   ├── presets.py
│   ├── storage.py
│   └── dependencies.py
├── workflows/           # ComfyUI workflow JSON templates
│   ├── 01_scene_empty.json
│   ├── 02_character_isolated.json
│   ├── 03_prop_isolated.json
│   ├── 04_compose_img2img.json
│   ├── 05_inpaint_insert.json
│   ├── 06_refine_img2img.json
│   ├── 07_restyle_img2img.json
│   └── 08_character_variation.json
├── outputs/             # Generated images
├── static/              # Static HTML files
└── tests/               # Unit tests
```

---

## 🔌 API Endpoints

### Core Renderer API

- `GET /v1/health` - Health check
- `GET /v1/capabilities` - Get renderer capabilities
- `POST /v1/jobs` - Submit a render job
- `GET /v1/jobs/{job_id}` - Get job status
- `DELETE /v1/jobs/{job_id}` - Cancel a job
- `GET /v1/jobs/{job_id}/events` - SSE stream for job progress
- `GET /v1/jobs/{job_id}/image` - Download generated image
- `GET /v1/files/{file_id}` - Download file by ID

### Storyboard API

All storyboard endpoints are prefixed with `/v1/storyboard`:

- `GET /presets` - List available art style presets
- `GET /projects` - List all projects
- `POST /projects` - Create a new project
- `GET /books` - List all books
- `POST /books` - Create a new book
- `GET /books/{book_id}` - Get book details
- `POST /books/{book_id}/pages` - Create a page
- `POST /books/{book_id}/generate/variations` - Generate image variations
- `GET /books/{book_id}/assets` - List book assets

See `/docs` for full API documentation.

---

## 🎨 Workflow Types

The renderer supports multiple workflow types for the scene-first pipeline:

1. **scene/background** - Empty environment (no characters)
2. **character_ref** - Isolated character on white background
3. **prop** - Isolated prop/object on white background
4. **ipadapter** - Place character in scene (IP-Adapter)
5. **inpaint** - Insert element into masked area
6. **img2img** - Refine/polish existing image
7. **controlnet** - Structure-preserving restyle

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_models.py
```

---

## 🐛 Debugging

### Check ComfyUI Connection

```bash
curl http://127.0.0.1:8188/system_stats
```

### Check Validation Logs

Look for validation scores in console output:
```
Validation: art=85, scene=90, quality=78, valid=True
```

### Test Validation Manually

```bash
curl -X POST http://127.0.0.1:11434/api/generate \
  -d '{"model": "llava", "prompt": "Describe this image", "images": ["base64..."]}'
```

---

## 📄 License

MIT

