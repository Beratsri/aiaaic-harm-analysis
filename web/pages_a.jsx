/* ============================================================
   Pages A — Home, Overview, Company Profiles
   ============================================================ */

/* ---------------- HOME ---------------- */
function HomePage() {
  const d = window.DATA;
  return (
    <div className="page fade-in">
      <PageHead
        eyebrow="Methods Note · 00"
        title="Auditing two decades of documented AI harm"
        lede="A structured re-analysis of the AIAAIC incident database, enriched with a machine-learning pipeline that recovers the harm categories, affected parties, and consequences missing from most raw records. This atlas makes the resulting evidence base inspectable, page by page." />

      <Section>
        <div className="grid grid-4">
          <KPI label="Total incidents" value={fmt(d.kpi.totalIncidents)} meta="AI controversies catalogued" />
          <KPI label="Unique developers" value={fmt(d.kpi.uniqueDevelopers)} meta="Distinct organisations" accent="var(--oxblood)" />
          <KPI label="Affected jurisdictions" value={fmt(d.kpi.uniqueCountries)} meta="Countries represented" accent="var(--ochre)" />
          <KPI label="Period covered" value={d.kpi.yearMin + "–" + d.kpi.yearMax} meta="18 years of records" accent="var(--moss)" />
        </div>
      </Section>

      <Section>
        <div className="grid" style={{ gridTemplateColumns: "1.05fr 1fr" }}>
          <Card title="What this study does" sub="Agarwal & Nene, 2025">
            <div className="prose" style={{ fontSize: 15 }}>
              <p>The AIAAIC database is the most comprehensive open catalogue of AI, algorithmic and automation
                controversies. It is also profoundly <em>incomplete</em>: the fields that matter most for accountability
                research — who was harmed, how, and with what consequence — are blank in the majority of records.</p>
              <p>We treat that incompleteness as a measurement problem. A supervised text-classification pipeline reads
                each incident's narrative and predicts its missing harm categories, affected communities, and outcomes,
                with every prediction flagged and held to reported per-class performance.</p>
            </div>
            <div className="callout" style={{ marginTop: 18 }}>
              <strong>Every figure is provenanced.</strong> Original AIAAIC values and ML-imputed values are labelled
              distinctly throughout the atlas, so a reader can always separate recorded fact from model inference.
            </div>
          </Card>

          <Card title="Why enrichment was necessary" sub="Field missingness in the raw AIAAIC export">
            {d.integrity.map((r) => (
              <IntegrityBar key={r.field} name={r.field} pct={r.missing} note={r.note} />
            ))}
            <div className="bar-cap" style={{ marginTop: 16, color: "var(--ink-soft)" }}>
              Up to four in five records lack a documented response. Reading harm patterns off the raw data alone would
              systematically under-count exactly the incidents that went unanswered.
            </div>
          </Card>
        </div>
      </Section>

      <Section title="How to read this atlas" note="Seven views, from macroscopic distributions down to a single audited incident.">
        <div className="grid grid-3">
          {NAV.slice(1).map((n) => (
            <div className="card card-pad" key={n.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span className="mono" style={{ color: "var(--ink-ghost)", fontSize: 13 }}>{n.num}</span>
              <div>
                <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 16 }}>{n.label}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{PAGE_BLURB[n.id]}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
const PAGE_BLURB = {
  overview: "Temporal, organisational and geographic distribution of all incidents.",
  companies: "Drill into a single developer's risk profile and harm fingerprint.",
  browser: "Search, filter and inspect any record with full provenance.",
  harmed: "Which communities bear the load, in which sectors, over time.",
  ml: "Per-model and per-class performance of the enrichment pipeline.",
  compare: "Set two developers, sectors or countries side by side."
};

/* ---------------- OVERVIEW ---------------- */
function OverviewPage() {
  const d = window.DATA;
  const [range, setRange] = React.useState([d.kpi.yearMin, d.kpi.yearMax]);
  const [sel, setSel] = React.useState([]);

  const inRange = d.yearly.filter((r) => r.year >= range[0] && r.year <= range[1]);
  const rangeTotal = inRange.reduce((a, b) => a + b.count, 0);
  const peak = d.yearly.reduce((m, r) => r.count > m.count ? r : m, d.yearly[0]);

  const mapData = sel.length ? d.countries.filter((c) => sel.indexOf(c.name) >= 0) : d.countries;

  return (
    <div className="page fade-in">
      <PageHead eyebrow="Distributions · 01" title="Overview"
        lede="Where, when and by whom AI incidents are recorded. Use the year window and country filter to recompute every view on this page." />

      <div className="controls" style={{ marginBottom: 8 }}>
        <Field label="Year window"><YearRange min={d.kpi.yearMin} max={d.kpi.yearMax} value={range} onChange={setRange} /></Field>
        <Field label="Filter countries"><MultiSelect selected={sel} options={d.countries.map((c) => c.name)} onChange={setSel} placeholder="All countries" /></Field>
        <div style={{ flex: 1 }}></div>
        <Field label="In selection"><div style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{fmt(rangeTotal)}</div></Field>
      </div>

      <Section title="Yearly incident trend" note={`Annual counts ${range[0]}–${range[1]}. Peak: ${peak.year} (${peak.count} incidents) during the generative-AI surge.`}>
        <Card pad><LineChart x={inRange.map((r) => r.year)} y={inRange.map((r) => r.count)} height={300} /></Card>
      </Section>

      <Section>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Card title="Top developers" sub="Organisations by recorded incident count">
            <BarChart labels={d.developers.slice(0, 10).map((x) => x.name)} values={d.developers.slice(0, 10).map((x) => x.count)} colorEach height={360} />
          </Card>
          <Card title="Sector distribution" sub="Domains in which incidents occur">
            <Treemap labels={d.sectors.map((s) => s.name)} values={d.sectors.map((s) => s.count)} height={360} />
          </Card>
        </div>
      </Section>

      <Section title="Geographic concentration" note={sel.length ? `Showing ${sel.length} selected ${sel.length === 1 ? "country" : "countries"}.` : "All recorded jurisdictions. The United States accounts for roughly 40% of catalogued incidents."}>
        <Card pad><Choropleth locations={mapData.map((c) => c.name)} z={mapData.map((c) => c.count)} height={440} /></Card>
      </Section>
    </div>
  );
}

/* ---------------- COMPANY PROFILES ---------------- */
function CompaniesPage() {
  const d = window.DATA;
  const [name, setName] = React.useState("OpenAI");
  const prof = window.DB.companyProfile(name);

  return (
    <div className="page fade-in">
      <PageHead eyebrow="Organisational · 02" title="Company Profiles"
        lede="Resolve the dataset to a single developer to read its distinctive risk profile — incident history, dominant harm types, and the underlying records." />

      <div className="controls" style={{ marginBottom: 8 }}>
        <Field label="Developer"><Select value={name} onChange={setName} options={d.developers.map((x) => x.name)} width={220} /></Field>
        <div style={{ flex: 1 }}></div>
      </div>

      <Section>
        <div className="grid grid-3">
          <KPI label="Recorded incidents" value={fmt(prof.dev.count)} meta={`Rank #${d.developers.findIndex((x) => x.name === name) + 1} of ${d.developers.length} tracked`} />
          <KPI label="Primary sector" value={<span style={{ fontSize: 22 }}>{prof.dev.sector}</span>} meta="Most affected domain" accent="var(--ochre)" />
          <KPI label="Primary technology" value={<span style={{ fontSize: 22 }}>{prof.dev.tech}</span>} meta="Dominant system type" accent="var(--moss)" />
        </div>
      </Section>

      <Section>
        <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <Card title={name + " · incident timeline"} sub="Controversies attributed to this developer over time">
            <LineChart x={prof.timeline.map((r) => r.year)} y={prof.timeline.map((r) => r.count)} color={window.OXBLOOD} height={320} />
          </Card>
          <Card title="Harm breakdown" sub="Top 5 individual harm types">
            <Donut labels={prof.harms.map((h) => h.label)} values={prof.harms.map((h) => h.value)} height={320} />
          </Card>
        </div>
      </Section>

      <Section title="Incident log" note={`Records attributed to ${name}.`}>
        <Card>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>ID</th><th>Date</th><th>Headline</th><th>Technology</th><th>Sector</th><th>Country</th></tr></thead>
              <tbody>
                {prof.incidents.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.id}</td>
                    <td className="num">{r.date}</td>
                    <td><span className="strong">{r.headline}</span></td>
                    <td>{r.technology}</td>
                    <td>{r.sector}</td>
                    <td>{r.country}</td>
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

Object.assign(window, { HomePage, OverviewPage, CompaniesPage });
