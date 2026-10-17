"""
Download the full daily price history of a NEPSE stock (default: HDL) to CSV.

Setup (Python 3.11+):
    pip install git+https://github.com/basic-bgnr/NepseUnofficialApi pandas

Run:
    python hdl_price_history.py            # HDL
    python hdl_price_history.py NABIL      # any other symbol
"""
import sys
import time
from datetime import date, timedelta

import pandas as pd
from nepse import Nepse

SYMBOL = (sys.argv[1] if len(sys.argv) > 1 else "HDL").upper()
START_YEAR = 2000  # earlier than any listing; empty years are simply skipped

nepse = Nepse()
nepse.setTLSVerification(False)  # nepalstock.com has recurring SSL certificate issues

security_id = nepse.getSecurityIDKeyMap()[SYMBOL]
base = nepse.api_end_points["company_price_volume_history"]


def fetch_window(start, end):
    """Fetch every page of daily records between start and end."""
    rows, page = [], 0
    while True:
        url = (f"{base}{security_id}?&size=500&page={page}"
               f"&startDate={start}&endDate={end}")
        resp = nepse.requestGETAPI(url=url)
        if isinstance(resp, list):          # some versions return the list directly
            return resp
        content = resp.get("content", [])
        rows.extend(content)
        total_pages = resp.get("totalPages", 1)
        page += 1
        if page >= total_pages or not content:
            return rows


all_rows = []
today = date.today()
for year in range(START_YEAR, today.year + 1):
    start = date(year, 1, 1)
    end = min(date(year, 12, 31), today)
    try:
        rows = fetch_window(start, end)
    except Exception as e:
        print(f"{year}: failed ({e}); retrying once")
        time.sleep(3)
        rows = fetch_window(start, end)
    if rows:
        print(f"{year}: {len(rows)} trading days")
    all_rows.extend(rows)
    time.sleep(0.5)  # be polite to the server

if not all_rows:
    sys.exit(f"No data returned for {SYMBOL}. Check the symbol or try again later.")

df = pd.DataFrame(all_rows)
date_col = next((c for c in df.columns if "date" in c.lower()), None)
if date_col:
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.drop_duplicates(subset=date_col).sort_values(date_col)

out = f"{SYMBOL}_price_history.csv"
df.to_csv(out, index=False)
print(f"\nSaved {len(df)} rows to {out}")
print(f"Columns: {list(df.columns)}")
if date_col:
    print(f"Range: {df[date_col].min().date()} to {df[date_col].max().date()}")
