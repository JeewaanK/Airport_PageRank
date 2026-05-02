# Presenter Notes

Short talking points, slide by slide, for `Airport_PageRank_Presentation.pptx`. The deck has 12 slides. Each section below names the slide and gives the points the presenter should hit, plus likely audience questions and the answers we have prepared.

## Slide 1. Title

- Project: Using PageRank to identify critical airports in the U.S. flight network.
- Course context: Applied Linear Algebra.
- Team: Mindeok Seo, Jake Gust, Jeewan Khadka, Yijia Zhang, Alan Tang.
- One-line message: PageRank turns a route map into a ranking of structural importance. It does not just count direct routes — it asks whether an airport is connected to other important airports.

## Slide 2. Research Question

- Two questions: Which U.S. airports are most central by network structure? How does the network respond when a major hub is removed?
- Why PageRank is a good fit: it captures recursive importance.

## Slide 3. Data and Network Setup

- 549 airports, 5,450 directed edges, 549 by 549 adjacency matrix, 7 dangling airports.
- Filtering rules: U.S. airports with valid IATA codes, direct routes only, both endpoints in the U.S., zero stops.
- Binary model: route exists or it does not. Mention that this is a model choice and a limitation we will return to.

## Slide 4. From Routes to Matrices

- Walk through the four steps: directed graph, adjacency matrix, transition matrix, PageRank vector.
- Highlight the convention: `A[i, j] = 1` if there is a route from `j` to `i`. Columns are departure airports, rows are arrival airports. This makes the column sums interpretable as probabilities.
- The final equation `Gv = v` says PageRank is the principal eigenvector of the Google Matrix.

## Slide 5. PageRank Method

- Update equation: `v_{k+1} = d * M * v_k + ((1 - d) / N) * e`.
- Damping factor `d = 0.85` is the standard value from the original PageRank paper. With probability `d` the model follows a route. With probability `1 - d` it teleports uniformly. This avoids dead ends and ensures convergence.
- Stop when the L1 change between iterations is below tolerance `1e-10`. Baseline converges in 112 iterations.

## Slide 6. Baseline Results

- DEN ranks first. ATL ranks second despite having the highest total degree. ORD and DFW follow.
- Talking point: PageRank weights connections by the importance of the source. That is why DEN, which has slightly fewer total connections than ATL, can rank first.

## Slide 7. Damping Factor Sensitivity (NEW)

This is the slide most likely to attract questions. Be ready to explain it precisely.

What we did:

- Recomputed PageRank for `d = 0.65, 0.75, 0.85, 0.95` using the same transition matrix and tolerance.
- Compared the top airports and the full ranking against the baseline `d = 0.85`.

What we found:

- DEN, ATL, ORD, and DFW remain the top four for every damping factor we tried. Only ORD and DFW swap once at `d = 0.65`, and their scores are within `0.0004` of each other.
- The Spearman rank correlation against the baseline stays above `0.988` across all 549 airports.
- The top-10 set overlaps in 9 of 10 airports at every damping factor. The edge swap is between IAH or ANC and SLC.
- Iterations to converge: 43, 64, 112, 353. They rise sharply because the convergence rate is governed by the second-largest eigenvalue, which approaches 1 as `d` approaches 1.

How to explain damping in plain language:

- Lower `d` means more random teleportation. Importance is more evenly distributed and route structure matters less.
- Higher `d` means the random walk on routes dominates. Airports at the center of dense subgraphs gain importance.
- The fact that the top hubs are stable across this whole range means the ranking is driven by the U.S. route network, not by the choice `d = 0.85`.

Why this strengthens the project:

- It addresses the natural question: "Is `0.85` doing the work, or is the network doing the work?" The answer is the network.
- It sets up the hub-closure result on slide 8 as a statement about the network itself, not about a single modeling parameter.

Likely audience questions:

- *Why these four damping values?* They cover the standard range used in the PageRank literature, including values lower and higher than `0.85`. Going below `0.5` makes the model close to a uniform prior, which is no longer interesting. Going above `0.95` makes convergence slow and hits dangling-node issues hard.
- *What about `d = 1`?* The model reduces to a pure random walk on routes. The chain may not converge if the graph is not strongly connected. We do not include it for that reason.
- *Why does ANC drop out at `d = 0.95`?* ANC sits on a relatively isolated Alaskan sub-network. Higher damping makes route structure dominate, so airports embedded in dense, central parts of the graph gain importance and ANC loses it.

## Slide 8. Hub Closure Experiment

- Remove all routes into and out of ATL, rebuild the matrices, recompute PageRank.
- Result summary: 5,145 remaining routes, converges again in 112 iterations, DEN remains rank 1.
- Main message: the network does not collapse. Importance redistributes toward DEN, ORD, DFW, MSP, DTW, CLT, and IAH.

## Slide 9. Rank Changes After Removing ATL

- Reading the chart: positive value means the airport moved up after ATL was removed.
- Note that small airports like GLH and TUP show very large rank movements because their baseline scores are very close to other low-ranked airports. A small score change can produce a big rank change there. For hub-level interpretation, look at PageRank score change rather than rank alone.

## Slide 10. What We Learned

Four takeaways:

1. Centrality is recursive. PageRank captures that.
2. The ranking is robust to damping. The same hubs surface across `d = 0.65` to `0.95`.
3. The network is resilient at the national level. ATL is important but not irreplaceable.
4. Local vulnerability remains. Some regional airports lose a meaningful pathway when ATL is removed.

## Slide 11. Limitations and Extensions

Limitations:

- OpenFlights route data is historical.
- Binary adjacency matrix does not measure passenger volume or flight frequency.
- All outgoing routes from a given airport are treated as equally likely.
- ATL closure is total, not partial.

Extensions:

- Use BTS T-100 to weight edges by passengers or flight count.
- Compare with degree, betweenness, and eigenvector centrality.
- Simulate multiple hub closures.
- Map centrality shifts geographically.

## Slide 12. Conclusion

- One sentence: airport importance is not just route count; it depends on where an airport sits inside the network of important connections.
- The sensitivity analysis means this conclusion is about the network itself, not about the value `d = 0.85`.
- Repo: `github.com/JeewaanK/Airport_PageRank`.

## Quick reference: numbers to remember during Q&A

| Quantity | Value |
|---|---|
| Airports in network | 549 |
| Directed route edges | 5,450 |
| Damping factor (baseline) | 0.85 |
| Convergence tolerance | 1e-10 |
| Baseline iterations | 112 |
| Iterations at d = 0.65 / 0.75 / 0.85 / 0.95 | 43 / 64 / 112 / 353 |
| Spearman ρ vs baseline (min across d) | 0.9885 |
| Top-10 set overlap with baseline (min across d) | 9 / 10 |
| Routes remaining after removing ATL | 5,145 |
| Top-ranked airport (baseline and after ATL removal) | DEN |
