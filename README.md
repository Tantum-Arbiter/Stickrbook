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

If you have the backend server running:

```bash
# Edit .env file
VITE_BACKEND_URL=http://localhost:8000
VITE_USE_MOCKS=false

# Start the dev server
npm run dev
```

**Note:** The backend server must be running separately. It should provide:
- FastAPI endpoints at `/v1/storyboard/*`
- ComfyUI integration for image generation
- File storage for generated images

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

- **React** 18 + **TypeScript**
- **Vite** - Fast build tool
- **Zustand** - State management
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **MSW** - API mocking

## 📁 Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # React components
│   ├── editor/      # Canvas editor components
│   ├── generate/    # Image generation UI
│   ├── sidebar/     # Project/asset management
│   └── ui/          # Reusable UI components
├── store/           # Zustand state management
├── styles/          # CSS styles
└── test/            # Test utilities and mocks
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

### Backend Requirements

The backend server should implement these endpoints:

- `POST /v1/storyboard/books/{bookId}/generate/variations` - Submit generation job
- `GET /v1/jobs/{jobId}` - Get job status
- `GET /v1/jobs/{jobId}/events` - SSE for real-time progress
- `GET /v1/files/{fileId}` - Download generated images
- `GET /v1/storyboard/projects` - List projects
- `GET /v1/storyboard/books` - List books

## 📄 License

MIT

## 👥 Author

Grow with Freya

