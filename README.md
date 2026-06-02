# AIAAIC ML-Enriched AI Incident Analysis

A structured re-analysis of the [AIAAIC database](https://www.aiaaic.org/aiaaic-repository) (2,247 AI incidents, 2008–2026). Machine learning models fill the critical harm fields that are blank in the majority of raw records, and the results are presented in an interactive research dashboard.

---

## How it works

```
AIAAIC_Repository.xlsx
        │
        ▼
 src/data_cleaning.py          ──▶  data/interim/aiaaic_clean.csv
        │
        ▼
 notebooks/03_harm_classifier.ipynb    ──▶  models/harm_individual_clf.joblib
 notebooks/04_affected_party.ipynb     ──▶  models/harm_societal_clf.joblib
                                            models/affected_party_clf.joblib
        │
        ▼
 notebooks/05_final_analysis.ipynb     ──▶  data/processed/aiaaic_enriched.csv
        │
        ▼
 scripts/generate_web_data.py          ──▶  web/data.js
        │
        ▼
 web/index.html  ◀──  web/*.jsx / app.css
        │
        ▼
  http://localhost:8502
```

**What each ML model does:**

| Model | Task | Training data | Missing rate |
|---|---|---|---|
| `harm_individual_clf` | Predict individual-level harm types | ~36% of records | 64% |
| `harm_societal_clf` | Predict societal-level harm types | ~40% of records | 60% |
| `affected_party_clf` | Classify affected community group | 300 manually labelled records | 100% (new field) |

---

## Project structure

```
├── data/
│   ├── raw/
│   │   └── AIAAIC_Repository.xlsx        # Original dataset (not pushed to git)
│   ├── interim/
│   │   ├── aiaaic_clean.csv              # Cleaned dataset
│   │   ├── manual_labels.csv             # 300 hand-labelled affected-party records
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
├── web/                                  # Interactive dashboard
│   ├── index.html
│   ├── app.css
│   ├── data.js                           # Generated — do not edit by hand
│   ├── charts.jsx                        # Plotly chart components
│   ├── ui.jsx                            # Shared UI primitives
│   ├── pages_a.jsx                       # Home, Overview, Company Profiles
│   ├── pages_b.jsx                       # Incident Browser, Who Gets Harmed, ML, Compare
│   └── main.jsx                          # App shell & routing
│
├── reports/
│   └── final_report.md                   # Academic report
│
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

# Generate the dashboard data file
python3 scripts/generate_web_data.py
```

### 4. Open the dashboard

```bash
cd web && python3 -m http.server 8502
```

Open **http://localhost:8502** in your browser.

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
| 06 | Comparative Analysis | Side-by-side radar and timeline for any two entities |

---

## Key findings

- **Sector concentration** — Chi-square test shows a statistically significant link between deployment sector and which group is harmed (*p* < 0.0001).
- **Developer oligopoly** — Top 5 developers account for 34 %+ of all incidents; OpenAI leads at 10.5 %.
- **Enforcement gap** — 74 %+ of incidents have no documented legal consequence.
- **Generative AI surge** — Incidents involving generative AI (LLM, image generation) roughly doubled each year from 2022–2024.

---

## ML performance (held-out test split)

| Model | Macro F1 | Micro F1 |
|---|---|---|
| Individual Harm Classifier | 0.493 | 0.604 |
| Societal Harm Classifier | 0.502 | 0.565 |
| Affected Party Classifier | 0.643 | 0.691 |

All predicted values are flagged separately in the dashboard — original AIAAIC labels and ML-imputed labels are always visually distinct.

---

## References

Agarwal, A., & Nene, M. J. (2025). *Standardised schema and taxonomy for AI incident databases.* arXiv:2501.17037  
Slattery, P. et al. (2024). *The AI Risk Repository.* arXiv:2408.12622  
Eubanks, V. (2018). *Automating Inequality.* St. Martin's Press  
Benjamin, R. (2019). *Race After Technology.* Polity Press  
Noble, S. U. (2018). *Algorithms of Oppression.* NYU Press
