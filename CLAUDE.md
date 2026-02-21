# CLAUDE.md

This file describes the repository structure, conventions, and workflows for AI assistants working in this codebase.

## Repository Overview

This is a static web applications repository (`dansum/web-apps`) containing two independent, self-contained browser applications. There is no build system, package manager, or backend — all projects are plain HTML/CSS/JavaScript files served directly from the `docs/` directory (GitHub Pages style).

## Directory Structure

```
web-apps/
├── docs/                          # All web applications live here
│   ├── readme.md                  # Top-level docs readme (currently empty)
│   ├── availability/
│   │   └── index.html             # Weekly availability scheduling app
│   └── forest-fire-sim_202511/
│       ├── index.html             # Forest fire simulation UI
│       ├── script.js              # Simulation logic
│       └── style.css              # Simulation styles
└── CLAUDE.md                      # This file
```

## Projects

### 1. Forest Fire Simulation (`docs/forest-fire-sim_202511/`)

A cellular automaton simulation of forest fires with firefighter response, rendered on an HTML5 Canvas.

**Language**: Bulgarian (UI labels and code comments)

**Key concepts:**
- Cell states: `CELL_EMPTY`, `CELL_TREE`, `CELL_BURNING`, `CELL_FIREFIGHTER` (named constants in UPPERCASE)
- Main tick every 1 second: tree growth, lightning strikes, firefighter spawning/expiry
- Sub-tick every 0.1 seconds: fire spread, fire burn-out
- Fire spreads in 4 cardinal directions only (not diagonal)
- Firefighters protect cells within a configurable Chebyshev-distance radius

**Architecture**: All logic in `script.js` using global state variables. No modules, no bundler.

**Conventions:**
- Constants in UPPERCASE (`CELL_EMPTY`, `CELL_TREE`, etc.)
- DOM elements stored in module-level variables via `getElementById`
- Event listeners attached with `addEventListener`
- Comments written in Bulgarian

### 2. Weekly Availability App (`docs/availability/`)

A single-file React application (no build step — React and Lucide React are loaded via CDN) for collecting weekly time-availability from a named list of users.

**Technology:** React (hooks), Lucide React icons, Tailwind CSS (CDN)

**Key concepts:**
- Authorized names are loaded at startup from a Google Sheets CSV URL (configurable at line 53 of `index.html`; falls back to hardcoded demo names if the fetch fails)
- Users pick a week (from 8 upcoming Mondays), select day(s), and enter start/end times plus an optional comment
- Submission produces a client-side confirmation table — there is currently no backend POST

**Configuration required:**
- Replace `'YOUR_GOOGLE_SHEETS_CSV_URL_HERE'` in `docs/availability/index.html` with a real Google Sheets published-as-CSV URL to enable live name validation

**Conventions:**
- Functional React components with hooks (`useState`, `useEffect`)
- camelCase for variables and functions
- Tailwind CSS utility classes for all styling (no separate CSS file)
- No TypeScript

## Development Workflow

### Running Locally

There is no dev server or build step. Open any `index.html` directly in a browser:

```bash
# macOS
open docs/availability/index.html
open docs/forest-fire-sim_202511/index.html

# Linux
xdg-open docs/availability/index.html

# Or serve with any static file server, e.g.:
python3 -m http.server 8080
# then visit http://localhost:8080/docs/availability/
```

### No Build, Lint, or Test Commands

This repository has **no** `npm`, `make`, `pytest`, or similar tooling. There are no automated tests. Verification is manual — load the app in a browser and test interactively.

### Making Changes

1. Edit the relevant `index.html`, `script.js`, or `style.css` file directly.
2. Reload the browser to verify the change.
3. Commit with a clear message describing the change.

## Git Conventions

- Commits have been short and descriptive (e.g., `"Update index.html"`, `"Create script.js"`)
- Some commit messages are in Bulgarian (matching the project language)
- There are no branch protection rules or PR requirements observed in history; direct commits to the default branch have been used

## Key Constraints and Gotchas

- **No module system**: `script.js` uses global variables and plain `<script>` tags. Do not introduce ES modules (`import`/`export`) without updating `<script type="module">` tags.
- **React loaded via CDN**: The availability app uses `ReactDOM.render` / hooks via a CDN `<script>` tag — no `npm install` needed, but also no tree-shaking or local resolution.
- **Google Sheets dependency**: The availability app will silently fall back to demo names if the CSV URL is missing or unreachable. Ensure the Sheet is published publicly before deploying.
- **Bulgarian UI**: The forest fire simulator's UI text and code comments are in Bulgarian. Keep new comments and labels consistent with that language for that project.
- **Canvas sizing**: The forest fire simulation recalculates canvas dimensions from grid size × cell size on each reset. Changing either slider does not auto-resize until `Reset` is clicked.
- **Static hosting**: The `docs/` folder structure matches a typical GitHub Pages setup. Do not move application files outside `docs/` without updating any hosting configuration.

## External Dependencies (CDN, no install required)

| Project | Library | Source |
|---|---|---|
| availability | React + ReactDOM | CDN (unpkg / jsdelivr) |
| availability | Lucide React | CDN |
| availability | Tailwind CSS | CDN |
| forest-fire-sim | None | — |
