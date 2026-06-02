import os

# Base paths
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SRC_DIR)

# Data paths
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")
INTERIM_DATA_DIR = os.path.join(DATA_DIR, "interim")
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, "processed")

RAW_DATA_PATH = os.path.join(RAW_DATA_DIR, "AIAAIC_Repository.xlsx")
CLEAN_DATA_PATH = os.path.join(INTERIM_DATA_DIR, "aiaaic_clean.csv")
MANUAL_LABELS_PATH = os.path.join(INTERIM_DATA_DIR, "manual_labels.csv")
MANUAL_LABELS_TEMPLATE_PATH = os.path.join(INTERIM_DATA_DIR, "manual_labels_template.csv")
ENRICHED_DATA_PATH = os.path.join(PROCESSED_DATA_DIR, "aiaaic_enriched.csv")

# Model paths
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
HARM_INDIVIDUAL_MODEL_PATH = os.path.join(MODELS_DIR, "harm_individual_clf.joblib")
HARM_SOCIETAL_MODEL_PATH = os.path.join(MODELS_DIR, "harm_societal_clf.joblib")
AFFECTED_PARTY_MODEL_PATH = os.path.join(MODELS_DIR, "affected_party_clf.joblib")

# Report paths
REPORTS_DIR = os.path.join(PROJECT_ROOT, "reports")
REPORTS_FIGURES_DIR = os.path.join(REPORTS_DIR, "figures")
FINAL_REPORT_PATH = os.path.join(REPORTS_DIR, "final_report.md")

# Random state
RANDOM_STATE = 42

def ensure_dirs():
    """Ensure that all required directories exist."""
    dirs = [
        RAW_DATA_DIR,
        INTERIM_DATA_DIR,
        PROCESSED_DATA_DIR,
        MODELS_DIR,
        REPORTS_DIR,
        REPORTS_FIGURES_DIR,
        os.path.join(PROJECT_ROOT, "notebooks"),
        os.path.join(PROJECT_ROOT, "scripts"),
        os.path.join(PROJECT_ROOT, "app"),
        os.path.join(PROJECT_ROOT, "app", "pages"),
        os.path.join(PROJECT_ROOT, "app", "utils"),
        os.path.join(PROJECT_ROOT, "tests"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

if __name__ == "__main__":
    ensure_dirs()
    print("Project directories created successfully.")
