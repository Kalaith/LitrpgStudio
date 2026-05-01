# Writers Studio Frontend

React, TypeScript, and Vite frontend for Writers Studio.

## Requirements

- Node.js 20 or newer
- npm
- Writers Studio backend running with a valid `JWT_SECRET`

## Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The default API URL is `http://localhost:8080/api/v1`. Change `VITE_API_BASE_URL` or `VITE_API_VERSION` in `.env.local` if your backend runs somewhere else.

## Scripts

- `npm run dev` starts the Vite dev server.
- `npm run lint` runs ESLint.
- `npm run type-check` runs TypeScript without emitting files.
- `npm run format:check` verifies Prettier formatting.
- `npm run test:run` runs Vitest once.
- `npm run build` type-checks and builds production assets.
- `npm run ci` runs the full frontend gate.

## Backend Notes

Database initialization is a backend CLI task:

```powershell
cd ..\backend
php scripts/init-db.php
```

Guest work remains self-service. A guest user can use the signup/link action, create a WebHatchery account, and the app will merge rows owned by that exact `guest_*` session into the new account after verifying the guest session token.

Legacy rows with no `owner_user_id` are different: those must be migrated explicitly by an admin. Use the backend admin transfer endpoint with `include_unowned=true`, or the backend ownership scripts, and provide the destination user id.

## Preview Publish

From the app root:

```powershell
.\publish.ps1
```

The local preview environment is expected at `http://127.0.0.1/writers_studio/` after publish completes.
