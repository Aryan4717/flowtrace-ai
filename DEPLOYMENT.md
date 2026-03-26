# Deploying FlowTrace AI (Railway + Vercel)

This app is a **monorepo**: Node/Express API in `backend/`, Vite/React UI in `frontend/`.

| Service    | Platform | Root directory |
|-----------|----------|----------------|
| API       | Railway  | `backend`      |
| Frontend  | Vercel   | `frontend`     |

Deploy **Railway first**, copy the public HTTPS URL, then set **Vercel** `VITE_API_URL` to that URL and redeploy the frontend.

---

## 1. Railway (backend)

### Dashboard settings

1. **New project** → Deploy from GitHub → select this repo.
2. Add a service → **Root Directory**: `backend`
3. **Config file path** (if Railway does not pick up `backend/railway.toml` automatically): set to **`/backend/railway.toml`** — [Railway monorepo docs](https://docs.railway.com/guides/monorepo) explain that config-as-code does not always follow Root Directory.
4. **Build command:** `npm ci && npm run build` (already in `backend/railway.toml`)
5. **Start command:** `npm start` → runs `node dist/index.js`

### Environment variables (Railway → your backend service → Variables)

Set these in Railway (same names as local `backend/.env`):

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `PORT` | Usually **auto** | Railway injects this. The app reads `PORT` in `backend/src/config/index.ts`. Do not hardcode. |
| `CORS_ORIGIN` | **Recommended** | Your Vercel site origin(s), comma-separated, no path. Example: `https://my-app.vercel.app` or `https://my-app.vercel.app,https://www.my-domain.com`. If omitted, CORS allows any origin (OK for quick demos, looser for production). |
| `DATA_PATH` | Optional | Folder for SAP/jsonl data. Default `./data` (relative to process cwd). Ensure `backend/data` is in the deployed repo or set an absolute path. |
| `DATABASE_URL` | If you use Postgres | Connection string. Add a **PostgreSQL** plugin on Railway and copy its `DATABASE_URL` if your code uses the DB. |
| `OPENAI_API_KEY` | For Chat/LLM | Required for real OpenAI calls; without it the backend may use stub behavior (see `llm.service.ts`). |
| `LANGFUSE_PUBLIC_KEY` | Optional | Langfuse observability. |
| `LANGFUSE_SECRET_KEY` | Optional | Langfuse observability. |
| `LANGFUSE_HOST` | Optional | Default `https://cloud.langfuse.com` if unset. |

**Secrets:** Put `OPENAI_API_KEY`, Langfuse keys, and `DATABASE_URL` **only** in Railway — never commit them.

### After deploy

- Public URL example: `https://your-service.up.railway.app`
- Test: `curl https://your-service.up.railway.app/health` → `{"status":"ok"}`

---

## 2. Vercel (frontend)

### Dashboard settings

1. **Import** the same GitHub repo.
2. **Root Directory:** `frontend`
3. Framework **Vite** (see `frontend/vercel.json`).
4. Build output: `dist`

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Environments | Purpose |
|----------|----------------|---------|
| `VITE_API_URL` | **Production** (and Preview if you want previews to hit a real API) | Full Railway API base URL **with `https`**, **no trailing slash**. Example: `https://your-service.up.railway.app` |

Vite **inlines** `VITE_*` at **build time**. After changing `VITE_API_URL`, trigger a **new deployment**.

**Do not** put `OPENAI_API_KEY`, Langfuse, or `DATABASE_URL` in Vercel — the browser must not receive server secrets. Those stay on Railway only.

---

## 3. Where each env lives

| Variable | Railway (backend) | Vercel (frontend) |
|----------|-------------------|-------------------|
| `PORT` | Yes (often automatic) | No |
| `CORS_ORIGIN` | Yes (your Vercel URL) | No |
| `DATA_PATH` | Yes (if needed) | No |
| `DATABASE_URL` | Yes | No |
| `OPENAI_API_KEY` | Yes | No |
| `LANGFUSE_PUBLIC_KEY` | Yes | No |
| `LANGFUSE_SECRET_KEY` | Yes | No |
| `LANGFUSE_HOST` | Optional | No |
| `VITE_API_URL` | No | **Yes** (Railway HTTPS URL) |

---

## 4. Local vs production

- **Local dev:** Frontend uses Vite proxy `/api` → `localhost:3001` (see `frontend/vite.config.ts`). Backend uses `backend/.env` (not committed).
- **Production:** Frontend calls `VITE_API_URL` directly; no proxy.

---

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| UI calls `localhost:3001` in production | Set `VITE_API_URL` on Vercel and **redeploy**. |
| CORS errors in the browser | Set `CORS_ORIGIN` on Railway to your exact Vercel URL (`https://....vercel.app`). |
| Empty graph / no data | Confirm `DATA_PATH` and that `backend/data` (or your path) exists on Railway after deploy. |
| Railway build fails | Ensure **Root Directory** is `backend` and `npm ci` works (lockfile in `backend/package-lock.json`). |
