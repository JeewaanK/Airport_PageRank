# Discussion: Using PageRank to Identify Important Airports in the U.S. Flight Network

## Executive Summary

This project applies the PageRank algorithm to the U.S. airport route network to identify airports that are structurally important within the national flight system. Airports are modeled as nodes, and direct flight routes are modeled as directed edges. The main goal is to move beyond a simple count of direct routes and instead measure how importance flows through the network.

The analysis uses OpenFlights airport and route data. After filtering to direct routes between U.S. airports, the final network contains 549 airports and 5,450 directed route edges. The adjacency matrix is binary, meaning an entry equals 1 if a direct route exists and 0 otherwise. This version measures route connectivity rather than flight frequency or passenger volume.

The PageRank algorithm converged in 112 iterations using a damping factor of 0.85. The highest-ranked airports in the baseline network were DEN, ATL, ORD, DFW, MSP, LAS, DTW, CLT, IAH, and ANC. These results show that PageRank identifies major airport hubs that are not only highly connected, but also connected to other important airports. A sensitivity analysis across damping factors `d = 0.65, 0.75, 0.85, 0.95` confirms that this top-hub ranking is stable: the Spearman rank correlation against the baseline stays above 0.988 and the top-10 set overlaps in 9 out of 10 airports at every damping value tested.

A hub-closure simulation was also performed by removing ATL from the network. After ATL was removed, DEN remained the top-ranked airport, while ORD, DFW, MSP, DTW, and CLT increased in relative importance. This suggests that the U.S. airport network has a distributed hub structure: removing one major hub changes the flow of importance, but the network does not completely collapse.

## Project Objective

The objective of this project is to use linear algebra to analyze a real-world transportation network. The central research question is:

**Which airports are most important in the U.S. flight network when importance is measured by network structure instead of only by the number of direct routes?**

This question is well suited for PageRank because PageRank measures recursive importance. An airport receives a high PageRank score if it receives connections from airports that are themselves important. In the context of air travel, this means an airport is central not only because it has many routes, but because it is positioned within the broader system of important routes and hubs.

The project also asks a second question:

**How does the network change when a major hub is removed?**

To answer this, ATL was removed from the network by deleting all routes into and out of the airport. PageRank was then recomputed to observe how centrality shifted across the remaining airports.

## Data Description

The project uses two OpenFlights data files:

- `airports.dat`, which contains airport metadata such as IATA code, city, country, latitude, and longitude.
- `routes.dat`, which contains directional airline routes from source airports to destination airports.

The data was filtered to include only:

- Airports located in the United States.
- Airports with valid IATA codes.
- Direct routes where both the source and destination airports are in the United States.
- Routes with zero stops.

After filtering, the final network contains:

| Metric | Value |
|---|---:|
| Airports in network | 549 |
| Directed route edges | 5,450 |
| Adjacency matrix size | 549 by 549 |
| Dangling airports | 7 |
| Damping factor | 0.85 |
| Baseline convergence | 112 iterations |

The current notebook uses a binary adjacency matrix. If there are one or more direct routes from airport `j` to airport `i`, the matrix entry is 1. Otherwise, it is 0. This means the model studies whether direct connectivity exists, not the number of flights, airlines, seats, or passengers on each route.

## Mathematical Framework

### Directed Graph Representation

The airport system is represented as a directed graph. Each airport is a node, and each direct route is a directed edge from an origin airport to a destination airport.

For example, a route from Denver to Chicago is represented as:

```text
DEN → ORD
```

The direction matters because a route from airport `j` to airport `i` contributes to the probability of moving from `j` to `i`.

### Adjacency Matrix

The directed graph is converted into an adjacency matrix `A`. The project uses the PageRank convention:

```text
Aᵢⱼ = 1
```

if there is a direct route from airport `j` to airport `i`, and:

```text
Aᵢⱼ = 0
```

otherwise.

In this convention, each column represents the airport being departed from, and each row represents the airport being arrived at. This column-based structure is useful because PageRank requires a transition matrix where each column is a probability distribution.

### Transition Matrix

The adjacency matrix is normalized into a transition matrix `M`. Each column of `M` sums to 1:

```text
Mᵢⱼ = Aᵢⱼ / Σᵢ Aᵢⱼ
```

This means `Mᵢⱼ` represents the probability of moving from airport `j` to airport `i`, assuming each outgoing route from `j` is equally likely.

If an airport has no outgoing routes, that airport creates a dangling column. The notebook handles dangling columns by replacing them with a uniform probability vector:

```text
Mᵢⱼ = 1 / N
```

where `N` is the number of airports.

### PageRank and Damping Factor

The PageRank update formula used in the notebook is:

```text
vₖ₊₁ = dMvₖ + ((1 − d) / N)e
```

where:

- `vₖ` is the PageRank vector at iteration `k`.
- `M` is the transition matrix.
- `d = 0.85` is the damping factor.
- `N` is the number of airports.
- `e` is a vector of ones.

The damping factor has an important interpretation. With probability 0.85, a traveler follows an actual flight route. With probability 0.15, the traveler randomly jumps to any airport in the network. This prevents the Markov chain from getting stuck and helps ensure convergence.

The choice of `d = 0.85` is the standard value introduced in the original PageRank paper. It is a modeling parameter rather than a property of the route data. Because the value is conventional, this discussion includes a sensitivity analysis (see the **Sensitivity to the Damping Factor** section below) that recomputes PageRank at `d = 0.65, 0.75, 0.85, 0.95` and verifies that the top airports are stable across this range.

At convergence, the PageRank vector satisfies:

```text
Gv = v
```

where `G` is the Google Matrix. Therefore, the final PageRank vector is the principal eigenvector associated with eigenvalue 1.

## Baseline PageRank Results

The baseline PageRank model ranks the airports by their steady-state probabilities. A higher PageRank score means that, in the long run, a random traveler moving through the route network is more likely to be at that airport.

The top 15 airports in the baseline model are:

| Rank | Airport | City | PageRank |
|---:|---|---|---:|
| 1 | DEN | Denver | 0.024626 |
| 2 | ATL | Atlanta | 0.022397 |
| 3 | ORD | Chicago | 0.021209 |
| 4 | DFW | Dallas-Fort Worth | 0.020595 |
| 5 | MSP | Minneapolis | 0.017080 |
| 6 | LAS | Las Vegas | 0.015197 |
| 7 | DTW | Detroit | 0.015189 |
| 8 | CLT | Charlotte | 0.014562 |
| 9 | IAH | Houston | 0.013387 |
| 10 | ANC | Anchorage | 0.013216 |
| 11 | SLC | Salt Lake City | 0.013213 |
| 12 | LAX | Los Angeles | 0.012258 |
| 13 | SEA | Seattle | 0.011737 |
| 14 | PHL | Philadelphia | 0.011121 |
| 15 | IAD | Washington | 0.010772 |

The results are consistent with the idea that PageRank identifies airports that serve as major connectors across the U.S. route system. DEN, ATL, ORD, and DFW appear at the top because they have many connections and are linked to other highly connected airports.

DEN ranking first is especially interesting. It suggests that Denver has strong network centrality in the binary route network. This likely reflects Denver's role as a geographically central airport connecting many regions of the United States.

ATL ranks second in the PageRank model, even though it has the highest total degree in the network. This is an important distinction. Degree centrality counts the number of direct connections, while PageRank also accounts for the importance of the airports connected to a node.

## Comparison with Degree Centrality

To place PageRank in context, it is useful to compare it with simple degree centrality. Degree centrality counts the number of direct incoming and outgoing route connections. PageRank, by contrast, measures recursive network importance.

The airports with the highest total degree are:

| Airport | City | Total Degree | Out-Degree | In-Degree |
|---|---|---:|---:|---:|
| ATL | Atlanta | 305 | 153 | 152 |
| ORD | Chicago | 295 | 149 | 146 |
| DEN | Denver | 295 | 148 | 147 |
| DFW | Dallas-Fort Worth | 274 | 138 | 136 |
| MSP | Minneapolis | 232 | 116 | 116 |
| DTW | Detroit | 227 | 114 | 113 |
| LAS | Las Vegas | 226 | 113 | 113 |
| CLT | Charlotte | 218 | 110 | 108 |
| IAH | Houston | 201 | 101 | 100 |
| PHL | Philadelphia | 173 | 87 | 86 |

The degree ranking and PageRank ranking are similar but not identical. ATL has the most direct connections, but DEN has the highest PageRank score. This difference shows the value of PageRank: it does not only ask how many routes an airport has, but also where those routes are coming from and how important those connected airports are.

This makes PageRank a stronger measure of structural importance than simple route count alone.

## Visual Figures

The first figure shows the top 15 airports by baseline binary PageRank. DEN, ATL, ORD, and DFW stand out as the most central airports in the route network. The bar chart also shows that the PageRank distribution is concentrated among a small group of major hubs, with scores gradually declining after the top few airports.

![Top U.S. Airports by Binary PageRank](figures/top-airports-pagerank.png)

The second figure shows the largest rank changes after removing ATL from the network. Positive values indicate that an airport moved up in the ranking after ATL was removed, while negative values indicate that an airport moved down. GLH and TUP show the largest rank improvements, but these should be interpreted carefully because they begin with very small PageRank scores. From a national hub perspective, the more meaningful changes are the PageRank increases for airports such as DFW, CLT, ORD, DTW, DEN, IAH, and MSP.

![Largest Rank Changes After Removing ATL](figures/atl-removal-rank-changes.png)

## Sensitivity to the Damping Factor

The PageRank model in this project uses the standard damping factor `d = 0.85`. That value comes from the original PageRank paper and is a modeling convention rather than a property of the airport route network. To check that the baseline ranking is not an artifact of that single choice, PageRank was recomputed at four damping factors covering a wide range of teleportation behavior: `d = 0.65`, `d = 0.75`, `d = 0.85`, and `d = 0.95`.

### Methodology

The transition matrix `M` was held fixed. Only the damping factor in the update equation

```text
vₖ₊₁ = dMvₖ + ((1 − d) / N)e
```

was changed. The same convergence tolerance of `1e-10` was used in every run. The number of iterations to convergence increases sharply with `d`, which is consistent with the theoretical result that the convergence rate of power iteration is governed by the second-largest eigenvalue, which approaches 1 as `d → 1`.

| Damping factor | Iterations to converge |
|---:|---:|
| 0.65 | 43 |
| 0.75 | 64 |
| 0.85 | 112 |
| 0.95 | 353 |

### Comparison of top airports across damping factors

The table below shows how the top 10 airports under the baseline `d = 0.85` rank under each alternative damping factor.

| IATA | City | Rank @ 0.65 | PageRank @ 0.65 | Rank @ 0.75 | PageRank @ 0.75 | Rank @ 0.85 | PageRank @ 0.85 | Rank @ 0.95 | PageRank @ 0.95 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| DEN | Denver | 1 | 0.022856 | 1 | 0.024026 | 1 | 0.024626 | 1 | 0.025005 |
| ATL | Atlanta | 2 | 0.019593 | 2 | 0.021023 | 2 | 0.022397 | 2 | 0.024479 |
| ORD | Chicago | 4 | 0.018302 | 3 | 0.019763 | 3 | 0.021209 | 3 | 0.023311 |
| DFW | Dallas-Fort Worth | 3 | 0.018719 | 4 | 0.019745 | 4 | 0.020595 | 4 | 0.021924 |
| MSP | Minneapolis | 5 | 0.014386 | 5 | 0.015756 | 5 | 0.017080 | 5 | 0.018765 |
| LAS | Las Vegas | 10 | 0.011682 | 7 | 0.013338 | 6 | 0.015197 | 6 | 0.017700 |
| DTW | Detroit | 6 | 0.012138 | 6 | 0.013553 | 7 | 0.015189 | 7 | 0.017671 |
| CLT | Charlotte | 7 | 0.011988 | 8 | 0.013198 | 8 | 0.014562 | 8 | 0.016677 |
| IAH | Houston | 11 | 0.010849 | 11 | 0.012038 | 9 | 0.013387 | 9 | 0.015409 |
| ANC | Anchorage | 8 | 0.011985 | 9 | 0.012928 | 10 | 0.013216 | 17 | 0.011336 |

### Quantitative agreement between rankings

Two summary measures are used to quantify how closely the rankings agree across damping factors. The first is the Spearman rank correlation against the baseline ranking at `d = 0.85`. The second is the size of the intersection of the top 10 set at each damping factor with the baseline top 10.

| Damping factor | Spearman ρ vs `d = 0.85` | Top-10 overlap with `d = 0.85` |
|---:|---:|---:|
| 0.65 | 0.9896 | 9 / 10 |
| 0.75 | 0.9963 | 9 / 10 |
| 0.85 | 1.0000 | 10 / 10 |
| 0.95 | 0.9885 | 9 / 10 |

### Interpretation

Several patterns emerge from the sensitivity analysis.

The four highest-ranked airports — DEN, ATL, ORD, and DFW — remain in the top four for every damping factor in the range. The ordering of these four is unchanged at `d = 0.75`, `0.85`, and `0.95`. At `d = 0.65`, ORD and DFW swap into ranks 4 and 3 respectively, but they remain adjacent, and their PageRank scores are within `0.0004` of each other. MSP also remains at rank 5 across all damping factors.

The lower portion of the top 10 is more sensitive. At low damping (`d = 0.65`), the random-teleportation term carries more weight, so airports that depend on a few specific connections — such as IAH — fall just outside the top 10, while a regionally well-connected airport like SLC moves into it. At high damping (`d = 0.95`), route structure dominates and the relatively isolated Alaskan sub-network around ANC has less influence, so ANC drops out of the top 10 in favor of SLC. These are small absolute changes in PageRank score but visible changes in rank because the scores in this part of the distribution are close together.

The overall agreement is high: Spearman rank correlation across all 549 airports stays above `0.988` for every damping factor compared with the baseline, and the top-10 set overlaps in 9 of 10 airports in every case.

### Why this strengthens the conclusions

The sensitivity analysis adds robustness to the project for three reasons.

First, the most important single result — that DEN, ATL, ORD, DFW, and MSP are the top structurally central airports in the U.S. binary route network — is shown to be a conclusion about the network rather than about the choice `d = 0.85`. The same airports top the ranking whether teleportation is generous (`d = 0.65`) or rare (`d = 0.95`).

Second, the analysis gives a clearer interpretation of what damping does. Lower damping makes the model behave more like a uniform prior, so airports that are well distributed across the country gain importance. Higher damping makes the model behave more like a strict random walk on routes, so airports that sit at the center of dense subgraphs gain importance. Reading the sensitivity table makes this trade-off concrete.

Third, the analysis shows that the hub-closure result that follows is not an artifact of damping. Because the baseline ranking is stable across damping factors, the redistribution of importance after removing ATL is a statement about the underlying network structure, not about a specific modeling choice.

The supporting figure for this section is `figures/damping-factor-sensitivity.png`, which plots PageRank score versus damping factor for each of the top 10 baseline airports.

![PageRank score versus damping factor for the top 10 baseline airports](figures/damping-factor-sensitivity.png)

## Hub-Closure Simulation

The second part of the project studies a disruption scenario. ATL was removed from the network by deleting all routes where ATL was either the source or the destination. This simulates a major hub closure caused by an event such as severe weather, system failure, or airport shutdown.

After removing ATL:

| Metric | Value |
|---|---:|
| Removed hub | ATL |
| Remaining directed route edges | 5,145 |
| Post-closure convergence | 112 iterations |

The top 15 airports after removing ATL are:

| Rank | Airport | City | PageRank |
|---:|---|---|---:|
| 1 | DEN | Denver | 0.025490 |
| 2 | ORD | Chicago | 0.022219 |
| 3 | DFW | Dallas-Fort Worth | 0.021858 |
| 4 | MSP | Minneapolis | 0.017784 |
| 5 | DTW | Detroit | 0.016091 |
| 6 | CLT | Charlotte | 0.015803 |
| 7 | LAS | Las Vegas | 0.015790 |
| 8 | IAH | Houston | 0.014139 |
| 9 | SLC | Salt Lake City | 0.013607 |
| 10 | ANC | Anchorage | 0.013487 |
| 11 | LAX | Los Angeles | 0.012638 |
| 12 | SEA | Seattle | 0.012064 |
| 13 | PHL | Philadelphia | 0.011585 |
| 14 | IAD | Washington | 0.011292 |
| 15 | BOS | Boston | 0.010780 |

The most important result is that the network does not collapse when ATL is removed. DEN remains the top-ranked airport, while ORD and DFW move into the second and third positions. Other hubs, including MSP, DTW, CLT, LAS, and IAH, also become relatively more important.

This suggests that the U.S. airport network has a distributed hub structure. ATL is highly important, but there are enough other central airports that network importance redistributes after ATL is removed.

## Airports That Gain Importance After ATL Removal

The largest increases in actual PageRank score after removing ATL are:

| Airport | City | Rank Before | Rank After | Rank Change | PageRank Before | PageRank After | PageRank Change |
|---|---|---:|---:|---:|---:|---:|---:|
| DFW | Dallas-Fort Worth | 4 | 3 | 1 | 0.020595 | 0.021858 | 0.001263 |
| CLT | Charlotte | 8 | 6 | 2 | 0.014562 | 0.015803 | 0.001242 |
| GLH | Greenville | 330 | 113 | 217 | 0.000711 | 0.001907 | 0.001197 |
| ORD | Chicago | 3 | 2 | 1 | 0.021209 | 0.022219 | 0.001010 |
| DTW | Detroit | 7 | 5 | 2 | 0.015189 | 0.016091 | 0.000902 |
| TUP | Tupelo | 234 | 112 | 122 | 0.001010 | 0.001907 | 0.000897 |
| DEN | Denver | 1 | 1 | 0 | 0.024626 | 0.025490 | 0.000863 |
| IAH | Houston | 9 | 8 | 1 | 0.013387 | 0.014139 | 0.000752 |
| MSP | Minneapolis | 5 | 4 | 1 | 0.017080 | 0.017784 | 0.000704 |
| LAS | Las Vegas | 6 | 7 | -1 | 0.015197 | 0.015790 | 0.000593 |

This table gives a better picture than rank change alone. DFW, CLT, ORD, DTW, DEN, IAH, MSP, and LAS are major airports that absorb some of the importance that was previously associated with ATL. These are the most meaningful changes from a national network perspective.

GLH and TUP also show large increases. However, those results should be interpreted carefully. Smaller airports can experience large rank movements because many low-ranked airports have very similar PageRank scores. A relatively small absolute change can produce a large rank change.

Therefore, the most reliable disruption analysis should consider both rank change and PageRank score change.

## Airports That Lose Importance After ATL Removal

Some airports lose PageRank after ATL is removed. The largest PageRank decreases are:

| Airport | City | Rank Before | Rank After | Rank Change | PageRank Before | PageRank After | PageRank Change |
|---|---|---:|---:|---:|---:|---:|---:|
| DHN | Dothan | 503 | 545 | -42 | 0.000406 | 0.000286 | -0.000120 |
| MEI | Meridian | 502 | 546 | -44 | 0.000406 | 0.000286 | -0.000120 |
| ABY | Albany | 501 | 549 | -48 | 0.000406 | 0.000286 | -0.000120 |
| GTR | Columbus Mississippi | 500 | 547 | -47 | 0.000406 | 0.000286 | -0.000120 |
| MSL | Muscle Shoals | 499 | 540 | -41 | 0.000406 | 0.000286 | -0.000120 |
| CSG | Columbus | 498 | 539 | -41 | 0.000406 | 0.000286 | -0.000120 |
| BQK | Brunswick | 497 | 541 | -44 | 0.000406 | 0.000286 | -0.000120 |
| VLD | Valdosta | 504 | 532 | -28 | 0.000406 | 0.000286 | -0.000120 |
| PIB | Hattiesburg/Laurel | 496 | 538 | -42 | 0.000406 | 0.000286 | -0.000120 |
| MCN | Macon | 430 | 530 | -100 | 0.000510 | 0.000397 | -0.000113 |

Many of the airports that lose importance are smaller regional airports. This is reasonable because some regional airports are strongly connected to the national system through a major hub. When ATL is removed, those airports lose an important pathway into the broader network.

## Interpretation of Findings

The baseline results support the idea that PageRank captures structural centrality. Airports such as DEN, ATL, ORD, DFW, MSP, LAS, and DTW are important not only because they have many routes, but because they are embedded within a highly connected network of other important airports.

The hub-closure results show that ATL is important, but not irreplaceable in the network. Removing ATL causes centrality to redistribute to other major hubs, especially DEN, ORD, DFW, CLT, DTW, MSP, and IAH. This means the U.S. airport system has redundancy at the national level.

However, the impact is not uniform. Some smaller regional airports lose importance because their connectivity depends more heavily on ATL. This highlights a difference between national-level resilience and local-level vulnerability. The broader network can adapt, but airports that rely on a specific hub may be strongly affected.

The project also shows why PageRank is a useful linear algebra tool. The final rankings come from an iterative process that converges to the principal eigenvector of the Google Matrix. This connects a practical transportation question to eigenvectors, Markov chains, stochastic matrices, and matrix iteration.

## Limitations

The analysis has several limitations:

- The OpenFlights route data is historical, so the results should be interpreted as a demonstration of the PageRank method rather than a current operational ranking.
- The current adjacency matrix is binary. It does not account for flight frequency, passenger volume, aircraft size, airline capacity, or seasonal route differences.
- The model assumes each outgoing route from an airport is equally likely. In reality, travelers are more likely to take high-frequency routes than low-frequency routes.
- The hub-closure simulation removes all ATL routes completely. A real disruption might affect only certain airlines, time windows, or route types.
- The analysis focuses on PageRank centrality only. Other centrality measures, such as betweenness centrality or closeness centrality, could provide additional perspectives.

These limitations do not weaken the project. Instead, they clarify what the current model measures and suggest natural extensions.

## Possible Extensions

Several extensions could make the project stronger:

- Use BTS T-100 data to weight edges by passenger volume or number of flights.
- Compare binary PageRank with weighted PageRank.
- Compare PageRank with degree centrality, betweenness centrality, and eigenvector centrality.
- Run hub-closure simulations for multiple airports, such as DEN, ORD, DFW, LAX, and CLT.
- Measure total network disruption by calculating the total absolute change in PageRank after each hub removal.
- Create geographic visualizations showing how centrality shifts across regions.
- Study regional vulnerability by identifying airports whose PageRank depends heavily on a single hub.

## Conclusion

This project demonstrates how linear algebra can be applied to a real transportation network. By representing airports and routes as matrices, converting the network into a Markov chain, and applying PageRank through power iteration, it is possible to measure the structural importance of airports in the U.S. flight system.

The baseline analysis identifies DEN, ATL, ORD, DFW, MSP, LAS, DTW, CLT, IAH, and ANC as the most central airports in the binary route network. The hub-closure simulation shows that removing ATL shifts importance toward other major hubs rather than causing the network to collapse.

The main takeaway is that airport importance is not only about the number of direct routes. It also depends on how an airport is positioned within the broader network of important connections. PageRank captures this recursive structure and provides a meaningful way to study both centrality and resilience in the U.S. airport network.
