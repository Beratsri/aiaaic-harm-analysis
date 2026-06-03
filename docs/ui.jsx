/* ============================================================
   Shared UI primitives
   ============================================================ */

const fmt = (n) => n == null ? "—" : n.toLocaleString("en-US");
const pct = (n, d = 1) => (n * 100).toFixed(d) + "%";

/* ---- Sidebar ---- */
const NAV = [
  { id: "home",        num: "00", label: "Home" },
  { id: "overview",    num: "01", label: "Overview" },
  { id: "companies",   num: "02", label: "Company Profiles" },
  { id: "browser",     num: "03", label: "Incident Browser" },
  { id: "harmed",      num: "04", label: "Who Gets Harmed" },
  { id: "ml",          num: "05", label: "ML Performance" },
  { id: "compare",        num: "06", label: "Comparative Analysis" },
  { id: "accountability", num: "07", label: "Corporate Accountability" }
];

function Sidebar({ page, onNav }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span className="brand-glyph"></span>
          <span className="brand-title">AIAAIC Atlas</span>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-label">Sections</div>
        {NAV.map((n) => (
          <button key={n.id} className={"nav-item" + (page === n.id ? " active" : "")} onClick={() => onNav(n.id)}>
            <span className="nav-num">{n.num}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

/* ---- Page scaffolding ---- */
function PageHead({ eyebrow, title, lede }) {
  return (
    <header className="page-head">
      <h1 className="page-title">{title}</h1>
      {lede && <p className="page-lede">{lede}</p>}
    </header>
  );
}
function Section({ title, note, right, children }) {
  return (
    <section className="section">
      {(title || right) && (
        <div className="section-head">
          <div>
            {title && <h2 className="section-title">{title}</h2>}
            {note && <div className="section-note">{note}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---- Card ---- */
function Card({ title, sub, right, children, pad }) {
  return (
    <div className="card">
      {(title || right) && (
        <div className="card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {sub && <div className="card-sub">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div className={pad ? "card-pad" : "card-body"}>{children}</div>
    </div>
  );
}

/* ---- KPI ---- */
function KPI({ label, value, meta, accent = "var(--slate)" }) {
  return (
    <div className="kpi">
      <span className="kpi-accent" style={{ background: accent }}></span>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {meta && <div className="kpi-meta">{meta}</div>}
    </div>
  );
}

/* ---- Integrity bar ---- */
function IntegrityBar({ name, pct: p, note }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => { const t = setTimeout(() => setW(p), 120); return () => clearTimeout(t); }, [p]);
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span className="bar-name">{name}</span>
        <span className="bar-pct">{p}% missing</span>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{ width: w + "%" }}></div></div>
      {note && <div className="bar-cap">{note}</div>}
    </div>
  );
}

/* ---- Badge ---- */
function SourceBadge({ source }) {
  return source === "orig"
    ? <span className="badge orig"><span className="dot"></span>Original (AIAAIC)</span>
    : <span className="badge pred"><span className="dot"></span>Predicted (ML)</span>;
}

/* ---- Controls ---- */
function Field({ label, children }) {
  return <div className="field"><span className="field-label">{label}</span>{children}</div>;
}
function Select({ value, onChange, options, width }) {
  return (
    <select className="input" value={value} style={width ? { minWidth: width } : null}
      onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}
function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o} className={value === o ? "on" : ""} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}
function YearRange({ min, max, value, onChange }) {
  // value: [lo, hi]
  return (
    <div className="range-wrap">
      <span className="range-val">{value[0]}</span>
      <input type="range" className="range" min={min} max={max} value={value[0]}
        onChange={(e) => onChange([Math.min(+e.target.value, value[1]), value[1]])} />
      <input type="range" className="range" min={min} max={max} value={value[1]}
        onChange={(e) => onChange([value[0], Math.max(+e.target.value, value[0])])} />
      <span className="range-val">{value[1]}</span>
    </div>
  );
}
function SearchInput({ value, onChange, placeholder }) {
  return <input className="input" style={{ minWidth: 240 }} value={value} placeholder={placeholder || "Search…"}
    onChange={(e) => onChange(e.target.value)} />;
}

/* Multi-select via dropdown of remaining options + chips */
function MultiSelect({ selected, options, onChange, placeholder = "Add filter…" }) {
  const remaining = options.filter((o) => selected.indexOf(o) < 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <select className="input" value="" onChange={(e) => { if (e.target.value) onChange(selected.concat([e.target.value])); }}>
        <option value="">{placeholder}</option>
        {remaining.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {selected.length > 0 && (
        <div className="chips">
          {selected.map((s) => (
            <span key={s} className="chip">{s}<button onClick={() => onChange(selected.filter((x) => x !== s))}>×</button></span>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaItem({ k, children }) {
  return <div className="meta-item"><div className="meta-k">{k}</div><div className="meta-v">{children}</div></div>;
}

Object.assign(window, {
  fmt, pct, NAV, Sidebar, PageHead, Section, Card, KPI, IntegrityBar,
  SourceBadge, Field, Select, Segmented, YearRange, SearchInput, MultiSelect, MetaItem
});
