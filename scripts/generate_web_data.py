"""
Generate web/data.js from aiaaic_enriched.csv.
Run from the project root: python scripts/generate_web_data.py
"""
import json
import sys
import os
from collections import Counter, defaultdict

import pandas as pd
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "data", "processed", "aiaaic_enriched.csv")
OUT_PATH = os.path.join(ROOT, "web", "data.js")
MODELS_DIR = os.path.join(ROOT, "models")


def parse_multi(val):
    if pd.isna(val) or str(val).strip() == "":
        return []
    return [x.strip() for x in str(val).split(";") if x.strip()]


def top_n(counter, n):
    return counter.most_common(n)


def main():
    print("Loading CSV…")
    df = pd.read_csv(CSV_PATH)
    df["Year"] = pd.to_numeric(df["Year"], errors="coerce")

    # ── KPIs ────────────────────────────────────────────────────────────────
    all_devs = [d for v in df["Developer"].dropna() for d in parse_multi(v)]
    all_countries = [c for v in df["Country"].dropna() for c in parse_multi(v)]
    year_min = int(df["Year"].dropna().min())
    year_max = int(df["Year"].dropna().max())

    kpi = {
        "totalIncidents": len(df),
        "uniqueDevelopers": len(set(all_devs)),
        "uniqueCountries": len(set(all_countries)),
        "yearMin": year_min,
        "yearMax": year_max,
    }

    # ── Integrity / missingness ──────────────────────────────────────────────
    integrity = [
        {"field": "Harm_Individual", "missing": round(df["Harm_Individual"].isna().mean() * 100),
         "note": "Individual-level harm category"},
        {"field": "Harm_Societal",   "missing": round(df["Harm_Societal"].isna().mean() * 100),
         "note": "Societal / collective harm category"},
        {"field": "Consequence",     "missing": round(df["Consequence"].isna().mean() * 100),
         "note": "Documented outcome of the incident"},
        {"field": "Response",        "missing": round(df["Response"].isna().mean() * 100),
         "note": "Corporate / institutional response"},
    ]

    # ── Yearly counts ────────────────────────────────────────────────────────
    years_list = list(range(year_min, year_max + 1))
    yr_counts = df[df["Year"].notna()].groupby("Year").size()
    yearly = [{"year": int(y), "count": int(yr_counts.get(y, 0))} for y in years_list]

    # ── Top developers ───────────────────────────────────────────────────────
    dev_counter = Counter(all_devs)
    developers = []
    for dev_name, count in dev_counter.most_common(20):
        mask = df["Developer"].fillna("").apply(lambda x: dev_name in parse_multi(x))
        rows = df[mask]
        sector_ctr = Counter(s for v in rows["Sector"].dropna() for s in parse_multi(v))
        tech_ctr = Counter(t for v in rows["Technology"].dropna() for t in parse_multi(v))
        top_sector = sector_ctr.most_common(1)[0][0] if sector_ctr else "Unknown"
        top_tech = tech_ctr.most_common(1)[0][0] if tech_ctr else "Unknown"
        developers.append({"name": dev_name, "count": count, "sector": top_sector, "tech": top_tech})

    # ── Sectors ──────────────────────────────────────────────────────────────
    sector_ctr = Counter(s for v in df["Sector"].dropna() for s in parse_multi(v))
    sectors = [{"name": n, "count": c} for n, c in sector_ctr.most_common(12)]

    # ── Countries ────────────────────────────────────────────────────────────
    country_ctr = Counter(all_countries)
    countries = [{"name": n, "count": c} for n, c in country_ctr.most_common(30)]

    # ── Harm types (individual & societal) ───────────────────────────────────
    hi_ctr = Counter(
        h for v in df["Harm_Individual_Final"].dropna() for h in parse_multi(v)
        if h not in ("Other", "Unknown", "")
    )
    harm_types = [n for n, _ in hi_ctr.most_common(12)]

    hs_ctr = Counter(
        h for v in df["Harm_Societal_Final"].dropna() for h in parse_multi(v)
        if h not in ("Other", "Unknown", "")
    )
    societal_harms = [n for n, _ in hs_ctr.most_common(8)]

    # ── Affected party groups ────────────────────────────────────────────────
    group_ctr = Counter(
        g for v in df["AffectedParty_Final"].dropna() for g in parse_multi(v)
    )
    groups = [n for n, _ in group_ctr.most_common(14)]

    # ── Technologies ─────────────────────────────────────────────────────────
    tech_ctr = Counter(t for v in df["Technology"].dropna() for t in parse_multi(v))
    technologies = [n for n, _ in tech_ctr.most_common(12)]

    # ── Group load ───────────────────────────────────────────────────────────
    group_load = [{"group": n, "count": c} for n, c in group_ctr.most_common(14)]

    # ── Per-entity real timelines & harm fingerprints ────────────────────────
    # Used by the Company Profiles and Compare pages. Timeline = actual yearly
    # incident counts; radar = counts of the global top-6 individual harm types.
    top6_harms = harm_types[:6]

    def entity_stats(mask):
        rows = df[mask]
        yr_cnt = rows[rows["Year"].notna()].groupby("Year").size()
        timeline = [int(yr_cnt.get(y, 0)) for y in years_list]
        radar = [
            int(rows["Harm_Individual_Final"].fillna("").apply(lambda x: h in parse_multi(x)).sum())
            for h in top6_harms
        ]
        return timeline, radar

    for entry, col in [(d, "Developer") for d in developers] + \
                      [(s, "Sector") for s in sectors] + \
                      [(c, "Country") for c in countries]:
        mask = df[col].fillna("").apply(lambda x: entry["name"] in parse_multi(x))
        entry["timeline"], entry["radar"] = entity_stats(mask)

    # ── Heatmap: sector × group ───────────────────────────────────────────────
    hm_sectors = [s["name"] for s in sectors[:8]]
    hm_groups = [g["group"] for g in group_load[:8]]

    # Build a count matrix: row = sector, col = group
    # For each incident, explode both Sector and AffectedParty_Final and count co-occurrences
    hm_z = []
    for sec in hm_sectors:
        row = []
        sec_mask = df["Sector"].fillna("").apply(lambda x: sec in parse_multi(x))
        for grp in hm_groups:
            grp_mask = df["AffectedParty_Final"].fillna("").apply(lambda x: grp in parse_multi(x))
            row.append(int((sec_mask & grp_mask).sum()))
        hm_z.append(row)

    # ── Group time-series (top 5, 2015-2026) ─────────────────────────────────
    ts_years = list(range(2015, year_max + 1))
    top5_groups = [g["group"] for g in group_load[:5]]
    group_series = []
    for grp in top5_groups:
        grp_mask = df["AffectedParty_Final"].fillna("").apply(lambda x: grp in parse_multi(x))
        yr_grp = df[grp_mask & df["Year"].notna()].groupby("Year").size()
        values = [int(yr_grp.get(y, 0)) for y in ts_years]
        group_series.append({"group": grp, "values": values})

    # ── ML performance metrics ────────────────────────────────────────────────
    ml_data = _get_ml_metrics(df, harm_types, societal_harms, groups)

    # ── All real incidents ────────────────────────────────────────────────────
    incidents = _build_incidents(df, len(df))

    # ── Corporate Accountability Index ────────────────────────────────────────
    accountability = _build_accountability(df)

    # ── Assemble and write ────────────────────────────────────────────────────
    data = {
        "kpi": kpi,
        "integrity": integrity,
        "years": years_list,
        "yearly": yearly,
        "developers": developers,
        "sectors": sectors,
        "countries": countries,
        "harmTypes": harm_types,
        "societalHarms": societal_harms,
        "groups": groups,
        "technologies": technologies,
        "groupLoad": group_load,
        "heatmap": {"sectors": hm_sectors, "groups": hm_groups, "z": hm_z},
        "groupTimeSeries": {"years": ts_years, "series": group_series},
        "ml": ml_data,
        "incidents": incidents,
        "accountability": accountability,
    }

    js = "(function () {\n  \"use strict\";\n  window.DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n  window.DB = buildHelpers(window.DATA);\n})();\n"

    # Append the DB helpers (companyProfile, groupProfile, compareEntities)
    js += _db_helpers_js()

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"Written: {OUT_PATH}")


# ─────────────────────────────────────────────────────────────────────────────
# Corporate Accountability Index
# ─────────────────────────────────────────────────────────────────────────────

def _build_accountability(df):
    RESPONSE_SCORE = {
        "public apology": 4,
        "product recall": 3, "system termination": 3, "programme termination": 3,
        "project termination": 3, "contract termination": 3, "product termination": 3,
        "leadership/employee termination": 3, "company closure": 3,
        "system suspension": 2, "policy update": 2, "policy review/update": 2,
        "third-party audit": 2, "algorithmic grades scrapped": 2,
        "product/service review & update": 2, "system re-development": 2,
        "system review/update": 1, "system updates": 1, "system update": 1,
        "content/data removal": 1, "dataset removal": 1, "content removal": 1,
        "content takedown": 1, "account terminations": 1,
    }
    CONSEQUENCE_SCORE = {
        "incarceration": 5, "incarceration; litigation": 5,
        "litigation; fine/settlement": 4, "fine/settlement; litigation": 4,
        "regulatory investigation; fine/settlement": 4, "fine/settlement; regulatory investigation": 4,
        "litigation": 4, "fine/settlement": 4,
        "regulatory investigation; litigation": 3, "litigation; regulatory investigation": 3,
        "government investigation": 3, "police investigation": 3, "police investigation/action": 3,
        "regulatory investigation": 2, "regulatory investigation/action": 2,
        "legislative complaint/investigation": 2, "legislation introduction/update": 2,
        "legal warning": 1, "regulatory warning": 1, "legal complaint": 1,
        "regulatory complaint": 1, "legislators letter": 1, "regulatory inquiry": 1,
    }

    def _max_score(val, score_map):
        if pd.isna(val) or str(val).strip() == "":
            return 0
        parts = [p.strip().lower() for p in str(val).split(";")]
        best = 0
        for p in parts:
            if p in score_map:
                best = max(best, score_map[p])
            else:
                for key, sc in score_map.items():
                    if key in p:
                        best = max(best, sc)
                        break
                else:
                    best = max(best, 1)
        return best

    records = []
    for _, row in df.iterrows():
        devs = parse_multi(row.get("Developer", ""))
        if not devs:
            devs = ["Unknown"]
        resp_score = _max_score(row.get("Response"), RESPONSE_SCORE)
        cons_score = _max_score(row.get("Consequence"), CONSEQUENCE_SCORE)
        is_silent = pd.isna(row.get("Response")) or str(row.get("Response", "")).strip() == ""
        for dev in devs:
            records.append({"dev": dev, "resp": resp_score, "cons": cons_score, "silent": is_silent})

    recs = pd.DataFrame(records)
    companies = []
    for dev, grp in recs.groupby("dev"):
        if dev in ("Unknown", ""):
            continue
        n = len(grp)
        if n < 3:
            continue
        companies.append({
            "name": dev,
            "incidents": n,
            "silenceRate": round(float(grp["silent"].mean()), 3),
            "avgResponseScore": round(float(grp["resp"].mean()), 3),
            "avgConsequenceScore": round(float(grp["cons"].mean()), 3),
        })

    qualified = [c for c in companies if c["incidents"] >= 5]
    top_accountable = sorted(qualified, key=lambda x: x["avgResponseScore"], reverse=True)[:15]
    top_silent = sorted(qualified, key=lambda x: x["silenceRate"], reverse=True)[:15]

    return {
        "topAccountable": top_accountable,
        "topSilent": top_silent,
        "scatter": sorted(companies, key=lambda x: x["incidents"], reverse=True),
    }


# ─────────────────────────────────────────────────────────────────────────────
# ML metrics helper — reads directly from saved joblib evaluation_results
# ─────────────────────────────────────────────────────────────────────────────

def _load_model_metrics(joblib_path):
    """Load evaluation_results dict saved during training."""
    import joblib as jl
    data = jl.load(joblib_path)
    er = data.get("evaluation_results")
    if er is None:
        raise ValueError(f"No evaluation_results in {joblib_path}")
    return er, data.get("classes", [])


def _class_rows_from_joblib(joblib_path):
    """Convert stored class_report dict to the list format the UI expects."""
    er, _ = _load_model_metrics(joblib_path)
    cr = er.get("class_report", {})
    rows = []
    for label, stats in cr.items():
        if label in ("micro avg", "macro avg", "weighted avg", "samples avg"):
            continue
        rows.append({
            "label": label,
            "precision": round(float(stats.get("precision", 0)), 3),
            "recall":    round(float(stats.get("recall", 0)), 3),
            "f1":        round(float(stats.get("f1-score", 0)), 3),
            "support":   int(stats.get("support", 0)),
        })
    return sorted(rows, key=lambda x: -x["f1"])


def _get_ml_metrics(df, harm_types, societal_harms, groups):
    print("  Loading ML metrics from saved models…")

    def load_model(path, title, algo):
        # No fallback: if a model artefact is missing or unreadable we fail
        # loudly rather than publish fabricated metrics.
        er, _ = _load_model_metrics(path)
        classes = _class_rows_from_joblib(path)
        return {
            "title": title,
            "algo": algo,
            "metrics": {
                "macroF1":        round(er["macro_f1"], 3),
                "microF1":        round(er["micro_f1"], 3),
                "samplesF1":      round(er["samples_f1"], 3),
                "macroPrecision": round(er["macro_precision"], 3),
            },
            "classes": classes,
        }

    return {
        "order": ["Harm_Individual", "Harm_Societal", "Affected Party"],
        "models": {
            "Harm_Individual": load_model(
                os.path.join(MODELS_DIR, "harm_individual_clf.joblib"),
                "Individual Harm Classifier",
                "OneVsRest Logistic Regression · TF-IDF (1–2 gram)",
            ),
            "Harm_Societal": load_model(
                os.path.join(MODELS_DIR, "harm_societal_clf.joblib"),
                "Societal Harm Classifier",
                "OneVsRest Logistic Regression · TF-IDF (1–2 gram)",
            ),
            "Affected Party": load_model(
                os.path.join(MODELS_DIR, "affected_party_clf.joblib"),
                "Affected-Party Classifier",
                "OneVsRest Logistic Regression · TF-IDF",
            ),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Incident builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_incidents(df, n):
    sample = df.dropna(subset=["Headline"]).head(n)
    out = []
    for _, row in sample.iterrows():
        # AIAAIC records carry only a year — no day-level date is invented.
        yr = int(row["Year"]) if pd.notna(row["Year"]) else None
        hi_raw = parse_multi(row.get("Harm_Individual_Final", ""))
        hs_raw = parse_multi(row.get("Harm_Societal_Final", ""))
        ap_raw = parse_multi(row.get("AffectedParty_Final", ""))
        hi_orig = set(parse_multi(row.get("Harm_Individual", "")))
        hs_orig = set(parse_multi(row.get("Harm_Societal", "")))

        hi_labels = [
            {"label": h, "source": "orig" if h in hi_orig else "pred"}
            for h in hi_raw[:3] if h not in ("Other", "Unknown")
        ]
        hs_labels = [
            {"label": h, "source": "orig" if h in hs_orig else "pred"}
            for h in hs_raw[:2] if h not in ("Other", "Unknown")
        ]

        devs = parse_multi(row.get("Developer", ""))

        out.append({
            "id": str(row["ID"]),
            "year": yr,
            "date": str(yr) if yr is not None else "—",
            "headline": str(row["Headline"]),
            "developer": devs[0] if devs else "Unknown",
            "developers": devs,
            "deployer": parse_multi(row.get("Deployer", ""))[0] if parse_multi(row.get("Deployer", "")) else "Unknown",
            "technology": parse_multi(row.get("Technology", ""))[0] if parse_multi(row.get("Technology", "")) else "Unknown",
            "purpose": str(row["Purpose"]) if pd.notna(row.get("Purpose")) else "—",
            "sector": parse_multi(row.get("Sector", ""))[0] if parse_multi(row.get("Sector", "")) else "Unknown",
            "country": parse_multi(row.get("Country", ""))[0] if parse_multi(row.get("Country", "")) else "Unknown",
            "consequence": str(row["Consequence"]) if pd.notna(row.get("Consequence")) else "—",
            "response": str(row["Response"]) if pd.notna(row.get("Response")) else "—",
            "harmsIndividual": hi_labels,
            "harmsSocietal": hs_labels,
            "affectedParties": ap_raw[:3],
        })
    out.sort(key=lambda x: x["year"] if x["year"] is not None else 0, reverse=True)
    return out


# ─────────────────────────────────────────────────────────────────────────────
# DB helpers (JS code appended after the data blob)
# ─────────────────────────────────────────────────────────────────────────────

def _db_helpers_js():
    return """
function buildHelpers(DATA) {
  var YEARS = DATA.years;
  var ZERO_TIMELINE = YEARS.map(function(){ return 0; });
  var ZERO_RADAR = DATA.harmTypes.slice(0, 6).map(function(){ return 0; });

  function companyProfile(name) {
    var dev = DATA.developers.find(function(d){ return d.name === name; }) || DATA.developers[0];
    // Real per-year counts precomputed from the enriched dataset
    var timeline = YEARS.map(function(yr, i) {
      return { year: yr, count: (dev.timeline || ZERO_TIMELINE)[i] || 0 };
    });
    // Incidents where this developer appears anywhere in the developer list
    var devInc = DATA.incidents.filter(function(r){
      return (r.developers || []).indexOf(dev.name) >= 0;
    });
    var harmCtr = {};
    devInc.forEach(function(r) {
      r.harmsIndividual.forEach(function(h) {
        harmCtr[h.label] = (harmCtr[h.label] || 0) + 1;
      });
    });
    var harms = Object.keys(harmCtr).map(function(k){ return { label: k, value: harmCtr[k] }; })
      .sort(function(a,b){ return b.value - a.value; }).slice(0, 5);
    return { dev: dev, timeline: timeline, harms: harms, incidents: devInc.slice(0, 10) };
  }

  function groupProfile(group) {
    var grpInc = DATA.incidents.filter(function(r){
      return r.affectedParties.indexOf(group) >= 0;
    });
    // top developers (excluding records with no attributed developer)
    var devCtr = {};
    grpInc.forEach(function(r){
      if (r.developer !== "Unknown") devCtr[r.developer] = (devCtr[r.developer]||0)+1;
    });
    var topDevs = Object.keys(devCtr).map(function(k){ return { name: k, count: devCtr[k] }; })
      .sort(function(a,b){ return b.count - a.count; }).slice(0, 10);
    // top tech
    var techCtr = {};
    grpInc.forEach(function(r){
      if (r.technology !== "Unknown") techCtr[r.technology] = (techCtr[r.technology]||0)+1;
    });
    var topTech = Object.keys(techCtr).map(function(k){ return { name: k, count: techCtr[k] }; })
      .sort(function(a,b){ return b.count - a.count; }).slice(0, 10);
    var load = (DATA.groupLoad.find(function(g){ return g.group === group; }) || {}).count || 0;
    return { group: group, load: load, topDevs: topDevs, topTech: topTech, incidents: grpInc.slice(0,10) };
  }

  function compareEntities(type, a, b) {
    var list = type === "Developers" ? DATA.developers
             : type === "Sectors"    ? DATA.sectors
             : DATA.countries;
    function entityFor(name) {
      var e = list.find(function(x){ return x.name === name; });
      if (!e) return { name: name, total: 0, timeline: ZERO_TIMELINE, radar: ZERO_RADAR };
      return {
        name: name,
        total: e.count,
        timeline: e.timeline || ZERO_TIMELINE,
        radar: e.radar || ZERO_RADAR
      };
    }
    return {
      type: type,
      a: entityFor(a),
      b: entityFor(b),
      radarAxes: DATA.harmTypes.slice(0, 6),
      years: YEARS
    };
  }

  return { companyProfile: companyProfile, groupProfile: groupProfile, compareEntities: compareEntities };
}
"""


if __name__ == "__main__":
    main()
