/* ============================================================
   Charts — Plotly wrappers with a low-chartjunk academic theme
   Exposes: Chart, LineChart, BarChart, Treemap, Choropleth,
            Donut, Heatmap, RadarChart, MultiLine
   ============================================================ */

const INK = "#e9e7e1", INK_SOFT = "#aeb0b3", INK_FAINT = "#7c7f84";
const RULE = "#282d34", RULE_STRONG = "#3a4049";
const SLATE = "#84a6cf", OXBLOOD = "#d4807f";
const PALETTE = ["#84a6cf", "#d4807f", "#d6b061", "#84b389", "#b095c8", "#6fb3af", "#c79a6a", "#9fb4d0"];
const PANEL = "#181b20", PAGEBG = "#111317";
const FONT_SANS = '"IBM Plex Sans", system-ui, sans-serif';
const FONT_MONO = '"IBM Plex Mono", monospace';

function baseLayout(extra) {
  const L = {
    font: { family: FONT_SANS, size: 13, color: INK_SOFT },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 52, r: 18, t: 14, b: 40 },
    hoverlabel: {
      bgcolor: "#20242b",
      bordercolor: RULE_STRONG,
      font: { family: FONT_MONO, size: 12, color: INK }
    },
    xaxis: {
      gridcolor: RULE, zerolinecolor: RULE_STRONG, linecolor: RULE_STRONG,
      tickfont: { family: FONT_MONO, size: 11, color: INK_FAINT },
      automargin: true
    },
    yaxis: {
      gridcolor: RULE, zerolinecolor: RULE_STRONG, linecolor: "rgba(0,0,0,0)",
      tickfont: { family: FONT_MONO, size: 11, color: INK_FAINT },
      automargin: true
    },
    colorway: PALETTE,
    showlegend: false
  };
  return Object.assign(L, extra || {});
}
const CONFIG = { displayModeBar: false, responsive: true };

function Chart({ data, layout, config, height = 320, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !window.Plotly) return;
    window.Plotly.react(ref.current, data, layout, Object.assign({}, CONFIG, config));
  }, [data, layout, config]);
  React.useEffect(() => () => { if (ref.current && window.Plotly) window.Plotly.purge(ref.current); }, []);
  return <div className="chart-host" ref={ref} style={Object.assign({ height }, style)} />;
}

/* ---- Line (single series) ---- */
function LineChart({ x, y, color = SLATE, height, fill = true, name = "Incidents" }) {
  const data = [{
    x, y, type: "scatter", mode: "lines+markers", name,
    line: { color, width: 2.2, shape: "spline", smoothing: 0.6 },
    marker: { color, size: 5 },
    fill: fill ? "tozeroy" : "none",
    fillcolor: fill ? hexA(color, 0.08) : undefined,
    hovertemplate: "%{x}: <b>%{y}</b><extra></extra>"
  }];
  return <Chart data={data} layout={baseLayout()} height={height} />;
}

/* ---- Multi-line ---- */
function MultiLine({ x, series, height, legend = true }) {
  const data = series.map((s, i) => ({
    x, y: s.values, type: "scatter", mode: "lines",
    name: s.group || s.name,
    line: { color: PALETTE[i % PALETTE.length], width: 2.2, shape: "spline", smoothing: .5 },
    hovertemplate: "%{fullData.name} · %{x}: <b>%{y}</b><extra></extra>"
  }));
  return <Chart data={data} height={height} layout={baseLayout({
    showlegend: legend,
    legend: { orientation: "h", y: -0.18, font: { family: FONT_MONO, size: 11, color: INK_SOFT } },
    margin: { l: 48, r: 14, t: 10, b: legend ? 56 : 40 }
  })} />;
}

/* ---- Horizontal bar ---- */
function BarChart({ labels, values, color = SLATE, height, horizontal = true, colorEach }) {
  const colors = colorEach ? labels.map((_, i) => PALETTE[i % PALETTE.length]) : color;
  const data = [{
    type: "bar",
    orientation: horizontal ? "h" : "v",
    x: horizontal ? values : labels,
    y: horizontal ? labels.slice().reverse() : values,
    marker: { color: horizontal && Array.isArray(colors) ? colors.slice().reverse() : colors },
    hovertemplate: (horizontal ? "%{y}" : "%{x}") + ": <b>%{x}</b><extra></extra>"
  }];
  if (horizontal) { data[0].x = values.slice().reverse(); data[0].y = labels.slice().reverse(); data[0].hovertemplate = "%{y}: <b>%{x}</b><extra></extra>"; }
  return <Chart data={data} height={height} layout={baseLayout({
    margin: horizontal ? { l: 8, r: 24, t: 8, b: 8 } : { l: 48, r: 12, t: 8, b: 60 },
    yaxis: horizontal
      ? { automargin: true, tickfont: { family: FONT_SANS, size: 13, color: INK }, gridcolor: "rgba(0,0,0,0)", ticks: "outside", ticklen: 12, tickcolor: "rgba(0,0,0,0)" }
      : { gridcolor: RULE, tickfont: { family: FONT_MONO, size: 11, color: INK_FAINT } },
    xaxis: horizontal
      ? { showgrid: false, showticklabels: false, zeroline: false, showline: false }
      : { tickangle: -35, tickfont: { family: FONT_SANS, size: 11, color: INK } },
    bargap: 0.34
  })} />;
}

/* ---- Treemap ---- */
function Treemap({ labels, values, height }) {
  const data = [{
    type: "treemap",
    labels, parents: labels.map(() => ""),
    values, textinfo: "label+value",
    marker: { colors: labels.map((_, i) => PALETTE[i % PALETTE.length]), line: { width: 2, color: PAGEBG } },
    textfont: { family: FONT_SANS, size: 13, color: "#11131a" },
    hovertemplate: "%{label}<br><b>%{value}</b> incidents<extra></extra>",
    tiling: { pad: 2 }
  }];
  return <Chart data={data} height={height} layout={baseLayout({ margin: { l: 0, r: 0, t: 0, b: 0 } })} />;
}

/* ---- Choropleth ---- */
function Choropleth({ locations, z, height }) {
  const data = [{
    type: "choropleth",
    locationmode: "country names",
    locations, z,
    colorscale: [[0, "#1d2229"], [0.15, "#2c3a4d"], [0.45, "#46617f"], [0.75, "#6486ad"], [1, SLATE]],
    marker: { line: { color: PAGEBG, width: 0.6 } },
    colorbar: {
      thickness: 10, len: 0.7, x: 1, tickfont: { family: FONT_MONO, size: 10, color: INK_FAINT },
      outlinewidth: 0, title: { text: "incidents", font: { family: FONT_MONO, size: 10, color: INK_FAINT }, side: "right" }
    },
    hovertemplate: "%{location}: <b>%{z}</b><extra></extra>"
  }];
  return <Chart data={data} height={height} layout={baseLayout({
    margin: { l: 0, r: 0, t: 0, b: 0 },
    geo: {
      bgcolor: "rgba(0,0,0,0)", showframe: false, showcoastlines: false,
      showland: true, landcolor: "#1c2026", showcountries: true, countrycolor: "#2a2f37",
      projection: { type: "natural earth" }
    }
  })} />;
}

/* ---- Donut ---- */
function Donut({ labels, values, height }) {
  const data = [{
    type: "pie", hole: 0.62, labels, values,
    marker: { colors: labels.map((_, i) => PALETTE[i % PALETTE.length]), line: { color: PANEL, width: 2 } },
    textfont: { family: FONT_MONO, size: 11, color: "#11131a" },
    textposition: "inside", textinfo: "percent",
    hovertemplate: "%{label}: <b>%{value}</b> (%{percent})<extra></extra>"
  }];
  return <Chart data={data} height={height} layout={baseLayout({
    margin: { l: 8, r: 8, t: 8, b: 8 }, showlegend: true,
    legend: { orientation: "v", x: 1, y: 0.5, font: { family: FONT_SANS, size: 12, color: INK_SOFT } }
  })} />;
}

/* ---- Heatmap ---- */
function Heatmap({ x, y, z, height }) {
  const data = [{
    type: "heatmap", x, y, z,
    colorscale: [[0, "#191d23"], [0.4, "#5e3f44"], [0.7, "#a05f60"], [1, OXBLOOD]],
    xgap: 3, ygap: 3,
    colorbar: { thickness: 10, len: 0.8, tickfont: { family: FONT_MONO, size: 10, color: INK_FAINT }, outlinewidth: 0 },
    hovertemplate: "%{y} · %{x}<br><b>%{z}</b> incidents<extra></extra>"
  }];
  return <Chart data={data} height={height} layout={baseLayout({
    margin: { l: 8, r: 8, t: 8, b: 90 },
    xaxis: { tickangle: -35, tickfont: { family: FONT_SANS, size: 11, color: INK }, gridcolor: "rgba(0,0,0,0)", automargin: true },
    yaxis: { tickfont: { family: FONT_SANS, size: 12, color: INK }, gridcolor: "rgba(0,0,0,0)", automargin: true }
  })} />;
}

/* ---- Radar ---- */
function RadarChart({ axes, series, height }) {
  const data = series.map((s, i) => ({
    type: "scatterpolar", r: s.values.concat([s.values[0]]), theta: axes.concat([axes[0]]),
    name: s.name, fill: "toself",
    fillcolor: hexA(PALETTE[i % PALETTE.length], 0.14),
    line: { color: PALETTE[i % PALETTE.length], width: 2 },
    hovertemplate: "%{theta}: <b>%{r}</b><extra>" + s.name + "</extra>"
  }));
  return <Chart data={data} height={height} layout={baseLayout({
    margin: { l: 60, r: 60, t: 30, b: 50 }, showlegend: true,
    legend: { orientation: "h", y: -0.08, font: { family: FONT_MONO, size: 11, color: INK_SOFT } },
    polar: {
      bgcolor: "rgba(0,0,0,0)",
      radialaxis: { gridcolor: RULE, tickfont: { family: FONT_MONO, size: 9, color: INK_FAINT }, angle: 90 },
      angularaxis: { gridcolor: RULE, tickfont: { family: FONT_SANS, size: 11, color: INK } }
    }
  })} />;
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

Object.assign(window, {
  Chart, LineChart, MultiLine, BarChart, Treemap, Choropleth, Donut, Heatmap, RadarChart,
  PALETTE, SLATE, OXBLOOD
});
