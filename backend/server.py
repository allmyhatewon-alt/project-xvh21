"""
PENG hub — backend proxy.

The Kubernetes ingress for this preview redirects every request whose path
starts with /api/* to port 8001. The actual application lives in Next.js on
port 3000. This tiny FastAPI server just forwards /api/* requests to Next.js
so that Next.js route handlers (app/api/**) work end-to-end through ingress.

DO NOT add app logic here. Add it in the Next.js app/api/ directory.
"""
import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response, StreamingResponse

NEXT_INTERNAL_URL = os.environ.get("NEXT_INTERNAL_URL", "http://127.0.0.1:3000")

app = FastAPI(title="PENG hub proxy")


@app.get("/api/_health")
async def health():
    return {"ok": True, "proxy_target": NEXT_INTERNAL_URL}


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request):
    target_url = f"{NEXT_INTERNAL_URL}/api/{path}"
    qs = request.url.query
    if qs:
        target_url = f"{target_url}?{qs}"

    excluded = {"host", "content-length"}
    headers = {k: v for k, v in request.headers.items() if k.lower() not in excluded}
    body = await request.body()

    async with httpx.AsyncClient(timeout=120.0, follow_redirects=False) as client:
        upstream = await client.request(
            request.method, target_url, headers=headers, content=body
        )

    response_headers = dict(upstream.headers)
    response_headers.pop("content-length", None)
    response_headers.pop("transfer-encoding", None)
    response_headers.pop("connection", None)

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )
