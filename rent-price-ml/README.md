# 租金预测 ML 服务

基于机器学习的房屋租金预测服务，使用 XGBoost 模型。

## 环境要求

- Python 3.11+
- Conda (推荐)

## 安装

### 1. 创建 conda 环境

```bash
conda create -n rentml python=3.11
conda activate rentml
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

或者使用 conda 安装部分包：

```bash
conda install pandas scikit-learn xgboost
pip install fastapi uvicorn joblib
```

### 3. 训练模型（可选）

如果需要重新训练模型：

```bash
python train.py
```

模型文件将保存在 `models/model.joblib`

## 运行服务

### 方式一：使用 conda 环境

```bash
conda activate rentml
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
```

### 方式二：使用 conda run

```bash
# 激活 rentml 环境并运行
conda run -n rentml python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
```

### Windows PowerShell 示例

```powershell
# 方式1: 先激活环境
conda activate rentml
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000

# 方式2: 使用 conda run
D:\Miniconda3\Scripts\conda.exe run -n rentml python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
```

## API 接口

服务启动后访问：

- 健康检查: http://localhost:5000/api/v1/health
- 预测接口: POST http://localhost:5000/api/v1/predict

### 预测请求示例

```json
{
  "bedrooms": 2,
  "area": 1000,
  "city": "Kolkata",
  "region": "Bandel",
  "bathrooms": 2,
  "propertyType": "Super Area",
  "decoration": "Unfurnished",
  "floor": 1,
  "totalFloors": 5
}
```

### 预测响应示例

```json
{
  "predictedPrice": 15000,
  "currency": "INR",
  "confidence": 0.85,
  "lowerBound": 13500,
  "upperBound": 16500,
  "modelVersion": "1.0",
  "algorithmName": "RandomForest",
  "featureImportance": [
    {"feature": "Size", "importance": 0.35},
    {"feature": "City", "importance": 0.25},
    {"feature": "BHK", "importance": 0.20},
    {"feature": "Bathroom", "importance": 0.10},
    {"feature": "Floor", "importance": 0.10}
  ],
  "responseTimeMs": 50
}
```

## 项目结构

```
rent-price-ml/
├── app/
│   ├── main.py          # FastAPI 服务入口
│   └── model.py        # 模型加载和预测
├── data/
│   └── house_rent.csv  # 训练数据
├── models/
│   └── model.joblib    # 训练好的模型
├── train.py            # 模型训练脚本
└── requirements.txt    # Python 依赖
```

## 预测特征说明

模型使用的特征：

| 特征 | 说明 | 示例 |
|------|------|------|
| bedrooms | 卧室数量 | 2 |
| bathrooms | 卫生间数量 | 1 |
| area | 面积(平方英尺) | 1000 |
| city | 城市 | Kolkata, Mumbai, Delhi |
| region | 小区/区域 | Bandel |
| propertyType | 面积类型 | Super Area, Carpet Area |
| decoration | 装修状态 | Furnished, Unfurnished |
| floor | 当前楼层 | 1 |
| totalFloors | 总楼层数 | 5 |

## 故障排除

### 端口被占用

如果端口 5000 被占用：

```bash
# 查看占用端口的进程
netstat -ano | findstr :5000

# 使用其他端口
python -m uvicorn app.main:app --port 5001
```

### 模型文件不存在

运行训练脚本生成模型：

```bash
python train.py
```
