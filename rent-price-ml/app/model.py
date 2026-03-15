import os
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = os.path.join("models", "model.joblib")

_model = None
_feature_names = None


def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found: {MODEL_PATH}. Please run train.py first.")
        _model = joblib.load(MODEL_PATH)
    return _model


def get_feature_names():
    """
    获取训练时使用的特征名称。
    注意：对于包含OneHotEncoder的pipeline，特征名会被展开。
    """
    global _feature_names
    if _feature_names is not None:
        return _feature_names

    model = get_model()

    # 从preprocessor获取原始特征名
    preprocessor = model.named_steps['preprocess']
    feature_names = []

    # 获取数值特征名
    numeric_features = preprocessor.named_transformers_['num'].feature_names_in_ \
        if hasattr(preprocessor.named_transformers_['num'], 'feature_names_in_') \
        else []
    if hasattr(numeric_features, 'tolist'):
        feature_names.extend(numeric_features.tolist())
    else:
        feature_names.extend(list(numeric_features))

    # 获取类别特征名（经过OneHotEncoder后的展开名称）
    categorical_transformer = preprocessor.named_transformers_['cat']
    if hasattr(categorical_transformer, 'feature_names_out'):
        cat_features = categorical_transformer.feature_names_out_
        if hasattr(cat_features, 'tolist'):
            feature_names.extend(cat_features.tolist())
        else:
            feature_names.extend(list(cat_features))

    _feature_names = feature_names
    return _feature_names


def get_feature_importance():
    """
    获取模型的特征重要性。
    返回一个字典，key是特征名，value是重要性分数。
    """
    model = get_model()

    # XGBoost模型有feature_importances_属性
    if hasattr(model.named_steps['model'], 'feature_importances_'):
        importances = model.named_steps['model'].feature_importances_

        # 获取展开后的特征名
        feature_names = get_feature_names()

        # 如果特征名数量不匹配，使用默认命名
        if len(feature_names) != len(importances):
            feature_names = [f"feature_{i}" for i in range(len(importances))]

        importance_dict = dict(zip(feature_names, importances.tolist()))
        return importance_dict

    return {}


def predict_one(record: dict) -> float:
    """
    record: 单条样本的特征字典（不包含 Rent）
    return: 预测租金（float）
    """
    model = get_model()
    df = pd.DataFrame([record])  # 变成 1 行 DataFrame
    pred = model.predict(df)[0]
    return float(pred)


def predict_with_confidence(record: dict) -> dict:
    """
    带置信区间的预测
    返回预测值和置信区间
    """
    pred = predict_one(record)

    # 基于预测值计算一个简单的置信区间
    # 实际项目中可以使用交叉验证或Bootstrap方法来计算更准确的区间
    pred_value = float(pred)
    uncertainty = pred_value * 0.1  # 10%的不确定性

    return {
        "prediction": pred_value,
        "lower_bound": pred_value - uncertainty,
        "upper_bound": pred_value + uncertainty,
        "uncertainty": uncertainty
    }