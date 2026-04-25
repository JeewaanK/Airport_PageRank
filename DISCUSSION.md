# Discussion: Using PageRank to Identify Important Airports in the U.S. Flight Network

## Executive Summary

This project applies the PageRank algorithm to the U.S. airport route network to identify airports that are structurally important within the national flight system. Airports are modeled as nodes, and direct flight routes are modeled as directed edges. The main goal is to move beyond a simple count of direct routes and instead measure how importance flows through the network.

The analysis uses OpenFlights airport and route data. After filtering to direct routes between U.S. airports, the final network contains 549 airports and 5,450 directed route edges. The adjacency matrix is binary, meaning an entry equals 1 if a direct route exists and 0 otherwise. This version measures route connectivity rather than flight frequency or passenger volume.

The PageRank algorithm converged in 112 iterations using a damping factor of 0.85. The highest-ranked airports in the baseline network were DEN, ATL, ORD, DFW, MSP, LAS, DTW, CLT, IAH, and ANC. These results show that PageRank identifies major airport hubs that are not only highly connected, but also connected to other important airports.

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

The current notebook uses a binary adjacency matrix. If there are one or more direct routes from airport \(j\) to airport \(i\), the matrix entry is 1. Otherwise, it is 0. This means the model studies whether direct connectivity exists, not the number of flights, airlines, seats, or passengers on each route.

## Mathematical Framework

### Directed Graph Representation

The airport system is represented as a directed graph. Each airport is a node, and each direct route is a directed edge from an origin airport to a destination airport.

For example, a route from Denver to Chicago is represented as:

\[
\text{DEN} \rightarrow \text{ORD}
\]

The direction matters because a route from airport \(j\) to airport \(i\) contributes to the probability of moving from \(j\) to \(i\).

### Adjacency Matrix

The directed graph is converted into an adjacency matrix \(A\). The project uses the PageRank convention:

\[
A_{ij} = 1
\]

if there is a direct route from airport \(j\) to airport \(i\), and:

\[
A_{ij} = 0
\]

otherwise.

In this convention, each column represents the airport being departed from, and each row represents the airport being arrived at. This column-based structure is useful because PageRank requires a transition matrix where each column is a probability distribution.

### Transition Matrix

The adjacency matrix is normalized into a transition matrix \(M\). Each column of \(M\) sums to 1:

\[
M_{ij} = \frac{A_{ij}}{\sum_i A_{ij}}
\]

This means \(M_{ij}\) represents the probability of moving from airport \(j\) to airport \(i\), assuming each outgoing route from \(j\) is equally likely.

If an airport has no outgoing routes, that airport creates a dangling column. The notebook handles dangling columns by replacing them with a uniform probability vector:

\[
M_{ij} = \frac{1}{N}
\]

where \(N\) is the number of airports.

### PageRank and Damping Factor

The PageRank update formula used in the notebook is:

\[
v_{k+1} = dMv_k + \frac{1-d}{N}e
\]

where:

- \(v_k\) is the PageRank vector at iteration \(k\).
- \(M\) is the transition matrix.
- \(d = 0.85\) is the damping factor.
- \(N\) is the number of airports.
- \(e\) is a vector of ones.

The damping factor has an important interpretation. With probability 0.85, a traveler follows an actual flight route. With probability 0.15, the traveler randomly jumps to any airport in the network. This prevents the Markov chain from getting stuck and helps ensure convergence.

At convergence, the PageRank vector satisfies:

\[
Gv = v
\]

where \(G\) is the Google Matrix. Therefore, the final PageRank vector is the principal eigenvector associated with eigenvalue 1.

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
