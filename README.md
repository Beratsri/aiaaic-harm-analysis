# AIAAIC ML-Enriched AI Incident Analysis

A structured re-analysis of the [AIAAIC database](https://www.aiaaic.org/aiaaic-repository) (2,247 AI incidents, 2008–2026). Machine learning models fill the critical harm fields that are blank in the majority of raw records, and the results are presented in an interactive research dashboard.

**Live dashboard:** https://beratsri.github.io/aiaaic-harm-analysis/

---

## How it works

```
AIAAIC_Repository.xlsx
        │
        ▼
 src/data_cleaning.py                  ──▶  data/interim/aiaaic_clean.csv
        │
        ▼
 notebooks/03_harm_classifier.ipynb    ──▶  models/harm_individual_clf.joblib
                                            models/harm_societal_clf.joblib
 notebooks/04_affected_party.ipynb     ──▶  models/affected_party_clf.joblib
        │
        ▼
 notebooks/05_final_analysis.ipynb     ──▶  data/processed/aiaaic_enriched.csv
        │
        ▼
 scripts/generate_web_data.py          ──▶  web/data.js  (copy to docs/data.js)
        │
        ▼
 docs/index.html  ◀──  docs/*.jsx / app.css
        │
        ▼
  http://localhost:8502
```

**What each ML model does:**

| Model | Task | Training data | Missing rate |
|---|---|---|---|
| `harm_individual_clf` | Predict individual-level harm types | ~36% of records (original labels) | 64% |
| `harm_societal_clf` | Predict societal-level harm types | ~40% of records (original labels) | 60% |
| `affected_party_clf` | Classify affected community group | 2,247 keyword-labelled records, seeded by ~300 manual annotations (weak supervision) | 100% (new field) |

---

## Project structure

```
├── data/
│   ├── raw/
│   │   └── AIAAIC_Repository.xlsx        # Original dataset (not pushed to git)
│   ├── interim/
│   │   ├── aiaaic_clean.csv              # Cleaned dataset
│   │   ├── manual_labels.csv             # Affected-party labels (keyword rule + manual seed)
│   │   └── scraped_text.csv              # Supplementary scraped article text
│   └── processed/
│       └── aiaaic_enriched.csv           # Final ML-enriched dataset
│
├── models/                               # Trained classifiers (not pushed to git)
│   ├── harm_individual_clf.joblib
│   ├── harm_societal_clf.joblib
│   └── affected_party_clf.joblib
│
├── notebooks/
│   ├── 01_data_exploration.ipynb         # Exploratory analysis & missingness
│   ├── 02_data_cleaning.ipynb            # Cleaning pipeline
│   ├── 03_harm_classifier.ipynb          # Train Harm_Individual & Harm_Societal
│   ├── 04_affected_party.ipynb           # Train Affected Party classifier
│   └── 05_final_analysis.ipynb           # Enrichment + hypothesis tests
│
├── src/
│   ├── config.py                         # Paths & constants
│   ├── data_cleaning.py                  # Cleaning logic
│   ├── text_features.py                  # TF-IDF feature engineering
│   └── models/
│       ├── harm_classifier.py            # HarmClassifier class
│       ├── affected_party.py             # AffectedPartyClassifier class
│       └── evaluation.py                 # Metrics & reporting
│
├── scripts/
│   └── generate_web_data.py              # Converts enriched CSV → web/data.js
│
├── docs/                                 # Interactive dashboard (GitHub Pages)
│   ├── index.html
│   ├── app.css
│   ├── data.js                           # Generated — do not edit by hand
│   ├── charts.jsx                        # Plotly chart components
│   ├── ui.jsx                            # Shared UI primitives
│   ├── pages_a.jsx                       # Home, Overview, Company Profiles
│   ├── pages_b.jsx                       # Incident Browser, Who Gets Harmed, ML, Compare, Accountability
│   └── main.jsx                          # App shell & routing
│
├── final_report.pdf                      # Academic report
└── requirements.txt
```

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/aiaaic-ml-enrichment.git
cd aiaaic-ml-enrichment

python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Add the raw data

Download `AIAAIC_Repository.xlsx` from [aiaaic.org](https://www.aiaaic.org/aiaaic-repository) and place it at:

```
data/raw/AIAAIC_Repository.xlsx
```

### 3. Run the pipeline

```bash
# Clean the raw data
python3 src/data_cleaning.py

# Run the notebooks in order (trains models + produces enriched CSV)
jupyter nbconvert --to notebook --execute --inplace notebooks/02_data_cleaning.ipynb
jupyter nbconvert --to notebook --execute --inplace notebooks/03_harm_classifier.ipynb
jupyter nbconvert --to notebook --execute --inplace notebooks/04_affected_party.ipynb
jupyter nbconvert --to notebook --execute --inplace notebooks/05_final_analysis.ipynb

# Generate the dashboard data file and copy it to the dashboard folder
python3 scripts/generate_web_data.py
cp web/data.js docs/data.js
```

### 4. Open the dashboard

```bash
cd docs && python3 -m http.server 8502
```

Open **http://localhost:8502** in your browser
or simply visit **https://beratsri.github.io/aiaaic-harm-analysis/**

> The dashboard requires a local HTTP server — opening `index.html` directly as a file will not work.

---

## Dashboard pages

| # | Page | What it shows |
|---|---|---|
| 00 | Home | Study overview and data integrity summary |
| 01 | Overview | Yearly trends, top developers, sector map, choropleth |
| 02 | Company Profiles | Per-developer incident history and harm fingerprint |
| 03 | Incident Browser | Searchable, filterable record inspector with provenance |
| 04 | Who Gets Harmed | Demographic load, sector × group heatmap, time trends |
| 05 | ML Performance | Per-model and per-class F1, precision, recall |
| 06 | Comparative Analysis | Side-by-side timeline and harm radar for any two entities |
| 07 | Corporate Accountability | Response scores, silence rates, corporate silence map |

---

## Key findings

- **Sector concentration** — Chi-square test shows a strong link between deployment sector and which group is harmed (χ² = 6,269, *p* < 0.0001; descriptive — see report limitations).
- **Developer oligopoly** — Top 5 developers (OpenAI, Google, Meta, Amazon, Tesla) account for 28.3% of all incidents; OpenAI leads at 10.5%.
- **Enforcement gap** — 74%+ of incidents have no documented legal consequence, and 78%+ get no corporate response.
- **Generative AI surge** — Generative-AI incidents jumped from 9 in 2022 to 150+ per year from 2023 onward (~40% of all recent incidents).

---

## ML performance (held-out test split)

| Model | Macro F1 | Micro F1 |
|---|---|---|
| Individual Harm Classifier | 0.525 | 0.611 |
| Societal Harm Classifier | 0.518 | 0.584 |
| Affected Party Classifier | 0.579 | 0.644 |

All predicted values are flagged separately in the dashboard — original AIAAIC labels and ML-imputed labels are always visually distinct. The Affected Party classifier is evaluated against weakly-supervised (keyword-derived) labels; see the report for details.
