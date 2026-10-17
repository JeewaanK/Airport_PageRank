"""
Download the full daily price history of a NEPSE stock (default: HDL) to CSV.

NEPSE's `/api/nots/market/history/security/{id}` endpoint only retains about one
year of daily bars: yearly windows before that lookback return empty content
(not a date-format bug). This script therefore:

  1. Requests Merolagani's chart handler from the symbol's listing/IPO date
     through today (deepest publicly available daily OHLCV series).
  2. Optionally merges recent trade-count / turnover fields from
     NepseUnofficialApi when that ~1y window overlaps.

Setup (Python 3.11+):
    pip install git+https://github.com/basic-bgnr/NepseUnofficialApi pandas requests

Run:
    python hdl_price_history.py            # HDL
    python hdl_price_history.py NABIL      # any other symbol
"""
import sys
import time
from datetime import date, datetime, timezone

import pandas as pd
import requests

SYMBOL = (sys.argv[1] if len(sys.argv) > 1 else "HDL").upper()

# NEPSE listing / IPO dates (public company pages). Used as the request start;
# vendors may only have bars from a later first-trade day.
LISTING_DATES = {
    "HDL": date(2003, 3, 21),  # nepalstock / ShareSansar / Sun Securities
}

MEROLAGANI_CHART = "https://merolagani.com/handlers/TechnicalChartHandler.ashx"
HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": f"https://merolagani.com/CompanyDetail.aspx?symbol={SYMBOL}",
    "X-Requested-With": "XMLHttpRequest",
}


def listing_date_for(symbol: str) -> date:
    return LISTING_DATES.get(symbol, date(2000, 1, 1))


def _epoch(d: date, end_of_day: bool = False) -> int:
    hh, mm, ss = (23, 59, 59) if end_of_day else (0, 0, 0)
    return int(datetime(d.year, d.month, d.day, hh, mm, ss, tzinfo=timezone.utc).timestamp())


def fetch_merolagani(symbol: str, start: date, end: date) -> pd.DataFrame:
    """Daily OHLCV from Merolagani (adjusted). Chunk by year to avoid silent truncation."""
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
            MEROLAGANI_CHART, params=params, headers=HTTP_HEADERS, timeout=60
        )
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict) or str(data.get("s", "")).lower() == "no_data":
            print(f"{year}: 0 trading days (merolagani)")
            time.sleep(0.35)
            continue
        needed = {"t", "o", "h", "l", "c", "v"}
        if not needed.issubset(data):
            raise RuntimeError(f"Unexpected Merolagani schema for {year}: {list(data)}")
        n = len(data["t"])
        if not n:
            print(f"{year}: 0 trading days (merolagani)")
            time.sleep(0.35)
            continue
        frame = pd.DataFrame(
            {
                "businessDate": pd.to_datetime(data["t"], unit="s", utc=True).tz_convert(
                    None
                ).normalize(),
                "openPrice": data["o"],
                "highPrice": data["h"],
                "lowPrice": data["l"],
                "closePrice": data["c"],
                "totalTradedQuantity": data["v"],
            }
        )
        print(f"{year}: {len(frame)} trading days (merolagani)")
        frames.append(frame)
        time.sleep(0.35)  # be polite to the server
    if not frames:
        return pd.DataFrame()
    out = pd.concat(frames, ignore_index=True)
    return out.drop_duplicates(subset="businessDate").sort_values("businessDate")


def fetch_nepse_recent(symbol: str) -> pd.DataFrame:
    """Trailing ~1y window from nepalstock.com (extra trade fields when present)."""
    try:
        from nepse import Nepse
    except ImportError:
        print("NepseUnofficialApi not installed; skipping NEPSE merge.")
        return pd.DataFrame()

    nepse = Nepse()
    nepse.setTLSVerification(False)  # nepalstock.com has recurring SSL issues
    security_id = nepse.getSecurityIDKeyMap()[symbol]
    base = nepse.api_end_points["company_price_volume_history"]
    today = date.today()
    start = today.replace(year=today.year - 1)
    rows, page = [], 0
    while True:
        url = (
            f"{base}{security_id}?&size=500&page={page}"
            f"&startDate={start}&endDate={today}"
        )
        resp = nepse.requestGETAPI(url=url)
        if isinstance(resp, list):
            rows.extend(resp)
            break
        content = resp.get("content", [])
        rows.extend(content)
        total_pages = resp.get("totalPages", 1)
        page += 1
        if page >= total_pages or not content:
            break
    if not rows:
        print("NEPSE recent window: 0 rows")
        return pd.DataFrame()
    df = pd.DataFrame(rows)
    date_col = next((c for c in df.columns if "date" in c.lower()), None)
    if not date_col:
        return pd.DataFrame()
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.rename(columns={date_col: "businessDate"})
    keep = [
        c
        for c in (
            "businessDate",
            "totalTrades",
            "totalTradedQuantity",
            "totalTradedValue",
            "highPrice",
            "lowPrice",
            "closePrice",
        )
        if c in df.columns
    ]
    df = df[keep].drop_duplicates(subset="businessDate").sort_values("businessDate")
    print(f"NEPSE recent window: {len(df)} rows "
          f"({df['businessDate'].min().date()} → {df['businessDate'].max().date()})")
    return df


def merge_nepse_fields(primary: pd.DataFrame, nepse: pd.DataFrame) -> pd.DataFrame:
    if nepse.empty:
        for col in ("totalTrades", "totalTradedValue"):
            if col not in primary.columns:
                primary[col] = pd.NA
        return primary
    nepse = nepse.copy()
    primary = primary.copy()
    primary["businessDate"] = pd.to_datetime(primary["businessDate"]).dt.normalize()
    nepse["businessDate"] = pd.to_datetime(nepse["businessDate"]).dt.normalize()
    extra = [c for c in ("totalTrades", "totalTradedValue") if c in nepse.columns]
    merged = primary.merge(nepse[["businessDate", *extra]], on="businessDate", how="left")
    # Prefer NEPSE quantity/OHLC on overlap when present (same session, richer fields).
    for col in ("highPrice", "lowPrice", "closePrice", "totalTradedQuantity"):
        if col in nepse.columns and col in merged.columns:
            right = nepse.set_index("businessDate")[col]
            merged[col] = merged["businessDate"].map(right).combine_first(merged[col])
    return merged


listing = listing_date_for(SYMBOL)
today = date.today()
print(f"{SYMBOL}: requesting {listing} (listing/IPO) → {today}")

df = fetch_merolagani(SYMBOL, listing, today)
if df.empty:
    sys.exit(
        f"No Merolagani data for {SYMBOL} from {listing}. "
        "Check the symbol or try again later."
    )

nepse_df = fetch_nepse_recent(SYMBOL)
df = merge_nepse_fields(df, nepse_df)

cols = [
    c
    for c in (
        "businessDate",
        "openPrice",
        "highPrice",
        "lowPrice",
        "closePrice",
        "totalTradedQuantity",
        "totalTrades",
        "totalTradedValue",
    )
    if c in df.columns
]
df = df[cols].drop_duplicates(subset="businessDate").sort_values("businessDate")
df["businessDate"] = pd.to_datetime(df["businessDate"]).dt.strftime("%Y-%m-%d")

out = f"{SYMBOL}_price_history.csv"
df.to_csv(out, index=False)

first, last = df.iloc[0], df.iloc[-1]
print(f"\nListing/IPO date used: {listing}")
print(f"Saved {len(df)} rows to {out}")
print(f"Columns: {list(df.columns)}")
print(f"Range: {first['businessDate']} to {last['businessDate']}")
if first["businessDate"] > listing.isoformat():
    print(
        f"Note: earliest available bar is {first['businessDate']} "
        f"(vendors have no daily history back to listing {listing})."
    )
print(f"First row: {first.to_dict()}")
print(f"Last row:  {last.to_dict()}")
