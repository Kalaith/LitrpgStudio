# LitRPG Studio

> LitRPG Writer's Studio — a small React + Vite frontend for managing LitRPG characters, templates and timelines.

This repository contains the frontend app used by LitRPG Studio. The UI is built with React, TypeScript and Tailwind, and uses Vite as the dev server and build tool.

## Quick checklist
- Create README at repo root — Done
- Include setup & dev scripts from `frontend/package.json` — Done
- Describe project layout and publish hint — Done

## Prerequisites
- Node.js (recommended >= 18)
- npm (or a compatible package manager)
- PowerShell (Windows users can run the provided `publish.ps1` script)

Note: the project uses TypeScript and Vite. The `build` step runs a TypeScript project build (`tsc -b`) before invoking Vite.

## Install
Open a PowerShell terminal and run:

```powershell
cd frontend
npm install
```

## Development
Start the dev server (Vite):

```powershell
cd frontend
npm run dev
```

Open http://localhost:5173 (or the URL printed by Vite).

## Build & Preview
Create a production build and preview it locally:

```powershell
cd frontend
npm run build
npm run preview
```

The `build` script runs `tsc -b` and `vite build` (see `frontend/package.json`).

## Linting
Run ESLint across the frontend source:

```powershell
cd frontend
npm run lint
```

## Project structure (top-level)
- `frontend/` — React + TypeScript application
  - `src/` — application source (components, views, styles)
  - `public/` — static assets
  - `package.json` — scripts and dependencies
- `publish.ps1` — repository-level PowerShell script (used for publishing/deployment workflows)

## Notes & next steps
- If you want CI/CD instructions (GitHub Actions, Azure Pipelines, etc.), tell me which provider and I can add a workflow.
- If you prefer yarn/pnpm instructions, say which package manager and I'll add examples.

## License
No license file included in this repo. Add a `LICENSE` if you want to make the project open source.

---

If you want, I can expand this README with screenshots, a development architecture diagram, or a short contributor guide.
