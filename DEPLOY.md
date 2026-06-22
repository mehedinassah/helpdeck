# Deploying Helpdeck for free

Stack: **Neon** (DB, already set up) · **Groq** (LLM, already set up) · **Render** (backend, free) · **Vercel** (dashboard, free).

You'll end up with two public URLs:
- Backend API + widget → `https://helpdeck-api.onrender.com` (example)
- Dashboard → `https://helpdeck.vercel.app` (example)

---

## Part 1 — Backend on Render (free)

1. Push this repo to GitHub (already done).
2. Go to **https://render.com** → sign up with GitHub (free).
3. **New → Web Service** → connect the `helpdeck` repo.
4. Render auto-detects the **Dockerfile**. Settings:
   - **Instance type:** `Free`
   - **Region:** closest to your users
   - (Dockerfile + context are already configured.)
5. Add **Environment Variables** (Advanced → Add from the list below):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Neon string, `postgresql+psycopg2://...sslmode=require` |
   | `LLM_API_KEY` | your Groq key (`gsk_...`) |
   | `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
   | `LLM_MODEL` | `llama-3.3-70b-versatile` |
   | `PLATFORM_API_KEY` | your `plat_...` key (for Perico) |
   | `CORS_ORIGINS` | `*` |
   | `BILLING_SUCCESS_URL` | `https://<your-vercel-url>/?checkout=success` (fill after Part 2) |
   | `BILLING_CANCEL_URL` | `https://<your-vercel-url>/?checkout=cancelled` |

   > Tip: instead of step 3, you can use **New → Blueprint** and pick this repo — `render.yaml` pre-defines the service; you just fill the secret values.

6. **Create Web Service.** First build takes a few minutes. When live, open `https://<your-service>.onrender.com/health` → should return `{"status":"ok",...}`.

**Free-tier notes:** the service sleeps after ~15 min idle; the first request after sleep takes ~50s (cold start + the embedding model downloads once). Fine for a demo/portfolio.

---

## Part 2 — Dashboard on Vercel (free)

1. Go to **https://vercel.com** → **Add New → Project** → import the `helpdeck` repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` · **Output:** `dist` (auto)
3. **Environment Variable:**

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your Render backend URL, e.g. `https://helpdeck-api.onrender.com` |

4. **Deploy.** You'll get `https://<project>.vercel.app`.
5. Go back to **Render** and set `BILLING_SUCCESS_URL` / `BILLING_CANCEL_URL` to this Vercel URL, then redeploy the backend.

---

## Part 3 — Verify

1. Open the Vercel dashboard URL → **Create account** (email + password).
2. Add a document → the **embed snippet** now points at your Render URL with a `data-widget-key`.
3. Paste that snippet on any test page → the chat bubble answers from your docs.

---

## Part 4 — Connect Perico (later)

When you deploy Perico, set in its Vercel env:
- `HELPDECK_API_URL` = your Render backend URL
- `NEXT_PUBLIC_HELPDECK_URL` = same
- `HELPDECK_PLATFORM_KEY` = the same `plat_...` value

Then merge the `feat/ai-support` branch to `main`.

---

## If the backend runs out of memory on Render Free (512 MB)
The embedding model is small, but if you hit OOM: deploy the same Dockerfile to **Fly.io** or **Hugging Face Spaces (Docker)** which offer more free RAM — no code changes needed.
