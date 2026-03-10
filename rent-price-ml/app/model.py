import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join("models", "model.joblib")

_model = None

def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found: {MODEL_PATH}. Please run train.py first.")
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_one(record: dict) -> float:
    """
    record: 单条样本的特征字典（不包含 Rent）
    return: 预测租金（float）
    """
    model = get_model()
    df = pd.DataFrame([record])  # 变成 1 行 DataFrame
    pred = model.predict(df)[0]
    return float(pred)