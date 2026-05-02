const pptxgen = require("pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Airport PageRank Project Team";
pptx.subject = "Applied Linear Algebra project presentation";
pptx.title = "Using PageRank to Identify Important Airports";
pptx.company = "University of Wisconsin";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Trebuchet MS",
  bodyFontFace: "Calibri",
  lang: "en-US",
};
pptx.defineLayout({ name: "CUSTOM_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "CUSTOM_WIDE";
pptx.slideWidth = 13.333;
pptx.slideHeight = 7.5;

const C = {
  bg: "F7F6F2",
  surface: "FBFBF9",
  surfaceAlt: "F0EEE8",
  text: "28251D",
  muted: "7A7974",
  faint: "BAB9B4",
  primary: "01696F",
  primary2: "20808D",
  dark: "171614",
  dark2: "1F2526",
  white: "FFFFFF",
  red: "A13544",
  gold: "D19900",
  border: "D4D1CA",
};

const ROOT = __dirname;
const FIG_TOP = path.join(ROOT, "figures", "top-airports-pagerank.png");
const FIG_ATL = path.join(ROOT, "figures", "atl-removal-rank-changes.png");
const FIG_ATL_SLIDE = path.join(ROOT, "figures", "atl-removal-rank-changes-slide.png");
const FIG_SENSITIVITY = path.join(ROOT, "figures", "damping-factor-sensitivity.png");
const OPENFLIGHTS = "https://openflights.org/data";
const REPO = "https://github.com/JeewaanK/Airport_PageRank";

function addSlideNumber(slide, n, color = C.muted) {
  slide.addText(String(n).padStart(2, "0"), {
    x: 12.35, y: 7.05, w: 0.45, h: 0.2,
    fontFace: "Calibri", fontSize: 9, color, align: "right", margin: 0,
  });
}

function addSource(slide, y = 7.02, color = "5A5952") {
  slide.addText(
    [
      { text: "Source: ", options: {} },
      { text: "OpenFlights", options: { hyperlink: { url: OPENFLIGHTS } } },
      { text: "; ", options: {} },
      { text: "project notebook", options: { hyperlink: { url: REPO } } },
    ],
    { x: 0.55, y, w: 5.3, h: 0.24, fontFace: "Calibri", fontSize: 9, color, margin: 0 }
  );
}

function title(slide, text, subtitle) {
  slide.background = { color: C.bg };
  slide.addText(text, {
    x: 0.55, y: 0.35, w: 8.6, h: 0.45,
    fontFace: "Trebuchet MS", fontSize: 24, bold: true, color: C.text, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55, y: 0.86, w: 10.6, h: 0.25,
      fontFace: "Calibri", fontSize: 10.5, color: C.muted, margin: 0,
    });
  }
}

function addPill(slide, text, x, y, w, fill = C.surfaceAlt, color = C.text) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.36,
    rectRadius: 0.07,
    fill: { color: fill },
    line: { color: "FFFFFF", transparency: 100 },
  });
  slide.addText(text, {
    x: x + 0.12, y: y + 0.08, w: w - 0.24, h: 0.18,
    fontFace: "Calibri", fontSize: 9.5, bold: true, color, margin: 0, align: "center",
  });
}

function card(slide, x, y, w, h, heading, body, accent = false) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: accent ? "E9F3F3" : C.surface },
    line: { color: C.border, transparency: 10 },
  });
  slide.addText(heading, {
    x: x + 0.22, y: y + 0.18, w: w - 0.44, h: 0.25,
    fontFace: "Trebuchet MS", fontSize: 14, bold: true, color: accent ? C.primary : C.text, margin: 0,
  });
  slide.addText(body, {
    x: x + 0.22, y: y + 0.55, w: w - 0.44, h: h - 0.75,
    fontFace: "Calibri", fontSize: 12.5, color: C.text, breakLine: false,
    fit: "shrink", margin: 0.02, valign: "top",
  });
}

function bulletList(slide, items, x, y, w, h, fontSize = 15, color = C.text) {
  const runs = [];
  items.forEach((item, idx) => {
    runs.push({ text: item, options: { bullet: { type: "bullet" }, breakLine: idx < items.length - 1 } });
  });
  slide.addText(runs, {
    x, y, w, h, fontFace: "Calibri", fontSize, color, margin: 0.05,
    breakLine: false, fit: "shrink", paraSpaceAfterPt: 7,
  });
}

function stat(slide, value, label, x, y, w, color = C.primary) {
  slide.addText(value, {
    x, y, w, h: 0.62, fontFace: "Trebuchet MS", fontSize: 30, bold: true,
    color, margin: 0, align: "center",
  });
  slide.addText(label, {
    x, y: y + 0.66, w, h: 0.3, fontFace: "Calibri", fontSize: 10.5,
    color: C.muted, margin: 0, align: "center",
  });
}

// Slide 1
{
  const slide = pptx.addSlide();
  slide.background = { color: C.dark };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.dark }, line: { color: C.dark } });
  slide.addShape(pptx.ShapeType.rect, { x: 8.65, y: 0, w: 4.68, h: 7.5, fill: { color: C.dark2 }, line: { color: C.dark2 } });
  slide.addText("Using PageRank to Identify Critical Airports", {
    x: 0.7, y: 1.05, w: 7.5, h: 1.5,
    fontFace: "Trebuchet MS", fontSize: 35, bold: true, color: C.white, margin: 0, fit: "shrink",
  });
  slide.addText("Applied Linear Algebra course project", {
    x: 0.72, y: 2.72, w: 6.7, h: 0.36, fontFace: "Calibri", fontSize: 16, color: "CDCCCA", margin: 0,
  });
  slide.addText("Airport route network • PageRank • Hub disruption", {
    x: 0.72, y: 3.15, w: 6.8, h: 0.3, fontFace: "Calibri", fontSize: 13, color: "A9C8CC", margin: 0,
  });
  ["549 airports", "5,450 directed routes", "ATL closure scenario"].forEach((t, i) =>
    addPill(slide, t, 0.72 + i * 2.1, 4.1, 1.85, i === 2 ? C.primary : "2C3839", C.white)
  );
  slide.addText("Team: Mindeok Seo, Jake Gust, Jeewan Khadka, Yijia Zhang, Alan Tang", {
    x: 0.72, y: 6.72, w: 7.9, h: 0.26, fontFace: "Calibri", fontSize: 10.5, color: "CDCCCA", margin: 0,
  });
  slide.addText("PageRank converts a route map into a ranking of structural importance.", {
    x: 9.1, y: 1.55, w: 3.4, h: 1.65, fontFace: "Trebuchet MS", fontSize: 22, bold: true,
    color: C.white, margin: 0.02, fit: "shrink",
  });
  slide.addText("Instead of only counting routes, it asks whether an airport is connected to other important airports.", {
    x: 9.1, y: 3.55, w: 3.35, h: 1.05, fontFace: "Calibri", fontSize: 15, color: "CDCCCA", margin: 0.02,
    fit: "shrink",
  });
  addSource(slide, 6.35, "CDCCCA");
  addSlideNumber(slide, 1, "CDCCCA");
}

// Slide 2
{
  const slide = pptx.addSlide();
  title(slide, "Research Question", "Why PageRank is useful for transportation networks");
  slide.addText("Which airports are most important when importance is measured by network structure, not just direct route count?", {
    x: 0.75, y: 1.35, w: 11.2, h: 0.85,
    fontFace: "Trebuchet MS", fontSize: 25, bold: true, color: C.text, margin: 0.02, fit: "shrink",
  });
  card(slide, 0.75, 2.6, 3.7, 1.65, "Traditional view", "Rank airports by number of direct routes. This measures connectivity but treats all connected airports equally.");
  card(slide, 4.85, 2.6, 3.7, 1.65, "PageRank view", "Rank airports by recursive importance. Connections from important airports count more than isolated connections.", true);
  card(slide, 8.95, 2.6, 3.7, 1.65, "Project extension", "Remove a major hub and recompute PageRank to see how importance redistributes across the network.");
  slide.addText("Core idea: an airport is central if it receives connections from airports that are themselves central.", {
    x: 1.05, y: 5.25, w: 11.0, h: 0.5, fontFace: "Calibri", fontSize: 18, bold: true, color: C.primary, align: "center", margin: 0,
  });
  addSource(slide);
  addSlideNumber(slide, 2);
}

// Slide 3
{
  const slide = pptx.addSlide();
  title(slide, "Data and Network Setup", "OpenFlights route data filtered to direct routes between U.S. airports");
  stat(slide, "549", "airports in network", 0.75, 1.35, 2.2);
  stat(slide, "5,450", "directed route edges", 3.35, 1.35, 2.2);
  stat(slide, "549×549", "adjacency matrix", 5.95, 1.35, 2.2);
  stat(slide, "7", "dangling airports", 8.55, 1.35, 2.2);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 10.95, y: 1.15, w: 1.75, h: 1.25, rectRadius: 0.08,
    fill: { color: "E9F3F3" }, line: { color: C.border },
  });
  slide.addText("Binary model", { x: 11.1, y: 1.36, w: 1.45, h: 0.24, fontFace: "Trebuchet MS", fontSize: 12, bold: true, color: C.primary, margin: 0, align: "center" });
  slide.addText("Route = 1\nNo route = 0", { x: 11.1, y: 1.72, w: 1.45, h: 0.42, fontFace: "Calibri", fontSize: 11, color: C.text, margin: 0, align: "center" });
  card(slide, 0.8, 3.0, 5.55, 1.75, "Filtering decisions", "Only U.S. airports with valid IATA codes are included. Routes are kept only when both source and destination are U.S. airports, and the route has zero stops.");
  card(slide, 6.85, 3.0, 5.55, 1.75, "Interpretation", "Because the matrix is binary, the model measures route connectivity rather than passenger volume, aircraft capacity, or flight frequency.", true);
  addSource(slide);
  addSlideNumber(slide, 3);
}

// Slide 4
{
  const slide = pptx.addSlide();
  title(slide, "From Routes to Matrices", "The network becomes a linear algebra problem");
  const y = 1.55;
  const boxes = [
    ["1", "Directed graph", "Airports are nodes;\nroutes are directed edges."],
    ["2", "Adjacency matrix", "A[i,j] = 1 if route\nj → i exists."],
    ["3", "Transition matrix", "Normalize columns so\nsum_i M[i,j] = 1."],
    ["4", "PageRank vector", "Power iteration finds\nthe steady-state vector."],
  ];
  boxes.forEach((b, i) => {
    const x = 0.65 + i * 3.12;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.5, h: 2.45, rectRadius: 0.09, fill: { color: i === 3 ? "E9F3F3" : C.surface }, line: { color: C.border } });
    slide.addText(b[0], { x: x + 0.18, y: y + 0.18, w: 0.38, h: 0.36, fontFace: "Trebuchet MS", fontSize: 15, bold: true, color: C.primary, margin: 0, align: "center" });
    slide.addText(b[1], { x: x + 0.22, y: y + 0.76, w: 2.05, h: 0.36, fontFace: "Trebuchet MS", fontSize: 15, bold: true, color: C.text, margin: 0 });
    slide.addText(b[2], { x: x + 0.22, y: y + 1.32, w: 2.05, h: 1.0, fontFace: "Calibri", fontSize: 13.5, color: C.text, margin: 0.02, fit: "shrink" });
    if (i < 3) slide.addText("→", { x: x + 2.62, y: y + 1.05, w: 0.32, h: 0.35, fontFace: "Trebuchet MS", fontSize: 20, color: C.primary, margin: 0, align: "center" });
  });
  slide.addText("At convergence: Gv = v", { x: 1.55, y: 4.95, w: 3.2, h: 0.4, fontFace: "Trebuchet MS", fontSize: 20, bold: true, color: C.primary, margin: 0 });
  slide.addText("The final vector is the principal eigenvector of the Google Matrix.", { x: 4.85, y: 5.02, w: 6.3, h: 0.32, fontFace: "Calibri", fontSize: 15, color: C.text, margin: 0 });
  addSource(slide);
  addSlideNumber(slide, 4);
}

// Slide 5
{
  const slide = pptx.addSlide();
  title(slide, "PageRank Method", "Power iteration with damping");
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 1.35, w: 5.35, h: 3.95, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.border } });
  slide.addText("Update equation", { x: 1.18, y: 1.72, w: 2.5, h: 0.3, fontFace: "Trebuchet MS", fontSize: 17, bold: true, color: C.text, margin: 0 });
  slide.addText("vₖ₊₁ = dMvₖ + ((1 − d) / N)e", { x: 1.18, y: 2.22, w: 4.65, h: 0.42, fontFace: "Consolas", fontSize: 16, bold: true, color: C.primary, margin: 0 });
  bulletList(slide, ["d = 0.85 damping factor", "85% follows actual routes", "15% randomly jumps to any airport", "Stop when L1 change is below tolerance"], 1.18, 2.95, 4.55, 1.75, 13.5);
  slide.addShape(pptx.ShapeType.roundRect, { x: 6.75, y: 1.35, w: 5.75, h: 3.95, rectRadius: 0.08, fill: { color: "E9F3F3" }, line: { color: C.border } });
  slide.addText("Why damping matters", { x: 7.08, y: 1.72, w: 3.2, h: 0.3, fontFace: "Trebuchet MS", fontSize: 17, bold: true, color: C.primary, margin: 0 });
  bulletList(slide, ["Prevents dead ends from trapping the model", "Makes the Markov chain more stable", "Ensures the vector converges", "Allows every airport to retain some probability"], 7.08, 2.24, 4.8, 1.95, 13.5);
  slide.addText("Result: one PageRank score for every airport.", { x: 7.08, y: 4.65, w: 4.8, h: 0.28, fontFace: "Calibri", fontSize: 15, bold: true, color: C.primary, margin: 0 });
  addSource(slide);
  addSlideNumber(slide, 5);
}

// Slide 6
{
  const slide = pptx.addSlide();
  title(slide, "Baseline Results", "DEN ranks first in the binary route network");
  slide.addImage({ path: FIG_TOP, x: 0.75, y: 1.3, w: 7.05, h: 4.21 });
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.25, y: 1.22, w: 4.15, h: 4.7, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.border } });
  slide.addText("Top PageRank airports", { x: 8.45, y: 1.62, w: 3.6, h: 0.28, fontFace: "Trebuchet MS", fontSize: 16, bold: true, color: C.text, margin: 0 });
  bulletList(slide, ["DEN has the highest PageRank score.", "ATL has the highest total degree, but ranks second.", "ORD and DFW follow closely.", "PageRank is similar to degree centrality but not identical."], 8.45, 2.05, 3.45, 1.85, 13.2);
  slide.addText("Interpretation", { x: 8.45, y: 4.35, w: 2.2, h: 0.25, fontFace: "Trebuchet MS", fontSize: 14, bold: true, color: C.primary, margin: 0 });
  slide.addText("DEN's centrality reflects strong connections across important parts of the U.S. route network.", { x: 8.45, y: 4.72, w: 3.45, h: 0.55, fontFace: "Calibri", fontSize: 12.8, color: C.text, margin: 0, fit: "shrink" });
  addSource(slide);
  addSlideNumber(slide, 6);
}

// Slide 7: Damping factor sensitivity analysis
{
  const slide = pptx.addSlide();
  title(slide, "Damping Factor Sensitivity", "Are the top hubs stable across choices of d?");
  slide.addImage({ path: FIG_SENSITIVITY, x: 0.6, y: 1.3, w: 7.4, h: 4.44 });
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.45, y: 1.22, w: 4.3, h: 4.7, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.border } });
  slide.addText("Setup", { x: 8.65, y: 1.55, w: 3.7, h: 0.28, fontFace: "Trebuchet MS", fontSize: 16, bold: true, color: C.text, margin: 0 });
  bulletList(slide, ["Recompute PageRank at d = 0.65, 0.75, 0.85, 0.95.", "Same transition matrix, same tolerance.", "Compare top hubs and full ranking."], 8.65, 1.92, 3.95, 1.4, 12.6);
  slide.addText("Findings", { x: 8.65, y: 3.45, w: 2.5, h: 0.26, fontFace: "Trebuchet MS", fontSize: 14, bold: true, color: C.primary, margin: 0 });
  bulletList(slide, ["DEN, ATL, ORD, DFW stay top 4 for every d.", "Spearman ρ ≥ 0.988 vs baseline.", "Top-10 set overlaps 9 of 10 in every case.", "Iterations rise: 43 → 64 → 112 → 353."], 8.65, 3.82, 3.95, 1.85, 12.6);
  slide.addText("Top hubs are driven by network structure, not by d = 0.85.", {
    x: 0.75, y: 6.05, w: 11.85, h: 0.32, fontFace: "Calibri", fontSize: 15.5, bold: true, color: C.primary, align: "center", margin: 0,
  });
  addSource(slide);
  addSlideNumber(slide, 7);
}

// Slide 8
{
  const slide = pptx.addSlide();
  title(slide, "Hub Closure Experiment", "What happens when ATL is removed?");
  slide.addText("Simulation: remove all incoming and outgoing ATL routes, rebuild the matrices, and recompute PageRank.", {
    x: 0.75, y: 1.32, w: 10.7, h: 0.38, fontFace: "Calibri", fontSize: 15, color: C.text, margin: 0,
  });
  stat(slide, "ATL", "removed hub", 0.95, 2.05, 2.1, C.red);
  stat(slide, "5,145", "remaining directed routes", 3.35, 2.05, 2.45);
  stat(slide, "112", "post-closure iterations", 6.08, 2.05, 2.25);
  stat(slide, "DEN", "still ranked #1", 8.65, 2.05, 2.1);
  slide.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 3.75, w: 11.3, h: 1.45, rectRadius: 0.08, fill: { color: "E9F3F3" }, line: { color: C.border } });
  slide.addText("Main finding", { x: 1.35, y: 4.05, w: 2.1, h: 0.25, fontFace: "Trebuchet MS", fontSize: 15, bold: true, color: C.primary, margin: 0 });
  slide.addText("The network does not collapse. Importance redistributes toward other major hubs, especially DEN, ORD, DFW, MSP, DTW, CLT, and IAH.", {
    x: 3.15, y: 4.02, w: 8.45, h: 0.58, fontFace: "Calibri", fontSize: 16, color: C.text, margin: 0, fit: "shrink",
  });
  addSource(slide);
  addSlideNumber(slide, 8);
}

// Slide 9
{
  const slide = pptx.addSlide();
  title(slide, "Rank Changes After Removing ATL", "Largest movements in the disrupted network");
  slide.addImage({ path: FIG_ATL_SLIDE, x: 0.75, y: 1.35, w: 7.25, h: 4.11 });
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.4, y: 1.25, w: 3.95, h: 4.4, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.border } });
  slide.addText("How to read this", { x: 8.75, y: 1.65, w: 2.9, h: 0.28, fontFace: "Trebuchet MS", fontSize: 16, bold: true, color: C.text, margin: 0 });
  bulletList(slide, ["Positive rank change means the airport moved up.", "Negative rank change means it moved down.", "Small airports can jump many ranks because bottom scores are very close."], 8.75, 2.1, 3.1, 1.75, 12.6);
  slide.addText("Key message", { x: 8.75, y: 4.35, w: 2, h: 0.24, fontFace: "Trebuchet MS", fontSize: 13.5, bold: true, color: C.primary, margin: 0 });
  slide.addText("For hub-level interpretation, PageRank score change matters more than rank alone.", { x: 8.75, y: 4.68, w: 3.15, h: 0.45, fontFace: "Calibri", fontSize: 12, color: C.text, margin: 0, fit: "shrink" });
  addSource(slide);
  addSlideNumber(slide, 9);
}

// Slide 10
{
  const slide = pptx.addSlide();
  title(slide, "What We Learned", "Centrality and resilience in one model");
  card(slide, 0.55, 1.45, 3.05, 2.85, "1. Centrality is recursive", "An airport is important when it is connected to other important airports, not only when it has many direct routes.", true);
  card(slide, 3.75, 1.45, 3.05, 2.85, "2. Robust to damping", "Top hubs stay the same for d = 0.65 through 0.95. The ranking reflects network structure, not the choice of d.");
  card(slide, 6.95, 1.45, 3.05, 2.85, "3. The network is resilient", "Removing ATL changes rankings, but other hubs absorb importance. The national structure stays connected through multiple hubs.");
  card(slide, 10.15, 1.45, 3.05, 2.85, "4. Local vulnerability remains", "Some regional airports lose importance when ATL is removed, showing that local dependence can be high even if the full network is resilient.");
  slide.addText("PageRank gives a linear algebra-based way to quantify both structural importance and disruption response.", {
    x: 1.0, y: 5.25, w: 11.3, h: 0.42, fontFace: "Calibri", fontSize: 18, bold: true, color: C.primary, align: "center", margin: 0,
  });
  addSource(slide);
  addSlideNumber(slide, 10);
}

// Slide 11
{
  const slide = pptx.addSlide();
  title(slide, "Limitations and Extensions", "How the project could be strengthened");
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.35, w: 5.65, h: 3.75, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.border } });
  slide.addText("Limitations", { x: 1.15, y: 1.7, w: 2.1, h: 0.28, fontFace: "Trebuchet MS", fontSize: 17, bold: true, color: C.text, margin: 0 });
  bulletList(slide, ["OpenFlights route data is historical.", "Binary matrix does not measure passenger volume.", "All outgoing routes are treated as equally likely.", "The ATL scenario is a complete closure, not a partial disruption."], 1.15, 2.15, 4.65, 2.2, 13.5);
  slide.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 1.35, w: 5.65, h: 3.75, rectRadius: 0.08, fill: { color: "E9F3F3" }, line: { color: C.border } });
  slide.addText("Extensions", { x: 7.25, y: 1.7, w: 2.1, h: 0.28, fontFace: "Trebuchet MS", fontSize: 17, bold: true, color: C.primary, margin: 0 });
  bulletList(slide, ["Use BTS T-100 data to weight edges by passengers or flight counts.", "Compare PageRank with degree, betweenness, and eigenvector centrality.", "Simulate multiple hub closures.", "Map centrality shifts geographically."], 7.25, 2.15, 4.65, 2.2, 13.5);
  addSource(slide);
  addSlideNumber(slide, 11);
}

// Slide 12
{
  const slide = pptx.addSlide();
  slide.background = { color: C.dark };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.dark }, line: { color: C.dark } });
  slide.addText("Conclusion", { x: 0.85, y: 0.85, w: 3.8, h: 0.5, fontFace: "Trebuchet MS", fontSize: 30, bold: true, color: C.white, margin: 0 });
  slide.addText("Airport importance is not just route count. It depends on where an airport sits inside the network of important connections.", {
    x: 0.85, y: 1.85, w: 8.1, h: 1.15, fontFace: "Trebuchet MS", fontSize: 27, bold: true, color: C.white, margin: 0, fit: "shrink",
  });
  slide.addText("PageRank turns that idea into a matrix problem: construct the transition matrix, apply damping, iterate, and interpret the principal eigenvector.", {
    x: 0.85, y: 3.35, w: 7.75, h: 0.62, fontFace: "Calibri", fontSize: 16.5, color: "CDCCCA", margin: 0, fit: "shrink",
  });
  slide.addShape(pptx.ShapeType.roundRect, { x: 9.25, y: 0.9, w: 3.05, h: 4.5, rectRadius: 0.08, fill: { color: "243334" }, line: { color: "243334" } });
  slide.addText("Final takeaway", { x: 9.62, y: 1.35, w: 2.25, h: 0.28, fontFace: "Trebuchet MS", fontSize: 15, bold: true, color: C.white, margin: 0 });
  slide.addText("DEN, ATL, ORD, and DFW are structurally central. Removing ATL shifts importance to other hubs, showing both centrality and resilience.", {
    x: 9.62, y: 1.98, w: 2.25, h: 2.4, fontFace: "Calibri", fontSize: 15.5, color: C.white, margin: 0.02, fit: "shrink",
  });
  slide.addText("Team: Mindeok Seo, Jake Gust, Jeewan Khadka, Yijia Zhang, Alan Tang", { x: 0.85, y: 5.45, w: 7.4, h: 0.25, fontFace: "Calibri", fontSize: 11.5, color: "CDCCCA", margin: 0 });
  slide.addText("Repo: github.com/JeewaanK/Airport_PageRank", { x: 0.85, y: 6.35, w: 5.2, h: 0.25, fontFace: "Calibri", fontSize: 10.5, color: "CDCCCA", margin: 0 });
  addSlideNumber(slide, 12, "CDCCCA");
}

pptx.writeFile({ fileName: path.join(ROOT, "Airport_PageRank_Presentation.pptx") });
