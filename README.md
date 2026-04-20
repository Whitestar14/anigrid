# Anigrid

> The sleekest anime ranker/tier list builder for the perfectionists among us. There really aren't that many decent options for 3x3s out there, so I made one myself.

A minimalist, **dark-mode native** ranking application built for anime enthusiasts. Now you can rank your waifus, tier favorite characters and organize your with zero clutter

## Features

- Multiple Ranking Modes

  - Grid ranking (visual comparison at a glance)
  - List ranking (detailed ratings and labels)
  - Tier lists (S-tier through whatever you want)

- Image collections with inbox system
- Drag and drop
- Persistent storage
- Share your rankings (once image export gets fixed)
- Mobile-Friendly

## Development

Built with React 19, Zustand, framer-motion, tailwindcss, Typescript 5.8, zundo and idb.

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

**Why the proxy?** MyAnimeList and other image sources block CORS requests from browsers. The proxy server:
- Fetches images server-side (no CORS restrictions)
- Caches them locally for instant future loads
- Returns CORS-enabled responses to the frontend
- Enables seamless exports with external images

## Known Issues

> I'm building Anigrid in my free time and I have some other things to attend to, so unfortunately its not getting as much attention as I would like to give it. If you want to contribute and have any interest in polishing the app, open a PR with details of what was changed/improved and I'm sure to check it out!

- Mobile drag-and-drop could use touch event optimizations
- Empty states need tiny anime character vectors (MVP someday™)
- Mobile accessibility improvements in progress
- Some UI polish still incoming (because perfection takes time)

El. Psy. Congroo.
