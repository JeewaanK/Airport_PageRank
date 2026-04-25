# Airport PageRank Project

## Project title

Using the PageRank Algorithm to Identify Critical Airports in the U.S. Flight Network

## Project goal

This project uses the PageRank algorithm to rank airports by their structural importance in a directed flight-route network. Instead of measuring importance only by the number of direct routes, PageRank assigns a higher score to airports that receive routes from other important airports.

The project also studies network resilience by simulating the closure of a major hub airport and recomputing PageRank to see how airport rankings change.

## Dataset

This starter version uses the OpenFlights airport and route datasets:

- `data/airports.dat`: airport metadata, including IATA code, city, country, latitude, and longitude
- `data/routes.dat`: directional flight routes between airports

The script filters the data to U.S. airports and direct routes only.

Important limitation: OpenFlights route data is historical, so the results should be interpreted as a demonstration of the algorithm rather than a current operational ranking of U.S. airports. A stronger final version could use BTS T-100 data and weight edges by passenger volume or flight frequency.

## Mathematical model

### 1. Directed graph

Each airport is represented as a node.

Each direct route is represented as a directed edge:

```text
source airport -> destination airport
```

### 2. Adjacency matrix

Let \(A\) be an \(N \times N\) adjacency matrix, where \(N\) is the number of airports.

The project uses the PageRank convention:

```text
A[i, j] = route strength from airport j to airport i
```

So columns represent the airport being departed from, and rows represent the airport being arrived at.

For the unweighted version:

\[
A_{ij} =
\begin{cases}
1, & \text{if there is a route from airport } j \text{ to airport } i \\
0, & \text{otherwise}
\end{cases}
\]

For the weighted version, \(A_{ij}\) equals the number of airline-level routes from airport \(j\) to airport \(i\).

### 3. Transition matrix

The adjacency matrix is normalized by column to create a transition matrix \(M\):

\[
M_{ij} = \frac{A_{ij}}{\sum_i A_{ij}}
\]

Each column of \(M\) sums to 1. Therefore, \(M_{ij}\) can be interpreted as the probability of moving from airport \(j\) to airport \(i\).

If an airport has no outgoing routes, the corresponding column is replaced with a uniform probability vector:

\[
M_{ij} = \frac{1}{N}
\]

This handles dangling nodes.

### 4. Google Matrix

The Google Matrix is:

\[
G = dM + (1-d)\frac{1}{N}ee^T
\]

where:

- \(d = 0.85\) is the damping factor
- \(e\) is a vector of ones
- \(N\) is the number of airports

The interpretation is:

- With probability \(d\), a traveler follows an actual route.
- With probability \(1-d\), a traveler randomly jumps to any airport.

This prevents the Markov chain from getting stuck and ensures convergence.

### 5. Power iteration

Start with equal probability at each airport:

\[
v_0 =
\begin{bmatrix}
1/N \\
1/N \\
\vdots \\
1/N
\end{bmatrix}
\]

Then repeatedly compute:

\[
v_{k+1} = Gv_k
\]

The process stops when:

\[
\|v_{k+1} - v_k\|_1 < \epsilon
\]

The converged vector is the principal eigenvector of \(G\), and each entry gives the PageRank score of one airport.

## Current baseline result

Using the weighted OpenFlights U.S. route network:

- Airports in network: 549
- Directed route edges: 5,450
- Damping factor: 0.85
- Convergence tolerance: \(10^{-10}\)
- Baseline convergence: 112 iterations

Top baseline airports:

| Rank | Airport | City | PageRank |
|---:|---|---|---:|
| 1 | ATL | Atlanta | 0.048802 |
| 2 | DEN | Denver | 0.027141 |
| 3 | ORD | Chicago | 0.026722 |
| 4 | DFW | Dallas-Fort Worth | 0.024546 |
| 5 | LAX | Los Angeles | 0.021247 |
| 6 | CLT | Charlotte | 0.015888 |
| 7 | ANC | Anchorage | 0.015841 |
| 8 | PHX | Phoenix | 0.014946 |
| 9 | MSP | Minneapolis | 0.014548 |
| 10 | LAS | Las Vegas | 0.014324 |

## Hub-closure simulation

The starter simulation removes ATL by deleting all incoming and outgoing ATL routes. Then it recomputes PageRank.

After removing ATL:

- ORD becomes the highest-ranked airport.
- DEN, DFW, LAX, CLT, PHX, MSP, LAS, PHL, and SEA all move up by one rank because ATL is removed.
- Some smaller airports show large rank changes because their relative position in the remaining network changes significantly.

This section can be expanded by testing several hubs:

- ATL
- ORD
- DFW
- DEN
- LAX
- CLT

## How to run

From the project directory:

```bash
python -m pip install -r requirements.txt
python airport_pagerank.py
```

To remove a different hub:

```bash
HUB_TO_REMOVE=ORD python airport_pagerank.py
```

## Generated outputs

The script creates:

- `outputs/baseline_airport_pagerank.csv`
- `outputs/hub_closure_ATL_comparison.csv`
- `outputs/top_airports_pagerank.png`
- `outputs/hub_closure_ATL_rank_changes.png`
- `outputs/airport_network_sample.png`

## Suggested final presentation structure

1. Motivation: why airport network centrality matters
2. Dataset: airports as nodes and routes as directed edges
3. Linear algebra model: adjacency matrix, transition matrix, Google Matrix
4. Algorithm: power iteration and convergence
5. Baseline results: top airports by PageRank
6. Perturbation experiment: removing a major hub
7. Interpretation: which airports gain importance and what this says about resilience
8. Limitations and extensions: historical data, weighted passenger-volume version, multiple hub closures

## Extensions

Possible extensions include:

- Compare PageRank with simple route count centrality.
- Use passenger volume from BTS T-100 data as edge weights.
- Run hub-removal simulations for several airports.
- Measure the total change in PageRank distribution after each closure.
- Create a map visualization using latitude and longitude.
- Compare PageRank with eigenvector centrality, betweenness centrality, or degree centrality.
