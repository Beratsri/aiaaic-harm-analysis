/* ============================================================
   Pages B — Incident Browser, Who Gets Harmed, ML, Comparative
   ============================================================ */

/* ---------------- INCIDENT BROWSER ---------------- */
function BrowserPage() {
  const d = window.DATA;
  const ALL = "All";
  const [f, setF] = React.useState({ year: ALL, developer: ALL, technology: ALL, sector: ALL, country: ALL });
  const [q, setQ] = React.useState("");
  const [selId, setSelId] = React.useState(null);

  const set = (k) => (v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const years = [ALL].concat(d.years.slice().reverse().map(String));
  const opt = (arr) => [ALL].concat(arr);

  const rows = d.incidents.filter((r) => {
    if (f.year !== ALL && String(r.year) !== f.year) return false;
    if (f.developer !== ALL && r.developer !== f.developer) return false;
    if (f.technology !== ALL && r.technology !== f.technology) return false;
    if (f.sector !== ALL && r.sector !== f.sector) return false;
    if (f.country !== ALL && r.country !== f.country) return false;
    if (q.trim()) {
      const s = (r.headline + " " + r.purpose + " " + r.technology + " " + r.developer).toLowerCase();
      if (s.indexOf(q.toLowerCase()) < 0) return false;
    }
    return true;
  });
  const sel = rows.find((r) => r.id === selId) || null;

  return (
    <div className="page fade-in">
      <PageHead eyebrow="Records · 03" title="Incident Browser"
        lede={`A searchable inspector over the catalogue. Combine filters, search the narrative text, then select any row to open its fully-provenanced record. Showing all ${fmt(d.kpi.totalIncidents)} incidents.`} />

      <div className="controls" style={{ marginBottom: 8, alignItems: "flex-end" }}>
        <Field label="Year"><Select value={f.year} onChange={set("year")} options={years} width={110} /></Field>
        <Field label="Developer"><Select value={f.developer} onChange={set("developer")} options={opt(d.developers.map((x) => x.name))} width={150} /></Field>
        <Field label="Technology"><Select value={f.technology} onChange={set("technology")} options={opt(d.technologies)} width={170} /></Field>
        <Field label="Sector"><Select value={f.sector} onChange={set("sector")} options={opt(d.sectors.map((x) => x.name))} width={170} /></Field>
        <Field label="Country"><Select value={f.country} onChange={set("country")} options={opt(d.countries.map((x) => x.name))} width={150} /></Field>
        <Field label="Keyword search"><SearchInput value={q} onChange={setQ} placeholder="headline, purpose, tech…" /></Field>
      </div>

      <Section title="Matching records" note={`${rows.length} record${rows.length === 1 ? "" : "s"} match the current filters. Click a row to inspect.`}>
        <Card>
          <div className="table-wrap" style={{ maxHeight: 420, overflowY: "auto" }}>
            <table className="data selectable">
              <thead><tr><th>ID</th><th>Year</th><th>Headline</th><th>Developer</th><th>Sector</th><th>Country</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={selId === r.id ? "sel" : ""} onClick={() => setSelId(r.id)}>
                    <td className="num">{r.id}</td>
                    <td className="num">{r.date}</td>
                    <td><span className="strong">{r.headline}</span></td>
                    <td>{r.developer}</td>
                    <td>{r.sector}</td>
                    <td>{r.country}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan="6"><div className="empty">No records match these filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section title="Incident inspector" note={sel ? "Provenance is shown per harm field." : "Select a row above to inspect."}>
        {sel ? <Inspector r={sel} /> : <Card pad><div className="empty">No incident selected.</div></Card>}
      </Section>
    </div>
  );
}

function Inspector({ r }) {
  return (
    <div className="card fade-in" key={r.id}>
      <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <div className="mono" style={{ color: "var(--ink-ghost)", fontSize: 12 }}>{r.id} · {r.date}</div>
          <h3 className="card-title" style={{ fontSize: 20, marginTop: 6, maxWidth: "40ch" }}>{r.headline}</h3>
        </div>
        <span className="badge"><span className="dot" style={{ background: "var(--slate)" }}></span>{r.country}</span>
      </div>
      <div className="card-body">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 4 }}>Record metadata</div>
            <div className="meta-grid">
              <MetaItem k="Developer">{r.developer}</MetaItem>
              <MetaItem k="Deployer">{r.deployer}</MetaItem>
              <MetaItem k="Technology">{r.technology}</MetaItem>
              <MetaItem k="Sector">{r.sector}</MetaItem>
              <MetaItem k="Purpose">{r.purpose}</MetaItem>
              <MetaItem k="Country">{r.country}</MetaItem>
              <MetaItem k="Consequence">{r.consequence}</MetaItem>
              <MetaItem k="Response">{r.response}</MetaItem>
            </div>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Individual harms</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {r.harmsIndividual.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>{h.label}</span>
                  <SourceBadge source={h.source} />
                </div>
              ))}
            </div>
            <div className="kicker" style={{ marginBottom: 10 }}>Societal harms</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {r.harmsSocietal.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>{h.label}</span>
                  <SourceBadge source={h.source} />
                </div>
              ))}
            </div>
            <div className="kicker" style={{ marginBottom: 10 }}>Affected parties <span style={{ textTransform: "none", color: "var(--ink-ghost)" }}>· predicted</span></div>
            <div className="tag-list">
              {r.affectedParties.map((p) => <span key={p} className="badge pred"><span className="dot"></span>{p}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- WHO GETS HARMED ---------------- */
function HarmedPage() {
  const d = window.DATA;
  const [group, setGroup] = React.useState("Workers");
  const prof = window.DB.groupProfile(group);

  return (
    <div className="page fade-in">
      <PageHead eyebrow="Distributive analysis · 04" title="Who Gets Harmed"
        lede="The core finding of the study: AI harm is not evenly distributed. These views trace which communities carry the load, in which sectors, and how that has shifted over time." />

      <Section title="Demographic load" note="Total incidents recorded as affecting each community (ML-imputed affected-party labels).">
        <Card pad><BarChart labels={d.groupLoad.map((g) => g.group)} values={d.groupLoad.map((g) => g.count)} colorEach height={420} /></Card>
      </Section>

      <Section>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Card title="Sector × group intensity" sub="Where each group is harmed most">
            <Heatmap x={d.heatmap.groups} y={d.heatmap.sectors} z={d.heatmap.z} height={420} />
          </Card>
          <Card title="Vulnerability over time" sub="Top 5 affected groups, 2015–2026">
            <MultiLine x={d.groupTimeSeries.years} series={d.groupTimeSeries.series} height={420} />
          </Card>
        </div>
      </Section>

      <Section title="Group drill-down" note="Resolve to a single community to see who harms them and how."
        right={<Field label="Affected group"><Select value={group} onChange={setGroup} options={d.groups} width={210} /></Field>}>
        <div className="callout harm" style={{ marginBottom: 18 }}>
          <strong>{group}</strong> appear in <strong>{fmt(prof.load)}</strong> recorded incidents across the catalogue.
        </div>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Card title="Developers most implicated" sub={`Top 10 affecting ${group}`}>
            <BarChart labels={prof.topDevs.map((x) => x.name)} values={prof.topDevs.map((x) => x.count)} color={window.OXBLOOD} height={340} />
          </Card>
          <Card title="Technologies involved" sub={`Top 10 affecting ${group}`}>
            <BarChart labels={prof.topTech.map((x) => x.name)} values={prof.topTech.map((x) => x.count)} color={window.SLATE} height={340} />
          </Card>
        </div>
        <div style={{ height: 18 }}></div>
        <Card title="Most recent incidents" sub={`Affecting ${group}`}>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Year</th><th>Headline</th><th>Developer</th><th>Sector</th></tr></thead>
              <tbody>
                {prof.incidents.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.date}</td>
                    <td><span className="strong">{r.headline}</span></td>
                    <td>{r.developer}</td>
                    <td>{r.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>
    </div>
  );
}

/* ---------------- ML PERFORMANCE ---------------- */
function MLPage() {
  const d = window.DATA;
  const [model, setModel] = React.useState(d.ml.order[0]);
  const m = d.ml.models[model];
  const cards = [
    { k: "Macro F1", v: m.metrics.macroF1, note: "Unweighted mean across classes" },
    { k: "Micro F1", v: m.metrics.microF1, note: "Aggregated over all predictions" },
    { k: "Samples F1", v: m.metrics.samplesF1, note: "Mean over individual records" },
    { k: "Macro Precision", v: m.metrics.macroPrecision, note: "Unweighted mean precision" }
  ];

  return (
    <div className="page fade-in">
      <PageHead eyebrow="Pipeline diagnostics · 05" title="ML Performance"
        lede="Transparency on the enrichment models themselves. Metrics are read directly from the trained classifier artefacts; no figure in this atlas is asserted without a corresponding per-class score here." />

      <div className="controls" style={{ marginBottom: 8 }}>
        <Field label="Model"><Select value={model} onChange={setModel} options={d.ml.order} width={220} /></Field>
        <div style={{ flex: 1 }}></div>
        <Field label="Estimator"><div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink-soft)" }}>{m.algo}</div></Field>
      </div>

      <Section title={m.title} note="Overall scores on the held-out evaluation split.">
        <div className="grid grid-4">
          {cards.map((c) => (
            <div className="kpi" key={c.k}>
              <span className="kpi-accent" style={{ background: c.v >= 0.66 ? "var(--moss)" : c.v >= 0.5 ? "var(--ochre)" : "var(--oxblood)" }}></span>
              <div className="kpi-label">{c.k}</div>
              <div className="kpi-value">{c.v.toFixed(3)}</div>
              <div className="kpi-meta">{c.note}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Class-wise performance" note="Per-label precision, recall, F1 and support, sorted by F1. Bar shows F1 visually.">
        <Card>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Label</th><th>F1</th><th style={{ width: 160 }}></th><th>Precision</th><th>Recall</th><th>Support</th></tr></thead>
              <tbody>
                {m.classes.map((c) => (
                  <tr key={c.label}>
                    <td><span className="strong">{c.label}</span></td>
                    <td className="num" style={{ color: "var(--ink)" }}>{c.f1.toFixed(3)}</td>
                    <td>
                      <div className="bar-track" style={{ width: 150 }}>
                        <div className="bar-fill" style={{ width: (c.f1 * 100) + "%", background: c.f1 >= 0.66 ? "var(--moss)" : c.f1 >= 0.5 ? "var(--ochre)" : "var(--oxblood)", opacity: 0.85 }}></div>
                      </div>
                    </td>
                    <td className="num">{c.precision.toFixed(3)}</td>
                    <td className="num">{c.recall.toFixed(3)}</td>
                    <td className="num">{fmt(c.support)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>
    </div>
  );
}

/* ---------------- COMPARATIVE ANALYSIS ---------------- */
function ComparePage() {
  const d = window.DATA;
  const [type, setType] = React.useState("Developers");
  const opts = {
    Developers: d.developers.map((x) => x.name),
    Sectors: d.sectors.map((x) => x.name),
    Countries: d.countries.map((x) => x.name)
  };
  const defaults = {
    Developers: [opts.Developers[0], opts.Developers[1]],
    Sectors: [opts.Sectors[0], opts.Sectors[1]],
    Countries: [opts.Countries[0], opts.Countries[1]]
  };
  const [a, setA] = React.useState(defaults.Developers[0]);
  const [b, setB] = React.useState(defaults.Developers[1]);

  const changeType = (t) => { setType(t); setA(defaults[t][0]); setB(defaults[t][1]); };
  const cmp = window.DB.compareEntities(type, a, b);

  return (
    <div className="page fade-in">
      <PageHead eyebrow="Side-by-side · 06" title="Comparative Analysis"
        lede="Set any two entities against each other to compare their incident load, trajectory and harm fingerprint." />

      <div className="controls" style={{ marginBottom: 8 }}>
        <Field label="Compare by"><Segmented value={type} onChange={changeType} options={["Developers", "Sectors", "Countries"]} /></Field>
        <div style={{ flex: 1 }}></div>
        <Field label="Entity A"><Select value={a} onChange={setA} options={opts[type]} width={190} /></Field>
        <Field label="Entity B"><Select value={b} onChange={setB} options={opts[type]} width={190} /></Field>
      </div>

      <Section>
        <div className="grid grid-2">
          <div className="kpi"><span className="kpi-accent" style={{ background: window.PALETTE[0] }}></span>
            <div className="kpi-label">{cmp.a.name}</div>
            <div className="kpi-value">{fmt(cmp.a.total)}</div>
            <div className="kpi-meta">recorded incidents</div>
          </div>
          <div className="kpi"><span className="kpi-accent" style={{ background: window.PALETTE[1] }}></span>
            <div className="kpi-label">{cmp.b.name}</div>
            <div className="kpi-value">{fmt(cmp.b.total)}</div>
            <div className="kpi-meta">recorded incidents</div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <Card title="Incident trajectory" sub="Counts over time, both entities">
            <MultiLine x={cmp.years} series={[{ name: cmp.a.name, values: cmp.a.timeline }, { name: cmp.b.name, values: cmp.b.timeline }]} height={340} />
          </Card>
          <Card title="Harm fingerprint" sub="Top 6 individual harm profile">
            <RadarChart axes={cmp.radarAxes} series={[{ name: cmp.a.name, values: cmp.a.radar }, { name: cmp.b.name, values: cmp.b.radar }]} height={340} />
          </Card>
        </div>
      </Section>
    </div>
  );
}

/* ---------------- CORPORATE ACCOUNTABILITY ---------------- */
function AccountabilityPage() {
  const d = window.DATA;
  const ac = d.accountability;
  const [view, setView] = React.useState("accountable");

  const avgSilence = ac.scatter.reduce(function(s, c) { return s + c.silenceRate; }, 0) / ac.scatter.length;

  const rankData = view === "accountable"
    ? ac.topAccountable.slice().reverse()
    : ac.topSilent.slice().reverse();

  const scatterTrace = {
    type: "scatter", mode: "markers",
    x: ac.scatter.map(function(c) { return c.incidents; }),
    y: ac.scatter.map(function(c) { return Math.round(c.silenceRate * 100); }),
    text: ac.scatter.map(function(c) { return c.name; }),
    marker: {
      size: ac.scatter.map(function(c) { return Math.max(6, Math.min(32, Math.sqrt(c.incidents) * 3)); }),
      color: ac.scatter.map(function(c) { return c.avgResponseScore; }),
      cmin: 0, cmax: 4,
      colorscale: [[0, "#d4807f"], [0.25, "#c09060"], [0.5, "#d6b061"], [0.75, "#a0b07a"], [1, "#84b389"]],
      showscale: true,
      colorbar: {
        title: { text: "response score", font: { family: '"IBM Plex Mono",monospace', size: 10, color: "#7c7f84" }, side: "right" },
        thickness: 10, len: 0.75, outlinewidth: 0, x: 1.02,
        tickfont: { family: '"IBM Plex Mono",monospace', size: 10, color: "#7c7f84" },
        tickvals: [0, 1, 2, 3, 4], ticktext: ["0 silent", "1", "2", "3", "4 strong"]
      },
      line: { color: "#181b20", width: 0.5 }
    },
    hovertemplate: "<b>%{text}</b><br>Incidents: %{x}<br>No response: %{y}%<br>Response score: %{marker.color:.2f}<extra></extra>"
  };

  const scatterLayout = {
    font: { family: '"IBM Plex Sans",system-ui,sans-serif', size: 13, color: "#aeb0b3" },
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 60, r: 90, t: 14, b: 52 },
    hoverlabel: { bgcolor: "#20242b", bordercolor: "#3a4049", font: { family: '"IBM Plex Mono",monospace', size: 12, color: "#e9e7e1" } },
    xaxis: {
      title: { text: "Total incidents (log scale)", font: { size: 11, color: "#7c7f84" } },
      type: "log", gridcolor: "#282d34", zerolinecolor: "#3a4049",
      tickfont: { family: '"IBM Plex Mono",monospace', size: 11, color: "#7c7f84" }, automargin: true
    },
    yaxis: {
      title: { text: "Silence rate (%)", font: { size: 11, color: "#7c7f84" } },
      gridcolor: "#282d34", zerolinecolor: "#3a4049",
      tickfont: { family: '"IBM Plex Mono",monospace', size: 11, color: "#7c7f84" },
      ticksuffix: "%", automargin: true
    }
  };

  return (
    <div className="page fade-in">
      <PageHead eyebrow="Corporate Accountability · 07" title="Corporate Accountability Index"
        lede="Which organisations go silent after an AI incident — and which take responsibility? Scores are derived from the documented Response and Consequence fields across all records. Higher response score means stronger corrective action." />

      <Section>
        <div className="grid grid-4">
          <KPI label="Companies analysed" value={fmt(ac.scatter.length)} meta="Min. 3 incidents" />
          <KPI label="Most silent" value={ac.topSilent[0] ? ac.topSilent[0].name : "—"}
            meta={ac.topSilent[0] ? pct(ac.topSilent[0].silenceRate) + " no response" : ""}
            accent="var(--oxblood)" />
          <KPI label="Most accountable" value={ac.topAccountable[0] ? ac.topAccountable[0].name : "—"}
            meta={ac.topAccountable[0] ? "Score " + ac.topAccountable[0].avgResponseScore.toFixed(2) + " / 4" : ""}
            accent="var(--moss)" />
          <KPI label="Avg silence rate" value={pct(avgSilence)} meta="Across all companies" accent="var(--ochre)" />
        </div>
      </Section>

      <Section title="Corporate Silence Map"
        note="Each bubble is a company (size ∝ incident count). X-axis: total incidents (log). Y-axis: % of incidents with no documented response. Colour: average response quality — red = silent, green = accountable.">
        <Card pad>
          <Chart data={[scatterTrace]} layout={scatterLayout} height={440} />
        </Card>
      </Section>

      <Section title="Accountability ranking"
        note={view === "accountable"
          ? "Sorted by average response quality (0 = silent, 4 = strongest action). Min. 5 incidents."
          : "Sorted by silence rate — % of incidents with no documented response. Min. 5 incidents."}
        right={<Field label="View"><Segmented value={view} onChange={setView} options={["accountable", "silent"]} /></Field>}>
        <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
          <Card pad>
            <BarChart
              labels={rankData.map(function(c) { return c.name; })}
              values={view === "accountable"
                ? rankData.map(function(c) { return c.avgResponseScore; })
                : rankData.map(function(c) { return Math.round(c.silenceRate * 100); })}
              color={view === "accountable" ? "#84b389" : "#d4807f"}
              height={400}
            />
          </Card>
          <Card>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>#</th><th>Company</th><th>Incidents</th>
                    <th>{view === "accountable" ? "Score /4" : "Silent %"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankData.slice().reverse().map(function(c, i) {
                    return (
                      <tr key={c.name}>
                        <td className="num">{i + 1}</td>
                        <td><span className="strong">{c.name}</span></td>
                        <td className="num">{fmt(c.incidents)}</td>
                        <td className="num">
                          {view === "accountable"
                            ? c.avgResponseScore.toFixed(2)
                            : Math.round(c.silenceRate * 100) + "%"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Methodology note">
        <Card pad>
          <div className="prose" style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.7 }}>
            <p><strong style={{ color: "var(--ink)" }}>Response score (0–4):</strong> Derived from the AIAAIC Response field.
              Silent (no entry) = 0. Minor updates = 1. Policy or suspension actions = 2.
              Terminations and recalls = 3. Public apology = 4. Multi-valued responses take the highest score.</p>
            <p><strong style={{ color: "var(--ink)" }}>Silence rate:</strong> Proportion of a company's incidents where no
              Response was recorded in the AIAAIC database. A high rate indicates the organisation did not publicly
              acknowledge or address the incident.</p>
            <p><strong style={{ color: "var(--ink)" }}>Inclusion criteria:</strong> Companies with fewer than 5 incidents are
              excluded from the rankings (statistically unreliable). The scatter includes all companies with ≥ 3 incidents.</p>
          </div>
        </Card>
      </Section>
    </div>
  );
}

Object.assign(window, { BrowserPage, HarmedPage, MLPage, ComparePage, AccountabilityPage });
