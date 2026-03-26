# FlowTrace AI

Graph-Based Data Modeling and Query System.

Full-stack TypeScript monorepo with a Node.js/Express backend and Vite/React frontend.

## Project Structure

```
flowtrace-ai/
├── backend/     # Express API server
├── frontend/    # Vite + React app
└── package.json # Root scripts
```

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

Or manually:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

**Backend** — Copy the example env file and configure:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

- `PORT` — Server port (default: 3001)
- `DATABASE_URL` — PostgreSQL connection string
- `LANGFUSE_*` — Langfuse API keys (optional, for observability)

**Frontend** (optional):

```bash
cp frontend/.env.example frontend/.env
```

- `VITE_API_URL` — Backend API URL (defaults: `/api` in dev, `http://localhost:3001` in prod)

### 3. Run development servers

From the project root:

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

Or run separately:

```bash
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only
```

### 4. Verify

- Backend health: `curl http://localhost:3001/health` → `{"status":"ok"}`
- Frontend: open http://localhost:5173 — should display API status

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run backend + frontend in parallel |
| `npm run dev:backend` | Run backend only |
| `npm run dev:frontend` | Run frontend only |
| `npm run install:all` | Install deps in root, backend, and frontend |
| `npm run build` | Build both backend and frontend |

## Production deployment (Vercel + Railway)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for environment variables, platform settings, and troubleshooting.
