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

class AffectedPartyClassifier:
    """
    Multi-label classifier for Affected Party.
    Trained on manual annotations, uses TF-IDF + Logistic Regression (OneVsRest).
    """
    
    def __init__(self):
        self.mlb = None
        self.vectorizer = None
        self.classifier = None
        self.classes_ = [
            'Workers', 'RacialEthnicMinorities', 'Children', 'Women',
            'LGBTQ', 'Disabled', 'Patients', 'Students', 'Citizens',
            'Artists', 'Consumers', 'Activists'
        ]
        self.evaluation_results = None
        
    def prepare_targets(self, labels_df: pd.DataFrame) -> tuple:
        """
        Merge Primary and Secondary affected party annotations into a list of targets.
        """
        # Convert columns to string, handle missing values
        prim = labels_df['AffectedParty_Primary'].fillna('').astype(str).str.strip()
        sec = labels_df['AffectedParty_Secondary'].fillna('').astype(str).str.strip()
        
        target_lists = []
        for p, s in zip(prim, sec):
            lst = []
            if p and p != 'nan':
                lst.append(p)
            if s and s != 'nan':
                lst.append(s)
            # Default to Citizens if empty
            if not lst:
                lst.append('Citizens')
            # Keep only unique and recognized classes
            lst = list(set([item for item in lst if item in self.classes_]))
            if not lst:
                lst.append('Citizens')
            target_lists.append(lst)
            
        self.mlb = MultiLabelBinarizer(classes=self.classes_)
        y = self.mlb.fit_transform(target_lists)
        
        return y
        
    def fit(self, labels_df: pd.DataFrame, clean_df: pd.DataFrame):
        """
        Train the model using the labeled dataset joined with textual context.
        """
        # Join labels with text features — derive targets from merged rows so X and y are aligned
        merged = labels_df[['ID', 'AffectedParty_Primary', 'AffectedParty_Secondary']].merge(
            clean_df, on='ID', how='inner'
        ).reset_index(drop=True)

        y = self.prepare_targets(merged)

        X_text = merged.apply(build_input_text, axis=1).tolist()

        # Train TF-IDF vectorizer (bumped features now that we have 2247 labeled rows)
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=2
        )
        X = self.vectorizer.fit_transform(X_text)

        # Split (80/20) with random state 42
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Train classifier
        self.classifier = OneVsRestClassifier(
            LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
        )
        self.classifier.fit(X_train, y_train)

        # Evaluate
        y_pred = self.classifier.predict(X_test)
        self.evaluation_results = evaluate_multilabel(y_test, y_pred, self.classes_)
        print_metrics_summary(self.evaluation_results, "Affected Party Classifier Performance")
        
    def predict(self, df: pd.DataFrame) -> pd.Series:
        """
        Predict affected parties for any dataframe containing the necessary text fields.
        Returns a semicolon-separated string of predicted parties.
        """
        X_text = df.apply(build_input_text, axis=1).tolist()
        X = self.vectorizer.transform(X_text)
        y_pred = self.classifier.predict(X)
        
        # Convert binary predictions back to label strings
        labels = self.mlb.inverse_transform(y_pred)
        pred_strings = ["; ".join(sorted(l)) if l else "Citizens" for l in labels]
        
        return pd.Series(pred_strings, index=df.index)
        
    def save(self, path: str):
        """
        Serialize classifier state.
        """
        joblib.dump({
            'classifier': self.classifier,
            'vectorizer': self.vectorizer,
            'mlb': self.mlb,
            'classes': self.classes_,
            'evaluation_results': self.evaluation_results
        }, path)
        print(f"Saved Affected Party model to {path}")
        
    @classmethod
    def load(cls, path: str) -> 'AffectedPartyClassifier':
        """
        Deserialize and load a classifier state.
        """
        data = joblib.load(path)
        clf = cls()
        clf.classifier = data['classifier']
        clf.vectorizer = data['vectorizer']
        clf.mlb = data['mlb']
        clf.classes_ = data['classes']
        clf.evaluation_results = data.get('evaluation_results')
        return clf
