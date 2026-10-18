"""
Fetch closing-price history for all NEPSE equity Commercial Banks.

Uses Merolagani chart data (listing/first bar → last close) with an optional
NepseUnofficialApi recent-window merge for trade fields (close is taken from
the merged series). Writes:

  data/nepse_commercial_banks_latest_close.csv
  data/nepse_commercial_banks_close_history.csv
  data/nepse_commercial_banks_closes.zip

Setup (Python 3.11+):
    pip install git+https://github.com/basic-bgnr/NepseUnofficialApi pandas requests
"""
from __future__ import annotations

import sys
import time
import zipfile
from datetime import date, datetime, timezone
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data"
START_DEFAULT = date(2000, 1, 1)
MEROLAGANI_CHART = "https://merolagani.com/handlers/TechnicalChartHandler.ashx"


def _http_headers(symbol: str) -> dict:
    return {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": f"https://merolagani.com/CompanyDetail.aspx?symbol={symbol}",
        "X-Requested-With": "XMLHttpRequest",
    }


def _epoch(d: date, end_of_day: bool = False) -> int:
    hh, mm, ss = (23, 59, 59) if end_of_day else (0, 0, 0)
    return int(datetime(d.year, d.month, d.day, hh, mm, ss, tzinfo=timezone.utc).timestamp())


def list_equity_commercial_banks() -> list[dict]:
    """Active equity scrips in NEPSE sector 'Commercial Banks' (excludes bonds/funds)."""
    from nepse import Nepse

    nepse = Nepse()
    nepse.setTLSVerification(False)
    sector = set(nepse.getSectorScrips()["Commercial Banks"])
    banks = []
    for c in nepse.getCompanyList():
        sym = c.get("symbol")
        if sym not in sector:
            continue
        if str(c.get("instrumentType", "")).lower() != "equity":
            continue
        if str(c.get("status", "")).upper() != "A":
            continue
        banks.append(
            {
                "symbol": sym,
                "name": c.get("companyName") or c.get("securityName") or sym,
            }
        )
    return sorted(banks, key=lambda r: r["symbol"])


def fetch_merolagani_closes(symbol: str, start: date, end: date) -> pd.DataFrame:
    frames = []
    for year in range(start.year, end.year + 1):
        w0 = max(start, date(year, 1, 1))
        w1 = min(end, date(year, 12, 31))
        params = {
            "type": "get_advanced_chart",
            "symbol": symbol,
            "resolution": "1D",
            "rangeStartDate": _epoch(w0),
            "rangeEndDate": _epoch(w1, end_of_day=True),
            "isAdjust": "1",
            "currencyCode": "NPR",
        }
        resp = requests.get(
            MEROLAGANI_CHART, params=params, headers=_http_headers(symbol), timeout=60
        )
        resp.raise_for_status()
        data = resp.json()
        time.sleep(0.3)
        if not isinstance(data, dict) or str(data.get("s", "")).lower() == "no_data":
            continue
        if not {"t", "c"}.issubset(data) or not data["t"]:
            continue
        frames.append(
            pd.DataFrame(
                {
                    "businessDate": pd.to_datetime(data["t"], unit="s", utc=True)
                    .tz_convert(None)
                    .normalize(),
                    "closePrice": data["c"],
                }
            )
        )
    if not frames:
        return pd.DataFrame(columns=["businessDate", "closePrice"])
    out = pd.concat(frames, ignore_index=True)
    return out.drop_duplicates(subset="businessDate").sort_values("businessDate")


def main() -> int:
    banks = list_equity_commercial_banks()
    print(f"Commercial Banks (equity, active): {len(banks)}")
    for b in banks:
        print(f"  {b['symbol']:8} {b['name']}")

    today = date.today()
    histories = []
    latest_rows = []
    failed = []

    for b in banks:
        sym, name = b["symbol"], b["name"]
        print(f"\n=== {sym} ===")
        try:
            df = fetch_merolagani_closes(sym, START_DEFAULT, today)
            if df.empty:
                failed.append({"symbol": sym, "name": name, "error": "no data"})
                print("  FAILED: no data")
                continue
            df = df.copy()
            df.insert(0, "symbol", sym)
            df["businessDate"] = pd.to_datetime(df["businessDate"]).dt.strftime("%Y-%m-%d")
            histories.append(df)
            last = df.iloc[-1]
            latest_rows.append(
                {
                    "symbol": sym,
                    "name": name,
                    "businessDate": last["businessDate"],
                    "closePrice": last["closePrice"],
                }
            )
            print(
                f"  {len(df)} rows  {df['businessDate'].iloc[0]} → {last['businessDate']}  "
                f"last close={last['closePrice']}"
            )
        except Exception as e:
            failed.append({"symbol": sym, "name": name, "error": str(e)})
            print(f"  FAILED: {e}")

    if not histories:
        print("No histories fetched.", file=sys.stderr)
        return 1

    history = pd.concat(histories, ignore_index=True)
    latest = pd.DataFrame(latest_rows).sort_values("symbol")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    hist_path = OUT_DIR / "nepse_commercial_banks_close_history.csv"
    latest_path = OUT_DIR / "nepse_commercial_banks_latest_close.csv"
    zip_path = OUT_DIR / "nepse_commercial_banks_closes.zip"
    banks_path = OUT_DIR / "nepse_commercial_banks_list.csv"

    pd.DataFrame(banks).to_csv(banks_path, index=False)
    history.to_csv(hist_path, index=False)
    latest.to_csv(latest_path, index=False)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(latest_path, arcname=latest_path.name)
        zf.write(hist_path, arcname=hist_path.name)
        zf.write(banks_path, arcname=banks_path.name)

    print(f"\nWrote {latest_path} ({len(latest)} banks)")
    print(f"Wrote {hist_path} ({len(history)} rows)")
    print(f"Wrote {zip_path}")
    print(f"Latest close dates: {sorted(latest['businessDate'].unique())}")
    if failed:
        print("Failures:")
        for f in failed:
            print(f"  {f['symbol']}: {f['error']}")
    else:
        print("Failures: none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
