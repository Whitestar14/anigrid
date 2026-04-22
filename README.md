# Anigrid

> The sleekest anime ranker/tier list builder for the perfectionists among us. There really aren't that many decent options for 3x3s out there, so I made one myself.

A minimalist, **dark-mode native** ranking application built for anime enthusiasts. Now you can rank your waifus, tier favorite characters and organize your with zero clutter.

## Premium Experience

- **iOS-Inspired UI:** Modern glassmorphism, curated typography (Outfit-ish), and silky-smooth physics-based animations via Framer Motion.
- **Direct Pan & Zoom:** No more clunky sliders. Just click "Adjust" and drag the image directly or use the scroll wheel to zoom.
- **Intelligent Dock:** A smart bottom dock that knows when to get out of your way and when to reappear during drag-and-drop.
- **Infinite History:** Fully integrated Undo/Redo (via zundo) with global keyboard shortcuts (`Ctrl+Z` / `Ctrl+Shift+Z`).

## Features

- **Multiple Ranking Modes:**
  - **Grid ranking:** Visual 3x3s and beyond at a glance.
  - **List ranking:** Detailed ratings and labels with smooth reordering.
  - **Tier lists:** Standard S-tier through D-tier with fluid drag-and-drop rows.

- **Inbox & Collection System:**
  - Manage your image library with custom collections.
  - Bulk add/delete support.
  - "Recall" images from the board back to the stash instantly.

- **Performance & Tech:**
  - **Image Compression:** Automatic client-side downscaling and WebP conversion to keep your storage light.
  - **IndexedDB Persistence:** Your work is saved locally and instantly across sessions.
  - **Keyboard Navigation:** Full arrow-key support for grid navigation and `Backspace` to clear.

## Development

Built with React 19, Zustand, Framer Motion, Tailwind CSS, TypeScript 5.8, Zundo, and IDB.

### Frontend Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

### Backend (Image Proxy)

The app uses a Python proxy to bypass CORS restrictions when fetching images from external sources like MyAnimeList. This enables full export functionality with external images.

```bash
# Install backend dependencies
cd backend
python -m venv venv
# Windows (PowerShell): venv\Scripts\Activate.ps1
# Windows (Git Bash): source venv/Scripts/activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Run proxy server
python app.py
```

The proxy will be available at `http://localhost:5000`

Add to your `.env` file:
```
VITE_IMAGE_PROXY_URL=http://localhost:5000/proxy/image
```

El. Psy. Congroo.
