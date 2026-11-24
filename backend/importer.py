"""Import a structured research report bundle into the local SQLite database.

Usage:
    python3 -m backend.importer imports/liu-gaochang-2026-11-22.json

The JSON file is intentionally boring: one analyst plus one or more reports.
PDF/Excel extraction can be added in front of this importer later; this layer
owns validation and persistence only.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from .db import connect, ensure_database, init_schema

REQUIRED_ANALYST = {"id", "name", "firm"}
REQUIRED_REPORT = {"id", "stock_code", "stock_name", "industry", "title", "publish_date"}


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def import_bundle(path: Path) -> dict[str, int]:
    bundle = json.loads(path.read_text(encoding="utf-8"))
    analyst = bundle.get("analyst") or {}
    reports = bundle.get("reports") or []

    missing_analyst = REQUIRED_ANALYST - analyst.keys()
    if missing_analyst:
        raise ValueError(f"analyst missing fields: {', '.join(sorted(missing_analyst))}")
    if not reports:
        raise ValueError("bundle contains no reports")

    ensure_database()
    conn = connect()
    try:
        init_schema(conn)
        conn.execute(
            """INSERT INTO analysts(id, name, firm, title, style, industries, years, avatar,
            color, tagline, bio, style_scores) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name, firm=excluded.firm, title=excluded.title, style=excluded.style,
              industries=excluded.industries, years=excluded.years, avatar=excluded.avatar,
              color=excluded.color, tagline=excluded.tagline, bio=excluded.bio,
              style_scores=excluded.style_scores""",
            (
                analyst["id"],
                analyst["name"],
                analyst["firm"],
                analyst.get("title", ""),
                analyst.get("style", ""),
                _json(analyst.get("industries", [])),
                int(analyst.get("years", 0)),
                analyst.get("avatar", analyst["name"][:1]),
                analyst.get("color", "#d9b46f"),
                analyst.get("tagline", ""),
                analyst.get("bio", ""),
                _json(analyst.get("style_scores", {})),
            ),
        )

        for report in reports:
            missing_report = REQUIRED_REPORT - report.keys()
            if missing_report:
                raise ValueError(
                    f"report {report.get('id', '?')} missing fields: {', '.join(sorted(missing_report))}"
                )
            conn.execute(
                """INSERT INTO reports(
                  id, analyst_id, stock_code, stock_name, industry, title, rating, prev_rating,
                  target_upside, target_price, publish_date, report_type, scope, tags, related_stocks,
                  content, source_url, source_name, summary, key_points, risks, catalyst_score,
                  conviction_score, intention_score, intention_label, intention_note, alpha_bias
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  analyst_id=excluded.analyst_id, stock_code=excluded.stock_code,
                  stock_name=excluded.stock_name, industry=excluded.industry, title=excluded.title,
                  rating=excluded.rating, prev_rating=excluded.prev_rating,
                  target_upside=excluded.target_upside, target_price=excluded.target_price,
                  publish_date=excluded.publish_date, report_type=excluded.report_type,
                  scope=excluded.scope, tags=excluded.tags, related_stocks=excluded.related_stocks,
                  content=excluded.content, source_url=excluded.source_url,
                  source_name=excluded.source_name, summary=excluded.summary,
                  key_points=excluded.key_points, risks=excluded.risks,
                  catalyst_score=excluded.catalyst_score, conviction_score=excluded.conviction_score,
                  intention_score=excluded.intention_score, intention_label=excluded.intention_label,
                  intention_note=excluded.intention_note, alpha_bias=excluded.alpha_bias""",
                (
                    report["id"],
                    analyst["id"],
                    report["stock_code"],
                    report["stock_name"],
                    report["industry"],
                    report["title"],
                    report.get("rating"),
                    report.get("prev_rating"),
                    report.get("target_upside"),
                    report.get("target_price"),
                    report["publish_date"],
                    report.get("report_type", "行业研究"),
                    report.get("scope", "stock"),
                    _json(report.get("tags", [])),
                    _json(report.get("related_stocks", {})),
                    report.get("content", ""),
                    report.get("source_url", ""),
                    report.get("source_name", ""),
                    report.get("summary", ""),
                    _json(report.get("key_points", [])),
                    _json(report.get("risks", [])),
                    float(report.get("catalyst_score", 0.5)),
                    float(report.get("conviction_score", 0.5)),
                    float(report.get("intention_score", 50)),
                    report.get("intention_label", "中性观察"),
                    report.get("intention_note", ""),
                    float(report.get("alpha_bias", 0)),
                ),
            )
        conn.commit()
    finally:
        conn.close()

    return {"analysts": 1, "reports": len(reports)}


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python3 -m backend.importer imports/<bundle>.json")
        raise SystemExit(2)
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}")
        raise SystemExit(2)
    counts = import_bundle(path)
    print(f"Imported {counts['reports']} report(s) and {counts['analysts']} analyst(s) from {path}.")


if __name__ == "__main__":
    main()
