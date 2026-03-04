import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

from sklearn.linear_model import Ridge
from xgboost import XGBRegressor


DATA_PATH = "data/house_rent.csv"
TARGET_COL = "Rent"
MODEL_PATH = "models/model.joblib"


def build_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    numeric_features = X.select_dtypes(include=["number"]).columns.tolist()
    categorical_features = X.select_dtypes(exclude=["number"]).columns.tolist()

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])

    return ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ]
    )


def eval_regression(y_true, y_pred, title: str):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = mean_squared_error(y_true, y_pred) ** 0.5
    r2 = r2_score(y_true, y_pred)
    print(f"\n=== {title} ===")
    print(f"MAE : {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2  : {r2:.4f}")


def main():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"找不到数据文件：{DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    if TARGET_COL not in df.columns:
        raise ValueError(f"目标列 {TARGET_COL} 不存在。当前列：{df.columns.tolist()}")

    # X / y
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]

    # 你这份数据里 Posted On 是日期字符串，先作为类别特征处理也能跑；
    # 后面优化阶段我们会把它拆成 year/month/day 等更合理特征
    preprocessor = build_preprocessor(X)

    # split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 1) Baseline：Ridge（很适合做“对比实验”）
    baseline = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("model", Ridge(alpha=1.0, random_state=42)),
    ])
    baseline.fit(X_train, y_train)
    baseline_pred = baseline.predict(X_test)
    eval_regression(y_test, baseline_pred, "Baseline (Ridge)")

    # 2) Strong model：XGBoost
    xgb = Pipeline(steps=[
        ("preprocess", preprocessor),
        ("model", XGBRegressor(
            n_estimators=800,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            n_jobs=-1,
            reg_lambda=1.0
        )),
    ])
    xgb.fit(X_train, y_train)
    xgb_pred = xgb.predict(X_test)
    eval_regression(y_test, xgb_pred, "XGBoost")

    # 保存强模型（用来部署）
    os.makedirs("models", exist_ok=True)
    joblib.dump(xgb, MODEL_PATH)
    print(f"\n✅ Saved model to: {MODEL_PATH}")


if __name__ == "__main__":
    main()