"""FastAPI entrypoint for the analyst alpha tracker."""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .analytics import get_analyst, get_analysts, get_meta, get_overview, get_report, get_reports
from .db import ensure_database

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "frontend" / "dist"

app = FastAPI(
    title="研值 · 分析师 Alpha 跟踪台",
    version="0.1.0",
    description="分析师研报、推票意图与推荐后市场表现跟踪 API。",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:8787"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    # The workspace now starts empty; data is loaded from uploaded research files.
    ensure_database()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "analyst-alpha-tracker"}


@app.get("/api/meta")
def meta() -> dict:
    return get_meta()


@app.get("/api/overview")
def overview() -> dict:
    return get_overview()


@app.get("/api/analysts")
def analysts() -> list[dict]:
    return get_analysts()


@app.get("/api/analysts/{analyst_id}")
def analyst_detail(analyst_id: str) -> dict:
    data = get_analyst(analyst_id)
    if not data:
        raise HTTPException(status_code=404, detail="分析师不存在")
    return data


@app.get("/api/reports")
def reports(
    analyst: str | None = Query(default=None),
    rating: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> dict:
    items = get_reports(analyst=analyst, rating=rating, query=q)
    return {"items": items, "total": len(items)}


@app.get("/api/reports/{report_id}")
def report_detail(report_id: str) -> dict:
    data = get_report(report_id)
    if not data:
        raise HTTPException(status_code=404, detail="研报不存在")
    return data


if DIST.exists():
    assets = DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        candidate = DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")
