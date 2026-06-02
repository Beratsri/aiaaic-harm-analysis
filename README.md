# AIAAIC ML-Enriched AI Incident Analysis Dashboard

This repository contains the complete implementation of the **AIAAIC ML-Enriched AI Incident Analysis** project. The project addresses data gaps in the AIAAIC database by training machine learning models to predict missing harm categories and introducing a new **Affected Party** classification.

## Project Structure

```text
├── data/
│   ├── raw/
│   │   └── AIAAIC_Repository.xlsx     # Original dataset
│   ├── interim/
│   │   ├── aiaaic_clean.csv           # Cleaned dataset
│   │   ├── manual_labels_template.csv # Labeling template
│   │   └── manual_labels.csv          # Manual/Heuristic annotations
│   └── processed/
│       └── aiaaic_enriched.csv        # Final ML-enriched dataset
│
├── notebooks/
│   ├── 01_data_exploration.ipynb      # Initial exploratory analysis
│   ├── 02_data_cleaning.ipynb         # Cleaning validations
│   ├── 03_harm_classifier.ipynb       # Trains Harm_Individual & Harm_Societal
│   ├── 04_affected_party.ipynb        # Trains Affected Party Classifier
│   └── 05_final_analysis.ipynb        # Performs enrichment & hypothesis tests
│
├── src/
│   ├── config.py                      # Directories & path configurations
│   ├── data_cleaning.py               # Data cleaning logic
│   ├── text_features.py               # TF-IDF Feature engineering functions
│   └── models/
│       ├── harm_classifier.py         # Harm classification module
│       ├── affected_party.py          # Affected Party classification module
│       └── evaluation.py              # Performance evaluation metrics
│
├── app/
│   ├── main.py                        # Streamlit app home page
│   ├── pages/                         # Multi-page dashboard layouts
│   └── utils/                         # Caching loaders & visualizations
│
├── reports/
│   └── final_report.md                # Final academic research paper
│
└── requirements.txt                   # Dependency list
```

## Quick Start & Installation

### 1. Set Up Virtual Environment

Create and activate a Python virtual environment:

```bash
# Create
python3 -m venv venv

# Activate (macOS / Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Data & Training Pipeline

To build and run the entire pipeline from scratch, run the scripts in order:

```bash
# 1. Create project directories & copy raw Excel file
python3 src/config.py

# 2. Clean the raw Excel file
python3 src/data_cleaning.py

# 3. Create the stratified sample and labeling template
python3 scripts/sample_for_labeling.py

# 4. Generate heuristic/keyword labels for the training set
python3 scripts/generate_heuristic_labels.py

# 5. Build and execute Jupyter notebooks (trains models, enriches data, runs hypotheses)
jupyter nbconvert --to notebook --execute --inplace notebooks/*.ipynb
```

### 4. Run the Streamlit Dashboard

Launch the interactive dashboard locally:

```bash
streamlit run app/main.py
```

Open `http://localhost:8501` in your browser.

## Key Research Findings

- **Sector Concentration:** Chi-square test indicates a highly statistically significant correlation between the industry sector of deployment and the group of people harmed ($p < 0.0001$).
- **Developer Oligopoly:** Top 5 developers account for over 34% of all AI incidents, with OpenAI leading at 10.5%.
- **Policy Enforcement Gap:** Over 74% of incidents in the database lack documented legal consequences, highlighting the critical necessity for active regulation.
