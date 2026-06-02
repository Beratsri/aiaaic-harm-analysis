import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score, multilabel_confusion_matrix

def evaluate_multilabel(y_true: np.ndarray, y_pred: np.ndarray, classes: list) -> dict:
    """
    Compute multi-label classification metrics.
    """
    metrics = {
        'macro_f1': f1_score(y_true, y_pred, average='macro', zero_division=0),
        'micro_f1': f1_score(y_true, y_pred, average='micro', zero_division=0),
        'weighted_f1': f1_score(y_true, y_pred, average='weighted', zero_division=0),
        'samples_f1': f1_score(y_true, y_pred, average='samples', zero_division=0),
        'macro_precision': precision_score(y_true, y_pred, average='macro', zero_division=0),
        'micro_precision': precision_score(y_true, y_pred, average='micro', zero_division=0),
        'macro_recall': recall_score(y_true, y_pred, average='macro', zero_division=0),
        'micro_recall': recall_score(y_true, y_pred, average='micro', zero_division=0)
    }
    
    # Detailed classification report
    report_dict = classification_report(
        y_true, y_pred, target_names=classes, output_dict=True, zero_division=0
    )
    metrics['class_report'] = report_dict
    
    # Compute confusion matrices per class
    cm = multilabel_confusion_matrix(y_true, y_pred)
    cm_dict = {}
    for i, class_name in enumerate(classes):
        # cm[i] is a 2x2 matrix: [[TN, FP], [FN, TP]]
        cm_dict[class_name] = {
            'tn': int(cm[i][0][0]),
            'fp': int(cm[i][0][1]),
            'fn': int(cm[i][1][0]),
            'tp': int(cm[i][1][1])
        }
    metrics['confusion_matrices'] = cm_dict
    
    return metrics

def print_metrics_summary(metrics: dict, title: str = "Classifier Evaluation"):
    """
    Print a neat summary of the evaluation metrics.
    """
    print(f"\n======================================")
    print(f"  {title}")
    print(f"======================================")
    print(f"Macro F1 Score : {metrics['macro_f1']:.4f}")
    print(f"Micro F1 Score : {metrics['micro_f1']:.4f}")
    print(f"Weighted F1    : {metrics['weighted_f1']:.4f}")
    print(f"Samples F1     : {metrics['samples_f1']:.4f}")
    print(f"Macro Precision: {metrics['macro_precision']:.4f}")
    print(f"Macro Recall   : {metrics['macro_recall']:.4f}")
    print(f"--------------------------------------")
    print(f"{'Class Name':<30} | {'F1-Score':<10} | {'Precision':<10} | {'Recall':<10}")
    print(f"--------------------------------------")
    
    report = metrics['class_report']
    for cls in report:
        if cls in ['macro avg', 'micro avg', 'weighted avg', 'samples avg']:
            continue
        stats = report[cls]
        print(f"{cls:<30} | {stats['f1-score']:<10.4f} | {stats['precision']:<10.4f} | {stats['recall']:<10.4f}")
    print(f"======================================\n")
