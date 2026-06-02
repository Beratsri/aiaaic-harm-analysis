import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib

def build_input_text(row: pd.Series) -> str:
    """
    Combine fields into a single text representation for NLP models.
    """
    parts = []
    if pd.notna(row.get('Headline')) and str(row['Headline']).strip():
        parts.append(str(row['Headline']).strip())
    if pd.notna(row.get('Technology')) and str(row['Technology']).strip():
        parts.append(f"Technology: {row['Technology']}")
    if pd.notna(row.get('Sector')) and str(row['Sector']).strip():
        parts.append(f"Sector: {row['Sector']}")
    if pd.notna(row.get('EthicalIssue')) and str(row['EthicalIssue']).strip():
        parts.append(f"Ethical Issues: {row['EthicalIssue']}")
    if pd.notna(row.get('Purpose')) and str(row['Purpose']).strip():
        parts.append(f"Purpose: {row['Purpose']}")
    return ' | '.join(parts)

def fit_tfidf(texts: list, max_features: int = 5000) -> TfidfVectorizer:
    """
    Train and return a TF-IDF vectorizer.
    """
    vec = TfidfVectorizer(
        max_features=max_features,
        ngram_range=(1, 2),
        stop_words='english',
        min_df=2,
        max_df=0.95
    )
    vec.fit(texts)
    return vec
