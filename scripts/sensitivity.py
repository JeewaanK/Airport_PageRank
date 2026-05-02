"""Damping factor sensitivity analysis for the airport PageRank model.

Computes baseline PageRank for several damping factors, prints a comparison
table of the top airports across damping factors, reports rank-correlation
between settings, and saves a line plot of selected top airports.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
FIG_DIR = ROOT / "figures"
FIG_DIR.mkdir(exist_ok=True)

airport_columns = [
    "airport_id", "name", "city", "country", "iata", "icao",
    "latitude", "longitude", "altitude", "timezone", "dst",
    "tz_database_time_zone", "type", "source",
]
route_columns = [
    "airline", "airline_id", "source_airport", "source_airport_id",
    "destination_airport", "destination_airport_id", "codeshare",
    "stops", "equipment",
]

airports = pd.read_csv(DATA_DIR / "airports.dat", names=airport_columns, na_values="\\N", keep_default_na=False)
routes = pd.read_csv(DATA_DIR / "routes.dat", names=route_columns, na_values="\\N", keep_default_na=False)

us_airports = airports[
    (airports["country"] == "United States")
    & (airports["iata"].notna())
    & (airports["iata"] != "")
    & (airports["type"] == "airport")
].copy()
us_airports = us_airports.drop_duplicates(subset="iata", keep="first")
us_iata_codes = set(us_airports["iata"])

us_routes = routes[
    (routes["source_airport"].isin(us_iata_codes))
    & (routes["destination_airport"].isin(us_iata_codes))
    & (routes["stops"] == 0)
].copy()

route_edges = (
    us_routes.groupby(["source_airport", "destination_airport"])
    .size()
    .reset_index(name="route_count")
)

active_airports = sorted(set(route_edges["source_airport"]).union(route_edges["destination_airport"]))
airport_lookup = (
    us_airports.set_index("iata")
    .loc[active_airports, ["name", "city", "country", "latitude", "longitude"]]
    .reset_index()
    .rename(columns={"index": "iata"})
)


def build_adjacency_matrix(airport_codes, route_edges):
    code_to_index = {code: i for i, code in enumerate(airport_codes)}
    n = len(airport_codes)
    adjacency = np.zeros((n, n), dtype=int)
    for _, row in route_edges.iterrows():
        adjacency[code_to_index[row["destination_airport"]], code_to_index[row["source_airport"]]] = 1
    return adjacency


def build_transition_matrix(A):
    n = A.shape[0]
    M = A.astype(float).copy()
    column_sums = M.sum(axis=0)
    dangling_columns = column_sums == 0
    M[:, ~dangling_columns] /= column_sums[~dangling_columns]
    M[:, dangling_columns] = 1.0 / n
    return M


def pagerank_power_iteration(M, damping=0.85, tolerance=1e-10, max_iter=1000):
    n = M.shape[0]
    v = np.ones(n) / n
    for iteration in range(1, max_iter + 1):
        next_v = damping * (M @ v) + (1 - damping) / n
        delta = np.linalg.norm(next_v - v, ord=1)
        v = next_v
        if delta < tolerance:
            return v, iteration, delta
    return v, max_iter, delta


airport_codes = list(airport_lookup["iata"])
A = build_adjacency_matrix(airport_codes, route_edges)
M = build_transition_matrix(A)

DAMPINGS = [0.65, 0.75, 0.85, 0.95]

scores_by_d = {}
iters_by_d = {}
for d in DAMPINGS:
    s, it, _ = pagerank_power_iteration(M, damping=d)
    scores_by_d[d] = s
    iters_by_d[d] = it
    print(f"d={d}: converged in {it} iterations, sum={s.sum():.6f}")

# Build rankings DataFrames keyed by IATA
rank_dfs = {}
for d, s in scores_by_d.items():
    df = airport_lookup.copy()
    df["pagerank"] = s
    df = df.sort_values("pagerank", ascending=False).reset_index(drop=True)
    df["rank"] = df.index + 1
    rank_dfs[d] = df.set_index("iata")

# Top-10 by baseline (d=0.85)
top10_baseline = rank_dfs[0.85].sort_values("pagerank", ascending=False).head(10)
print("\nTop 10 by baseline (d=0.85):")
print(top10_baseline[["name", "city", "pagerank", "rank"]])

# Comparison table: top 10 baseline airports, ranks/scores across damping factors
top10_iatas = list(top10_baseline.index)

print("\nRanks across damping factors for top-10 baseline airports:")
header = f"{'iata':<6}{'city':<22}" + "".join([f"  rank@{d:<5}  pr@{d:<5}" for d in DAMPINGS])
print(header)
for iata in top10_iatas:
    city = rank_dfs[0.85].loc[iata, "city"][:20]
    cells = []
    for d in DAMPINGS:
        r = int(rank_dfs[d].loc[iata, "rank"])
        p = rank_dfs[d].loc[iata, "pagerank"]
        cells.append(f"  {r:<10d}{p:<10.6f}")
    print(f"{iata:<6}{city:<22}" + "".join(cells))

# Spearman rank correlation across all airports between baseline and other dampings
def spearman(rank_a, rank_b):
    common = rank_a.index.intersection(rank_b.index)
    a = rank_a.loc[common].values.astype(float)
    b = rank_b.loc[common].values.astype(float)
    n = len(a)
    diff = a - b
    return 1 - (6 * (diff ** 2).sum()) / (n * (n ** 2 - 1))

base_ranks = rank_dfs[0.85]["rank"]
print("\nSpearman rank correlation vs baseline (d=0.85):")
for d in DAMPINGS:
    if d == 0.85:
        continue
    rho = spearman(base_ranks, rank_dfs[d]["rank"])
    print(f"  d={d}: rho = {rho:.4f}")

# Top-10 set overlap
base_top10 = set(top10_iatas)
print("\nOverlap of top-10 set vs baseline (d=0.85):")
for d in DAMPINGS:
    if d == 0.85:
        continue
    other_top10 = set(rank_dfs[d].sort_values("pagerank", ascending=False).head(10).index)
    print(f"  d={d}: |intersection|={len(base_top10 & other_top10)} / 10")

# Plot: line plot of PageRank score for top 10 baseline airports across damping factors
plt.figure(figsize=(10, 6), dpi=150)
colors = plt.cm.tab10(np.linspace(0, 1, len(top10_iatas)))
for color, iata in zip(colors, top10_iatas):
    pr_vals = [rank_dfs[d].loc[iata, "pagerank"] for d in DAMPINGS]
    plt.plot(DAMPINGS, pr_vals, marker="o", label=iata, color=color, linewidth=2)
plt.title("PageRank score vs damping factor for top 10 baseline airports", fontweight="bold")
plt.xlabel("Damping factor d")
plt.ylabel("PageRank score")
plt.grid(alpha=0.25)
plt.legend(loc="upper left", ncol=2, fontsize=9, frameon=False)
plt.gca().spines[["top", "right"]].set_visible(False)
plt.tight_layout()
out_path = FIG_DIR / "damping-factor-sensitivity.png"
plt.savefig(out_path, dpi=150)
print(f"\nSaved figure: {out_path}")

# Also persist a CSV of the comparison table for inclusion in README/DISCUSSION
rows = []
for iata in top10_iatas:
    row = {
        "iata": iata,
        "city": rank_dfs[0.85].loc[iata, "city"],
    }
    for d in DAMPINGS:
        row[f"rank_d{d}"] = int(rank_dfs[d].loc[iata, "rank"])
        row[f"pr_d{d}"] = round(rank_dfs[d].loc[iata, "pagerank"], 6)
    rows.append(row)
out_csv = ROOT / "outputs"
out_csv.mkdir(exist_ok=True)
pd.DataFrame(rows).to_csv(out_csv / "damping_sensitivity.csv", index=False)
print(f"Saved CSV: {out_csv / 'damping_sensitivity.csv'}")
