"""Performance and aggregation logic for the tracker API."""
from __future__ import annotations

import statistics
from collections import defaultdict
from typing import Any

from .db import connect, loads, row, rows

INDEX_CODE = "000300"


def _pct(value: float, digits: int = 2) -> float:
    return round(value * 100, digits)


def _load_price_map(conn, table: str, key: str, value: str = "close") -> dict[str, dict[str, float]]:
    data: dict[str, dict[str, float]] = defaultdict(dict)
    for item in rows(conn, f"SELECT {key} AS k, date, {value} AS v FROM {table} ORDER BY date"):
        data[item["k"]][item["date"]] = item["v"]
    return data


def _downsample(values: list[float], target: int = 18) -> list[float]:
    if len(values) <= target:
        return [round(v, 2) for v in values]
    step = (len(values) - 1) / (target - 1)
    return [round(values[round(i * step)], 2) for i in range(target)]


def build_report_rows(conn) -> list[dict[str, Any]]:
    prices = _load_price_map(conn, "prices", "stock_code")
    index_prices = _load_price_map(conn, "indices", "code")
    bench = index_prices.get(INDEX_CODE, {})
    trading_dates = sorted(bench.keys())
    latest_market_date = trading_dates[-1] if trading_dates else None
    latest_bench = bench[latest_market_date] if latest_market_date else None

    query = """
        SELECT r.*, a.name AS analyst_name, a.firm, a.title AS analyst_title,
               a.avatar, a.color, a.style
        FROM reports r JOIN analysts a ON a.id = r.analyst_id
        ORDER BY r.publish_date DESC, r.id DESC
    """
    result: list[dict[str, Any]] = []
    for raw in rows(conn, query):
        stock_prices = prices.get(raw["stock_code"], {})
        publish_date = raw["publish_date"]
        has_market = bool(
            latest_market_date
            and publish_date in stock_prices
            and latest_market_date in stock_prices
            and publish_date in bench
        )

        common = {
            "id": raw["id"],
            "stock_code": raw["stock_code"],
            "stock_name": raw["stock_name"],
            "industry": raw["industry"],
            "title": raw["title"],
            "rating": raw["rating"],
            "prev_rating": raw["prev_rating"],
            "target_price": raw.get("target_price"),
            "target_upside": raw.get("target_upside"),
            "publish_date": publish_date,
            "report_type": raw["report_type"],
            "scope": raw.get("scope") or "stock",
            "tags": loads(raw["tags"], []),
            "related_stocks": loads(raw["related_stocks"], {}),
            "summary": raw["summary"],
            "key_points": loads(raw["key_points"], []),
            "risks": loads(raw["risks"], []),
            "source_url": raw.get("source_url") or "",
            "source_name": raw.get("source_name") or "",
            "has_content": bool(raw.get("content")),
            "catalyst_score": raw["catalyst_score"],
            "conviction_score": raw["conviction_score"],
            "intention_score": raw["intention_score"],
            "intention_label": raw["intention_label"],
            "intention_note": raw["intention_note"],
            "analyst": {
                "id": raw["analyst_id"],
                "name": raw["analyst_name"],
                "firm": raw["firm"],
                "title": raw["analyst_title"],
                "avatar": raw["avatar"],
                "color": raw["color"],
                "style": raw["style"],
            },
        }

        if has_market:
            entry_price = stock_prices[publish_date]
            latest_price = stock_prices[latest_market_date]
            bench_entry = bench[publish_date]
            path = [stock_prices[d] for d in trading_dates if publish_date <= d <= latest_market_date]
            ret = latest_price / entry_price - 1
            bench_ret = latest_bench / bench_entry - 1
            max_gain = max(path) / entry_price - 1
            max_drawdown = min(path) / entry_price - 1
            holding_days = max(len(path) - 1, 0)
            target_price = raw.get("target_price")
            if target_price is None and raw.get("target_upside") is not None:
                target_price = round(entry_price * (1 + raw["target_upside"]), 2)
            if target_price is None:
                target_progress = None
            else:
                target_progress = round(
                    (latest_price - entry_price) / max(target_price - entry_price, 0.01), 3
                )
            spark_values = [p / entry_price * 100 for p in path]
            detail_series = [
                {
                    "date": d,
                    "stock": round(stock_prices[d] / entry_price * 100, 2),
                    "benchmark": round(bench[d] / bench_entry * 100, 2),
                }
                for d in trading_dates
                if publish_date <= d <= latest_market_date
            ]
            common.update(
                {
                    "entry_price": round(entry_price, 2),
                    "latest_price": round(latest_price, 2),
                    "latest_date": latest_market_date,
                    "ret": _pct(ret),
                    "benchmark_ret": _pct(bench_ret),
                    "excess": _pct(ret - bench_ret),
                    "max_gain": _pct(max_gain),
                    "max_drawdown": _pct(max_drawdown),
                    "target_price": round(target_price, 2) if target_price is not None else None,
                    "target_progress": target_progress,
                    "holding_days": holding_days,
                    "status": "tracking" if holding_days < 60 else "settled",
                    "performance_status": "tracked",
                    "pending_reason": None,
                    "spark": _downsample(spark_values),
                    "series": detail_series,
                }
            )
        else:
            common.update(
                {
                    "entry_price": None,
                    "latest_price": None,
                    "latest_date": None,
                    "ret": None,
                    "benchmark_ret": None,
                    "excess": None,
                    "max_gain": None,
                    "max_drawdown": None,
                    "target_progress": None,
                    "holding_days": 0,
                    "status": "pending",
                    "performance_status": "pending",
                    "pending_reason": (
                        "行业研报，等待关联标的行情与基准指数接入"
                        if (raw.get("scope") or "stock") == "industry"
                        else "等待个股行情与基准指数接入"
                    ),
                    "spark": [],
                    "series": [],
                }
            )
        result.append(common)
    return result


def _metrics(items: list[dict[str, Any]]) -> dict[str, Any]:
    tracked = [item for item in items if item.get("performance_status") == "tracked"]
    report_count = len(items)
    if not tracked:
        return {
            "report_count": report_count,
            "priced_count": 0,
            "unpriced_count": report_count,
            "has_performance": False,
            "win_rate": 0,
            "avg_excess": 0,
            "avg_return": 0,
            "avg_max_gain": 0,
            "avg_holding_days": 0,
            "active_count": 0,
        }
    wins = [item for item in tracked if (item.get("excess") or 0) > 0]
    return {
        "report_count": report_count,
        "priced_count": len(tracked),
        "unpriced_count": report_count - len(tracked),
        "has_performance": True,
        "win_rate": round(len(wins) / len(tracked) * 100, 1),
        "avg_excess": round(statistics.mean(item["excess"] for item in tracked), 2),
        "avg_return": round(statistics.mean(item["ret"] for item in tracked), 2),
        "avg_max_gain": round(statistics.mean(item["max_gain"] for item in tracked), 2),
        "avg_holding_days": round(statistics.mean(item["holding_days"] for item in tracked), 1),
        "active_count": sum(1 for item in tracked if item["status"] == "tracking"),
    }


def _empty_overview() -> dict[str, Any]:
    return {
        "as_of": None,
        "demo": False,
        "has_data": False,
        "has_performance": False,
        "metrics": {
            "report_count": 0,
            "priced_count": 0,
            "unpriced_count": 0,
            "has_performance": False,
            "win_rate": 0,
            "avg_excess": 0,
            "avg_return": 0,
            "avg_max_gain": 0,
            "avg_holding_days": 0,
            "active_count": 0,
            "analyst_count": 0,
            "coverage_count": 0,
            "top_score": 0,
        },
        "indices": [],
        "equity": [],
        "range_dates": {},
        "monthly": [],
        "intent": [],
        "ratings": [],
        "industries": [],
        "top_analysts": [],
        "recent_reports": [],
        "market": {
            "temperature": 0,
            "regime": "待导入",
            "bench_ret_20d": 0,
            "bench_ret_60d": 0,
            "bench_ma20": 0,
            "bench_ma60": 0,
            "above_ma20": False,
            "breadth": 0,
            "avg_stock_20d": 0,
            "top_industry": None,
            "note": "数据库为空，等待导入研报与分析标的的行情数据。",
        },
        "rating_changes": {"upgrades": 0, "downgrades": 0, "maintained": 0},
        "market_note": "数据库为空，等待导入研报与分析标的的行情数据。",
    }


def _alpha_series(items: list[dict[str, Any]], dates: list[str]) -> list[dict[str, Any]]:
    """Equal-weight active recommendation basket versus the CSI 300.

    Each report joins the basket on its publication date and stays for up to
    60 trading days. Values are cumulative percentage returns since each
    recommendation's own entry, averaged across active reports.
    """
    if not items:
        return [{"date": d, "portfolio": 0.0, "benchmark": 0.0, "alpha": 0.0} for d in dates]
    series: list[dict[str, Any]] = []
    for day in dates:
        active = [i for i in items if i["publish_date"] <= day and i["holding_days"] >= 0]
        active = [
            i for i in active
            if day <= i["series"][-1]["date"] and i["series"][0]["date"] <= day <= i["series"][-1]["date"]
        ]
        if not active:
            series.append({"date": day, "portfolio": 0.0, "benchmark": 0.0, "alpha": 0.0})
            continue
        stock_values = []
        bench_values = []
        for item in active:
            by_date = {point["date"]: point for point in item["series"]}
            point = by_date.get(day)
            if point:
                stock_values.append(point["stock"] / 100 - 1)
                bench_values.append(point["benchmark"] / 100 - 1)
        if not stock_values:
            series.append({"date": day, "portfolio": 0.0, "benchmark": 0.0, "alpha": 0.0})
            continue
        portfolio = statistics.mean(stock_values)
        benchmark = statistics.mean(bench_values)
        series.append(
            {
                "date": day,
                "portfolio": _pct(portfolio),
                "benchmark": _pct(benchmark),
                "alpha": _pct(portfolio - benchmark),
            }
        )
    return series


def _analyst_metrics(reports: list[dict[str, Any]]) -> dict[str, Any]:
    metrics = _metrics(reports)
    if not metrics["has_performance"]:
        metrics["score"] = 0
    else:
        score = 50 + (metrics["win_rate"] - 50) * 0.40 + metrics["avg_excess"] * 2.2
        metrics["score"] = round(max(40.0, min(96.0, score)), 1)
    tracked = [r for r in reports if r.get("performance_status") == "tracked"]
    metrics["best_excess"] = round(max((r["excess"] for r in tracked), default=0), 2)
    metrics["worst_excess"] = round(min((r["excess"] for r in tracked), default=0), 2)
    metrics["avg_intention"] = round(statistics.mean(r["intention_score"] for r in reports), 1) if reports else 0
    return metrics


def _analyst_summary(reports: list[dict[str, Any]], analyst: dict[str, Any]) -> dict[str, Any]:
    metrics = _analyst_metrics(reports)
    dates = sorted({point["date"] for r in reports for point in r["series"]})
    spark = _alpha_series(reports, dates)
    recent = sorted(reports, key=lambda r: r["publish_date"], reverse=True)
    return {
        **analyst,
        "industries": loads(analyst.get("industries"), []),
        "style_scores": loads(analyst.get("style_scores"), {}),
        "metrics": metrics,
        "spark": [point["alpha"] for point in spark][-24:],
        "latest_report_date": recent[0]["publish_date"] if recent else None,
        "latest_reports": recent[:3],
    }


def get_overview() -> dict[str, Any]:
    conn = connect()
    try:
        reports = build_report_rows(conn)
        if not reports:
            has_index = row(conn, "SELECT 1 AS n FROM indices LIMIT 1")
            if not has_index:
                return _empty_overview()
        analyst_rows = rows(conn, "SELECT * FROM analysts ORDER BY name")
        by_analyst: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for report in reports:
            by_analyst[report["analyst"]["id"]].append(report)

        analysts = [_analyst_summary(by_analyst.get(a["id"], []), a) for a in analyst_rows]
        analysts.sort(key=lambda a: a["metrics"]["score"], reverse=True)

        dates = sorted({point["date"] for r in reports for point in r["series"]})
        equity = _alpha_series(reports, dates)
        metrics = _metrics(reports)

        intent_counts: dict[str, int] = defaultdict(int)
        rating_counts: dict[str, int] = defaultdict(int)
        industry_stats: dict[str, list[dict[str, Any]]] = defaultdict(list)
        monthly_stats: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for report in reports:
            intent_counts[report["intention_label"]] += 1
            rating_counts[report["rating"]] += 1
            if report.get("performance_status") == "tracked":
                industry_stats[report["industry"]].append(report)
                monthly_stats[report["publish_date"][:7]].append(report)

        industry_breakdown = []
        for name, items in industry_stats.items():
            industry_breakdown.append(
                {
                    "name": name,
                    "count": len(items),
                    "avg_excess": round(statistics.mean(i["excess"] for i in items), 2),
                    "win_rate": round(sum(1 for i in items if i["excess"] > 0) / len(items) * 100, 1),
                }
            )
        industry_breakdown.sort(key=lambda x: x["avg_excess"], reverse=True)

        monthly = []
        for month, items in sorted(monthly_stats.items()):
            monthly.append(
                {
                    "month": month,
                    "label": f"{int(month[5:7])}月",
                    "excess": round(statistics.mean(i["excess"] for i in items), 2),
                    "count": len(items),
                }
            )

        index_rows = rows(conn, "SELECT code, name, date, close FROM indices ORDER BY code, date")
        index_map: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for item in index_rows:
            index_map[item["code"]].append(item)
        indices = []
        for code, series in index_map.items():
            if len(series) < 2:
                continue
            last = series[-1]
            prev = series[-2]
            indices.append(
                {
                    "code": code,
                    "name": last["name"],
                    "value": round(last["close"], 2),
                    "change_pct": round((last["close"] / prev["close"] - 1) * 100, 2),
                    "spark": _downsample([p["close"] for p in series], 20),
                }
            )

        total_excess = metrics["avg_excess"]
        top_industry = industry_breakdown[0] if industry_breakdown else None
        latest_analyst = analysts[0] if analysts else None

        # Market regime: CSI 300 momentum + breadth of covered names.
        bench_series = index_map.get(INDEX_CODE, [])
        bench_closes = [p["close"] for p in bench_series]
        bench_last = bench_closes[-1] if bench_closes else 0
        ret20 = bench_last / bench_closes[-21] - 1 if len(bench_closes) >= 21 and bench_closes[-21] else 0
        ret60 = bench_last / bench_closes[-61] - 1 if len(bench_closes) >= 61 and bench_closes[-61] else 0
        ma20 = statistics.mean(bench_closes[-20:]) if len(bench_closes) >= 20 else bench_last
        ma60 = statistics.mean(bench_closes[-60:]) if len(bench_closes) >= 60 else bench_last
        price_data = _load_price_map(conn, "prices", "stock_code")
        covered = list({r["stock_code"] for r in reports})
        above = 0
        breadth_values = []
        for code in covered:
            closes = [price_data[code][d] for d in sorted(price_data[code])]
            if len(closes) >= 20:
                if closes[-1] > statistics.mean(closes[-20:]):
                    above += 1
                breadth_values.append(closes[-1] / closes[-21] - 1)
        breadth = above / len(breadth_values) if breadth_values else 0.5
        avg_stock_20d = statistics.mean(breadth_values) if breadth_values else 0
        has_market = len(bench_closes) >= 21
        if has_market:
            temperature = 50 + ret20 * 260 + (breadth - 0.5) * 45 + (8 if bench_last > ma20 else -8)
            temperature = round(max(8.0, min(94.0, temperature)), 1)
        else:
            temperature = 0
        if not has_market:
            regime = "待导入"
            market_note = "行情数据尚未导入，市场温度暂不可计算。导入指数与个股行情后会自动生成。"
        else:
            if temperature >= 65:
                regime = "进攻"
            elif temperature >= 45:
                regime = "震荡"
            else:
                regime = "防守"
            market_note = (
                f"沪深300近20日 {ret20 * 100:+.1f}%，位于20日均线"
                f"{'上方' if bench_last > ma20 else '下方'}；覆盖标的中 {breadth * 100:.0f}% 站上20日线。"
            )
            if top_industry:
                market_note += f" 结构上，{top_industry['name']}平均超额最高（{top_industry['avg_excess']:+.2f}%）。"
            if latest_analyst:
                market_note += f" 当前 Alpha 排名第一为{latest_analyst['name']}（{latest_analyst['firm']}）。"
        market = {
            "temperature": temperature,
            "regime": regime,
            "bench_ret_20d": round(ret20 * 100, 2),
            "bench_ret_60d": round(ret60 * 100, 2),
            "bench_ma20": round(ma20, 2),
            "bench_ma60": round(ma60, 2),
            "above_ma20": bool(bench_last > ma20) if bench_last else False,
            "breadth": round(breadth * 100, 1),
            "avg_stock_20d": round(avg_stock_20d * 100, 2),
            "top_industry": top_industry["name"] if top_industry else None,
            "note": market_note,
        }

        rating_changes = {
            "upgrades": sum(1 for r in reports if r["prev_rating"] and r["rating"] != r["prev_rating"] and r["rating"] == "买入"),
            "downgrades": sum(1 for r in reports if r["prev_rating"] and r["rating"] != r["prev_rating"] and r["rating"] != "买入"),
            "maintained": sum(1 for r in reports if not r["prev_rating"] or r["rating"] == r["prev_rating"]),
        }

        recent = reports[:6]
        all_dates = [point["date"] for point in equity]
        index_dates = [p["date"] for series in index_map.values() for p in series]
        as_of = (
            max((r["latest_date"] for r in reports if r.get("latest_date")), default=None)
            or (max(r["publish_date"] for r in reports) if reports else None)
            or (max(index_dates) if index_dates else None)
        )
        return {
            "as_of": as_of,
            "demo": False,
            "has_data": bool(reports),
            "has_performance": metrics["has_performance"],
            "metrics": {
                **metrics,
                "analyst_count": len(analysts),
                "coverage_count": len({r["stock_code"] for r in reports}),
                "top_score": analysts[0]["metrics"]["score"] if analysts else 0,
            },
            "indices": indices,
            "equity": equity,
            "range_dates": {"start": all_dates[0], "end": all_dates[-1]} if all_dates else {},
            "monthly": monthly,
            "intent": [
                {"label": label, "count": count}
                for label, count in sorted(intent_counts.items(), key=lambda x: -x[1])
            ],
            "ratings": [
                {"label": label, "count": count}
                for label, count in sorted(rating_counts.items(), key=lambda x: -x[1])
            ],
            "industries": industry_breakdown,
            "market": market,
            "rating_changes": rating_changes,
            "top_analysts": analysts[:5],
            "recent_reports": recent,
            "market_note": market_note,
        }
    finally:
        conn.close()


def get_analysts() -> list[dict[str, Any]]:
    conn = connect()
    try:
        reports = build_report_rows(conn)
        by_analyst: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for report in reports:
            by_analyst[report["analyst"]["id"]].append(report)
        result = [
            _analyst_summary(by_analyst.get(a["id"], []), a)
            for a in rows(conn, "SELECT * FROM analysts ORDER BY name")
        ]
        result.sort(key=lambda a: a["metrics"]["score"], reverse=True)
        return result
    finally:
        conn.close()


def get_analyst(analyst_id: str) -> dict[str, Any] | None:
    conn = connect()
    try:
        analyst = row(conn, "SELECT * FROM analysts WHERE id = ?", (analyst_id,))
        if not analyst:
            return None
        reports = [r for r in build_report_rows(conn) if r["analyst"]["id"] == analyst_id]
        summary = _analyst_summary(reports, analyst)
        dates = sorted({point["date"] for r in reports for point in r["series"]})
        summary["equity"] = _alpha_series(reports, dates)
        summary["reports"] = sorted(reports, key=lambda r: r["publish_date"], reverse=True)

        industries: dict[str, list[dict[str, Any]]] = defaultdict(list)
        ratings: dict[str, int] = defaultdict(int)
        intentions: dict[str, int] = defaultdict(int)
        for report in reports:
            industries[report["industry"]].append(report)
            ratings[report["rating"]] += 1
            intentions[report["intention_label"]] += 1
        industry_breakdown = []
        for name, items in industries.items():
            tracked = [i for i in items if i.get("performance_status") == "tracked"]
            industry_breakdown.append(
                {
                    "name": name,
                    "count": len(items),
                    "priced_count": len(tracked),
                    "avg_excess": round(statistics.mean(i["excess"] for i in tracked), 2) if tracked else None,
                    "win_rate": round(sum(1 for i in tracked if i["excess"] > 0) / len(tracked) * 100, 1) if tracked else None,
                }
            )
        summary["industry_breakdown"] = industry_breakdown
        summary["rating_breakdown"] = [{"label": k, "count": v} for k, v in ratings.items()]
        summary["intent_breakdown"] = [{"label": k, "count": v} for k, v in intentions.items()]
        return summary
    finally:
        conn.close()


def get_reports(analyst: str | None = None, rating: str | None = None, query: str | None = None) -> list[dict[str, Any]]:
    conn = connect()
    try:
        reports = build_report_rows(conn)
        if analyst:
            reports = [r for r in reports if r["analyst"]["id"] == analyst]
        if rating and rating != "全部":
            reports = [r for r in reports if r["rating"] == rating]
        if query:
            q = query.strip().lower()
            reports = [
                r
                for r in reports
                if q in r["stock_name"].lower()
                or q in r["stock_code"].lower()
                or q in r["title"].lower()
                or q in r["analyst"]["name"].lower()
                or q in " ".join(r["tags"]).lower()
            ]
        return reports
    finally:
        conn.close()


def get_report(report_id: str) -> dict[str, Any] | None:
    conn = connect()
    try:
        reports = build_report_rows(conn)
        report = next((r for r in reports if r["id"] == report_id), None)
        if not report:
            return None
        raw = row(conn, "SELECT content FROM reports WHERE id = ?", (report_id,))
        report["content"] = (raw or {}).get("content") or ""
        report["intent_breakdown"] = []
        if report["scope"] == "stock" and report.get("target_upside") is not None:
            rating_factor = {"买入": 1.0, "增持": 0.82, "中性": 0.25}.get(report["rating"], 0.6)
            report["intent_breakdown"] = [
                {"name": "评级强度", "score": round(32 * rating_factor, 1), "max": 32},
                {"name": "目标空间", "score": round(min(report["target_upside"] / 0.35, 1) * 30, 1), "max": 30},
                {"name": "催化明确度", "score": round(report["catalyst_score"] * 20, 1), "max": 20},
                {"name": "观点一致性", "score": round(report["conviction_score"] * 18, 1), "max": 18},
            ]
        report["related"] = [
            r for r in reports
            if r["id"] != report_id and (r["analyst"]["id"] == report["analyst"]["id"] or r["industry"] == report["industry"])
        ][:3]
        return report
    finally:
        conn.close()


def get_meta() -> dict[str, Any]:
    conn = connect()
    try:
        latest = row(conn, "SELECT MAX(date) AS date FROM indices")
        report_count = row(conn, "SELECT COUNT(*) AS n FROM reports")
        analyst_count = row(conn, "SELECT COUNT(*) AS n FROM analysts")
        latest_report = row(conn, "SELECT MAX(publish_date) AS date FROM reports")
        count = report_count["n"] if report_count else 0
        return {
            "as_of": (
                latest["date"] if latest and latest["date"]
                else latest_report["date"] if latest_report and latest_report["date"]
                else None
            ),
            "report_count": count,
            "analyst_count": analyst_count["n"] if analyst_count else 0,
            "has_data": count > 0,
            "demo": False,
            "source": "本地研究数据" if count else "空库 · 等待导入研报",
        }
    finally:
        conn.close()
