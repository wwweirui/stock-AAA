"""Clear all imported and demo data while keeping the database schema."""
from __future__ import annotations

from .db import connect, ensure_database


def clear_data() -> None:
    ensure_database()
    conn = connect()
    try:
        for table in ("indices", "prices", "reports", "analysts"):
            conn.execute(f"DELETE FROM {table}")
        conn.commit()
        conn.execute("VACUUM")
        for table in ("analysts", "reports", "prices", "indices"):
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"{table}: {count}")
    finally:
        conn.close()


if __name__ == "__main__":
    clear_data()
