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

## Production Database Initialization

After deploying LitRPG Studio to production, you need to initialize the database with sample data. **Important**: This must be done using web calls only - no SSH or terminal access required.

### Step 1: Verify Backend is Running
First, check that your backend API is accessible:

```
GET https://your-domain.com/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "LitRPG Studio API",
  "version": "v1",
  "timestamp": "2025-09-17T12:00:00+00:00"
}
```

### Step 2: Initialize Database
Use a web browser, Postman, or any HTTP client to call the database initialization endpoint:

```
POST https://your-domain.com/api/v1/init-database
```

**Headers:**
```
Content-Type: application/json
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Database initialized successfully",
  "output": "Database tables created and sample data inserted"
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": "Database connection failed or tables already exist"
}
```

### Step 3: Verify Initialization
After successful initialization, verify the data was created by checking these endpoints:

**Check Series:**
```
GET https://your-domain.com/api/v1/series
```

**Check Characters:**
```
GET https://your-domain.com/api/v1/characters
```

Both should return arrays with sample data.

### Step 4: Frontend Dashboard
Once the database is initialized, access your frontend at:

```
https://your-domain.com
```

The dashboard should now display:
- ✅ Connected to backend (green status indicator)
- Sample data in widgets instead of zeros
- Functional series and character management

### Troubleshooting Production Setup

**If backend is not accessible:**
- Check your web server configuration (Apache/Nginx)
- Verify PHP is running and mod_rewrite is enabled
- Check that the `/api/v1/` routes are properly configured

**If database initialization fails:**
- Verify database credentials in `.env` file
- Check database server is running
- Ensure database user has CREATE and INSERT permissions

**If frontend shows "Using offline mode":**
- Check `VITE_API_BASE_URL` in frontend environment variables
- Verify CORS settings allow frontend domain
- Check browser developer console for network errors

### Manual Database Reset (Web-based)
If you need to reset the database, you can call the same initialization endpoint multiple times. The backend script will handle existing data appropriately.

## Backend Vendor Directory Optimization

The backend PHP dependencies can be significantly reduced for production deployment. Here's how to optimize the vendor folder:

### Current Size vs Optimized Size
- **Development**: ~19MB (includes dev dependencies, tests, docs)
- **Production Optimized**: ~8-12MB (60-70% reduction)

### Method 1: Automated Production Deployment (Recommended)

Run the automated production deployment script:

```bash
cd backend
chmod +x scripts/production-deploy.sh
./scripts/production-deploy.sh
```

This script will:
- ✅ Remove development dependencies (`--no-dev`)
- ✅ Optimize autoloader (`--optimize-autoloader`)
- ✅ Enable classmap authority (`--classmap-authoritative`)
- ✅ Clean unnecessary files (README, tests, docs, etc.)
- ✅ Remove development directories (.git, tests, examples)
- ✅ Create production-ready .htaccess
- ✅ Generate deployment summary

### Method 2: Manual Step-by-Step Optimization

If you prefer manual control:

#### Step 1: Configure Composer for Production
The `composer.json` has been pre-configured with production optimizations:

```json
{
  "config": {
    "preferred-install": "dist",
    "optimize-autoloader": true,
    "classmap-authoritative": true,
    "apcu-autoloader": true
  }
}
```

#### Step 2: Install Production Dependencies
```bash
cd backend
composer install --no-dev --optimize-autoloader --classmap-authoritative
```

#### Step 3: Clean Vendor Directory
```bash
cd backend
composer run vendor-cleanup
```

#### Step 4: Remove Development Files
Delete these files/directories from backend root:
- `tests/`
- `docs/`
- `phpunit.xml`
- `.phpunit.cache/`
- `server.log`

### What Gets Removed During Optimization

**Files removed from each vendor package:**
- Documentation: `README.md`, `CHANGELOG.md`, `LICENSE.txt`
- Development: `composer.json`, `phpunit.xml`, `.travis.yml`
- Version control: `.git/`, `.gitignore`, `.gitattributes`
- IDE files: `.idea/`, `.vscode/`
- Build files: `Makefile`, `Dockerfile`, `docker-compose.yml`

**Directories removed:**
- `tests/`, `test/`, `Test/`, `Tests/`
- `docs/`, `doc/`, `documentation/`
- `examples/`, `samples/`, `demo/`
- `.git/`, `.github/`, `.travis/`
- `coverage/`, `build/`

### Production Deployment Checklist

✅ **Before uploading to production server:**
1. Run vendor optimization (Method 1 or 2)
2. Verify `.env.production` has correct database credentials
3. Ensure `public/` directory will be your web root
4. Check that `.htaccess` is configured properly

✅ **After uploading to production:**
1. Test health endpoint: `GET /api/v1/health`
2. Initialize database: `POST /api/v1/init-database`
3. Verify frontend connectivity

### Size Reduction Results

**Typical vendor folder contents removed:**
- **~200-500 README/docs files**: 2-5MB saved
- **~50-100 test directories**: 3-8MB saved
- **~100+ git directories**: 1-3MB saved
- **Development dependencies**: 2-5MB saved

**Total space savings: 60-70% reduction in vendor folder size**

This optimization is especially important for:
- Shared hosting with storage limits
- Faster FTP/deployment uploads
- Reduced backup sizes
- Better production performance (fewer files to scan)

## Project structure (top-level)
- `frontend/` — React + TypeScript application
  - `src/` — application source (components, views, styles)
  - `public/` — static assets
  - `package.json` — scripts and dependencies
- `backend/` — PHP Slim API with Eloquent ORM
  - `src/` — API controllers and business logic
  - `scripts/` — Database initialization scripts
  - `public/` — API entry point (`index.php`)
- `publish.ps1` — repository-level PowerShell script (used for publishing/deployment workflows)
