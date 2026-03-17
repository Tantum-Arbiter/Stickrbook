# StickrBook - Grow with Freya

A children's storybook creation tool with AI-powered image generation.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- (Optional) Backend server for AI image generation

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Running the App

#### Option 1: With Mock Data (No Backend Required)

Perfect for UI development and testing:

```bash
# Create .env file
echo "VITE_USE_MOCKS=true" > .env

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Option 2: With Real Backend

**Step 1: Start the Backend**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (first time only)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at http://localhost:8000

**Step 2: Start the Frontend**

```bash
# In a new terminal, from the root directory
# Edit .env file
VITE_BACKEND_URL=http://localhost:8000
VITE_USE_MOCKS=false

# Start the dev server
npm run dev
```

**Backend Requirements:**
- Python 3.11+
- ComfyUI running at http://127.0.0.1:8188
- (Optional) Ollama with LLaVA for image validation

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

## 🎨 Features

### Storybook Themes

Choose from 8 child-friendly themes:
- 🧚 **Classic Fairy Tale** - Whimsical watercolor style
- 🗺️ **Adventure Story** - Vibrant and dynamic
- 📚 **Educational** - Clear, friendly illustrations
- 🌙 **Bedtime Story** - Soft, calming colors
- 🌿 **Nature & Animals** - Natural, organic style
- ✨ **Fantasy & Magic** - Enchanting with sparkles
- 💕 **Friendship & Kindness** - Warm and heartfelt
- 🎉 **Silly & Fun** - Playful and energetic

### Safety Features

- **Child-safe negative prompts** automatically filter inappropriate content
- **IP protection** prevents generation of copyrighted characters
- **Quality controls** ensure high-quality, age-appropriate illustrations

### Generation Modes

- **Scene** - Full storybook page backgrounds
- **Character** - Character designs with poses and expressions
- **Object** - Props and items for your story
- **Sketch** - Quick concept sketches

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check for linting errors
npm run lint:fix         # Fix linting errors
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Testing
npm run test             # Run unit tests
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run e2e              # Run E2E tests
npm run e2e:ui           # Run E2E tests with UI
```

## 🛠️ Tech Stack

### Frontend
- **React** 18 + **TypeScript**
- **Vite** - Fast build tool
- **Zustand** - State management
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **MSW** - API mocking

### Backend
- **FastAPI** - Modern Python web framework
- **ComfyUI** - Stable Diffusion workflow engine
- **SQLAlchemy** - Database ORM
- **Ollama Vision** - Image validation (optional)
- **Pydantic** - Data validation

## 📁 Project Structure

```
stickrbook/
├── src/                  # Frontend React application
│   ├── api/             # API client and endpoints
│   ├── components/      # React components
│   │   ├── editor/     # Canvas editor components
│   │   ├── generate/   # Image generation UI
│   │   ├── sidebar/    # Project/asset management
│   │   └── ui/         # Reusable UI components
│   ├── store/          # Zustand state management
│   ├── styles/         # CSS styles
│   └── test/           # Test utilities and mocks
│
└── backend/             # Python FastAPI backend
    ├── main.py         # FastAPI application
    ├── comfyui_client.py  # ComfyUI integration
    ├── workflow_builder.py # Workflow templates
    ├── validator.py    # Image validation
    ├── job_queue.py    # Async job queue
    ├── models.py       # Pydantic models
    ├── config.py       # Configuration
    ├── database/       # SQLAlchemy models
    ├── storyboard/     # Storyboard API routes
    ├── workflows/      # ComfyUI workflow JSONs
    └── outputs/        # Generated images
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend URL (default: http://192.168.1.213:8000)
VITE_BACKEND_URL=http://localhost:8000

# Use mock API (true/false)
VITE_USE_MOCKS=false
```

### Backend Configuration

The backend has its own configuration in `backend/.env`:

```env
# Server settings
HOST=0.0.0.0
PORT=8000

# ComfyUI settings
COMFYUI_HOST=127.0.0.1
COMFYUI_PORT=8188

# Worker settings
RENDER_WORKERS=1
JOB_QUEUE_MAX=20
```

See [backend/README.md](backend/README.md) for complete backend documentation and API reference.

## 📄 License

MIT

## 👥 Author

Grow with Freya

