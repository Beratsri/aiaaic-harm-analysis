import pandas as pd
import numpy as np
import os
import joblib
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from text_features import build_input_text
from models.evaluation import evaluate_multilabel, print_metrics_summary

class HarmClassifier:
    """
    Multi-label classifier wrapper for Harm_Individual and Harm_Societal.
    Uses TF-IDF feature extraction and OneVsRest Logistic Regression.
    """
    
    def __init__(self, target_column: str, top_n_classes: int = 15):
        self.target_column = target_column
        self.top_n = top_n_classes
        self.mlb = None
        self.vectorizer = None
        self.classifier = None
        self.classes_ = None
        self.evaluation_results = None
        
    def prepare_targets(self, df: pd.DataFrame) -> tuple:
        """
        Prepare multi-label binary target matrix.
        Map tail categories to 'Other' and use MultiLabelBinarizer.
        """
        # Filter rows that have a non-null target
        mask = df[self.target_column].notna() & (df[self.target_column].str.strip() != "")
        df_train = df[mask].copy()
        
        # Split semi-colon separated values
        labels_list = df_train[self.target_column].apply(
            lambda x: [l.strip() for l in str(x).split(';') if l.strip()]
        )
        
        # Determine the top N classes
        all_labels = [label for sublist in labels_list for label in sublist]
        top_classes = pd.Series(all_labels).value_counts().head(self.top_n).index.tolist()
        
        # Map non-top classes to 'Other' and keep unique
        labels_list = labels_list.apply(
            lambda lst: list(set([l if l in top_classes else 'Other' for l in lst]))
        )
        
        self.mlb = MultiLabelBinarizer()
        y = self.mlb.fit_transform(labels_list)
        self.classes_ = self.mlb.classes_
        
        return df_train, y
        
    def fit(self, df: pd.DataFrame):
        """
        Train the model, evaluate on a test split, and store metrics.
        """
        df_train, y = self.prepare_targets(df)
        X_text = df_train.apply(build_input_text, axis=1).tolist()
        
        # TF-IDF Feature Extraction
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=2,
            max_df=0.95
        )
        X = self.vectorizer.fit_transform(X_text)
        
        # Train / Test split (80/20) with random state 42
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # One-vs-Rest Logistic Regression with balanced class weights
        self.classifier = OneVsRestClassifier(
            LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
        )
        self.classifier.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.classifier.predict(X_test)
        self.evaluation_results = evaluate_multilabel(y_test, y_pred, self.classes_)
        print_metrics_summary(self.evaluation_results, f"{self.target_column} Performance Summary")
        
    def predict(self, df: pd.DataFrame) -> pd.Series:
        """
        Predict targets for rows where the target column is missing.
        Returns a Pandas Series with semicolon-separated labels, indexed same as df.
        """
        mask = df[self.target_column].isna() | (df[self.target_column].str.strip() == "")
        if not mask.any():
            return pd.Series(dtype=str)
            
        df_missing = df[mask]
        X_text = df_missing.apply(build_input_text, axis=1).tolist()
        
        # Transform and predict
        X = self.vectorizer.transform(X_text)
        y_pred = self.classifier.predict(X)
        
        # Convert binary matrix back to labels
        labels = self.mlb.inverse_transform(y_pred)
        
        # Format as semicolon-separated string
        pred_strings = ["; ".join(sorted(l)) if l else "Unknown" for l in labels]
        
        return pd.Series(pred_strings, index=df_missing.index)
        
    def save(self, path: str):
        """
        Serialize classifier state to file.
        """
        joblib.dump({
            'target_column': self.target_column,
            'top_n': self.top_n,
            'classifier': self.classifier,
            'vectorizer': self.vectorizer,
            'mlb': self.mlb,
            'classes': self.classes_,
            'evaluation_results': self.evaluation_results
        }, path)
        print(f"Saved {self.target_column} model to {path}")
        
    @classmethod
    def load(cls, path: str) -> 'HarmClassifier':
        """
        Deserialize and load a classifier state.
        """
        data = joblib.load(path)
        clf = cls(target_column=data['target_column'], top_n_classes=data['top_n'])
        clf.classifier = data['classifier']
        clf.vectorizer = data['vectorizer']
        clf.mlb = data['mlb']
        clf.classes_ = data['classes']
        clf.evaluation_results = data.get('evaluation_results')
        return clf
