# Automated Deploy (Render backend + Vercel frontend)

This repository contains a GitHub Actions workflow that will deploy the backend to Render and the frontend to Vercel.

How it works
- The workflow triggers a new deploy for an existing Render service (using the Render REST API), waits for it to finish, and reads the service domain.
- It then creates or updates the `NEXT_PUBLIC_BACKEND_URL` environment variable in the Vercel project.
- Finally it triggers a Vercel deployment of the `nextjs-dashboard` directory (production).

What you must do (one-time setup)
1. Create a Render Web Service for the backend (choose GitHub repo + Dockerfile: `mock-api/Dockerfile`).
   - In Render dashboard, create a **Web Service** and connect to this GitHub repo.
   - Ensure build command and dockerfile settings point at `mock-api/Dockerfile`.
   - After creating the service, copy the `Service ID` from Render (see service settings -> API).

2. On GitHub (this repository), add the following repository Secrets (Repository settings → Secrets → Actions):
   - `RENDER_API_KEY` — Render API key (create in Render dashboard > Account > API Keys).
   - `RENDER_SERVICE_ID` — The Render Service ID (from step 1).
   - `VERCEL_TOKEN` — Your Vercel personal token (Vercel dashboard → Settings → Tokens).
   - `VERCEL_PROJECT_ID` — Vercel project id for this frontend project (in Vercel project settings → General → Project ID).
   - (Optional) `VERCEL_ORG_ID` — Vercel org id (if required by your Vercel account).

3. Trigger the workflow:
   - Go to the repository Actions tab → `Auto Deploy (Render backend + Vercel frontend)` → `Run workflow`.
   - Or push to `main` to trigger the workflow automatically.

Notes & Troubleshooting
- The workflow expects the Render service to already be configured to build from this repo. Creating a Render service via the API is possible but requires more fields — the recommended flow is to create the Render service via the Render UI and supply the `RENDER_SERVICE_ID`.
- The Vercel step uses the Vercel API to set `NEXT_PUBLIC_BACKEND_URL` so your frontend will point at the newly deployed backend automatically.
- If the workflow fails in the Render deploy step, inspect the Action logs — common causes: wrong `RENDER_API_KEY` or `RENDER_SERVICE_ID`.
- If the Vercel step fails, ensure `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` are correct and you have permission to modify the project.

Security
- Keep API keys and IDs secret. Use GitHub repository secrets (not files in repo).

When you are done
- After the workflow finishes, open your Vercel project dashboard — the new deployment will be listed there and the frontend URL will be available.
- Backend URL will be the Render `defaultDomain` (the workflow echoes it in the Action logs).

If you'd like, I can also add a small script to extract the final Vercel URL automatically and write it to a repository file — tell me if you want that next.
