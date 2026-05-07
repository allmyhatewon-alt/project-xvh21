# PENG hub — backend proxy

This FastAPI server's only job is to forward `/api/*` requests from
port 8001 (where the Kubernetes ingress sends them) to the real Next.js
app running on port 3000.

**Do not add app logic here.** All API endpoints live in the Next.js app
at `/app/frontend/app/api/**/route.ts`.
