"""SQLite access layer for the analyst alpha tracker."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "tracker.db"


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS analysts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            firm TEXT NOT NULL,
            title TEXT NOT NULL,
            style TEXT NOT NULL,
            industries TEXT NOT NULL,
            years INTEGER NOT NULL,
            avatar TEXT NOT NULL,
            color TEXT NOT NULL,
            tagline TEXT NOT NULL,
            bio TEXT NOT NULL,
            style_scores TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            analyst_id TEXT NOT NULL REFERENCES analysts(id),
            stock_code TEXT NOT NULL,
            stock_name TEXT NOT NULL,
            industry TEXT NOT NULL,
            title TEXT NOT NULL,
            rating TEXT NOT NULL,
            prev_rating TEXT,
            target_upside REAL,
            target_price REAL,
            publish_date TEXT NOT NULL,
            report_type TEXT NOT NULL,
            scope TEXT NOT NULL DEFAULT 'stock',
            tags TEXT NOT NULL,
            related_stocks TEXT,
            content TEXT,
            source_url TEXT,
            source_name TEXT,
            summary TEXT NOT NULL,
            key_points TEXT NOT NULL,
            risks TEXT NOT NULL,
            catalyst_score REAL NOT NULL,
            conviction_score REAL NOT NULL,
            intention_score REAL NOT NULL,
            intention_label TEXT NOT NULL,
            intention_note TEXT NOT NULL,
            alpha_bias REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS prices (
            stock_code TEXT NOT NULL,
            date TEXT NOT NULL,
            close REAL NOT NULL,
            PRIMARY KEY (stock_code, date)
        );

        CREATE TABLE IF NOT EXISTS indices (
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            close REAL NOT NULL,
            PRIMARY KEY (code, date)
        );

        CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(publish_date);
        CREATE INDEX IF NOT EXISTS idx_reports_analyst ON reports(analyst_id);
        CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(date);
        """
    )
    conn.commit()


def rows(conn: sqlite3.Connection, sql: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
    return [dict(r) for r in conn.execute(sql, tuple(params)).fetchall()]


def row(conn: sqlite3.Connection, sql: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
    found = conn.execute(sql, tuple(params)).fetchone()
    return dict(found) if found else None


def loads(value: str | None, fallback: Any = None) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def ensure_database() -> None:
    """Create the schema without inserting any demo data."""
    conn = connect()
    try:
        init_schema(conn)
    finally:
        conn.close()
