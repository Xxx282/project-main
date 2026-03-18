from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from model import predict_one, get_feature_importance, predict_with_confidence
import time
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rent Price Prediction API", version="1.0")


class RentFeatures(BaseModel):
    Posted_On: str
    BHK: int
    Size: int
    Floor: str
    Area_Type: str
    Area_Locality: str
    City: str
    Furnishing_Status: str
    Tenant_Preferred: str
    Bathroom: int
    Point_of_Contact: str


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/v1/health")
def api_v1_health():
    return {"status": "ok"}


class NewPredictRequest(BaseModel):
    bedrooms: int = Field(..., ge=0, le=20, description="Number of bedrooms")
    area: float = Field(..., gt=0, description="Area in square meters")
    city: str = Field(..., min_length=1, description="City name")
    region: str = Field(default=None, description="Region or district")
    bathrooms: float = Field(default=1, ge=0, le=20, description="Number of bathrooms")
    propertyType: str = Field(default="Apartment", description="Property type: Apartment, House, Villa, etc.")
    decoration: str = Field(default="Unfurnished", description="Decoration status: Unfurnished, Furnished, Semi-Furnished")
    floor: int = Field(default=1, ge=0, description="Floor number")
    totalFloors: int = Field(default=10, ge=1, description="Total floors in the building")
    orientation: str = Field(default="North", description="Orientation: North, South, East, West")
    hasParking: bool = Field(default=False, description="Has parking space")
    hasElevator: bool = Field(default=False, description="Has elevator")
    hasBalcony: bool = Field(default=False, description="Has balcony")

    @field_validator('city', 'propertyType', 'decoration', 'orientation')
    @classmethod
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "bedrooms": 2,
                    "area": 80.0,
                    "city": "Shanghai",
                    "region": "Pudong",
                    "bathrooms": 1,
                    "propertyType": "Apartment",
                    "decoration": "Furnished",
                    "floor": 5,
                    "totalFloors": 20,
                    "orientation": "South",
                    "hasParking": True,
                    "hasElevator": True,
                    "hasBalcony": True
                }
            ]
        }
    }


def map_property_type_to_furnishing(prop_type: str, decoration: str) -> str:
    """根据装修状态直接返回（保持与训练数据一致）"""
    decoration_lower = decoration.lower()

    # 直接返回原始值，与训练数据一致
    if decoration_lower in ["rough", "simple", "fine", "luxury"]:
        return decoration_lower

    # 兼容其他格式
    if "furnished" in decoration_lower:
        return "fine"  # Furnished -> fine
    elif "semi" in decoration_lower:
        return "simple"  # Semi-Furnished -> simple
    else:
        return "rough"  # Unfurnished -> rough


def map_property_type_to_area_type(prop_type: str) -> str:
    """根据房产类型映射到面积类型"""
    prop_type_lower = prop_type.lower()

    if "villa" in prop_type_lower:
        return "Villa"
    elif "house" in prop_type_lower:
        return "House"
    else:
        return "Apartment"


def get_floor_level(total_floors: int) -> str:
    """根据总楼层数确定楼层等级"""
    if total_floors <= 8:
        return 'low'
    elif total_floors <= 20:
        return 'mid'
    else:
        return 'high'


@app.post("/api/v1/predict")
def api_v1_predict(payload: NewPredictRequest):
    start_time = int(time.time() * 1000)

    try:
        # Map request fields to match training data columns
        decoration_value = map_property_type_to_furnishing(
            payload.propertyType,
            payload.decoration
        )
        area_type = map_property_type_to_area_type(payload.propertyType)
        floor_level = get_floor_level(payload.totalFloors)

        # 构建预测记录
        record = {
            "landlord_id": 1,
            "title": f"{payload.propertyType} in {payload.city}",
            "city": payload.city,
            "region": payload.region or payload.city,
            "address": payload.region or payload.city,
            "bedrooms": payload.bedrooms,
            "bathrooms": int(payload.bathrooms),
            "area": payload.area,
            "price": 0,
            "total_floors": payload.totalFloors,
            "floor_level": floor_level,
            "orientation": payload.orientation,
            "decoration": decoration_value,
            "description": f"Floor {payload.floor}/{payload.totalFloors}, "
                          f"Parking: {payload.hasParking}, "
                          f"Elevator: {payload.hasElevator}, "
                          f"Balcony: {payload.hasBalcony}",
            "status": "available",
            "view_count": 0,
            "created_at": time.strftime("%Y-%m-%d"),
        }

        # 执行预测
        pred = predict_one(record)

        # 获取带置信区间的预测结果
        confidence_result = predict_with_confidence(record)

        # 获取特征重要性
        raw_importance = get_feature_importance()

        # 将展开的特征名聚合回原始特征
        aggregated_importance = aggregate_feature_importance(raw_importance)

        # 排序并取Top 5
        sorted_importance = sorted(
            aggregated_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        feature_importance_list = [
            {"feature": name, "importance": round(importance, 4)}
            for name, importance in sorted_importance
        ]

        response_time = int(time.time() * 1000) - start_time

        return {
            "predictedPrice": round(pred, 2),
            "currency": "CNY",
            "confidence": 0.85,
            "lowerBound": round(confidence_result["lower_bound"], 2),
            "upperBound": round(confidence_result["upper_bound"], 2),
            "modelVersion": "1.0",
            "algorithmName": "XGBoost",
            "featureImportance": feature_importance_list,
            "responseTimeMs": response_time
        }

    except FileNotFoundError as e:
        logger.error(f"Model file not found: {e}")
        raise HTTPException(status_code=503, detail="Model not available. Please train the model first.")
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


def aggregate_feature_importance(raw_importance: dict) -> dict:
    """
    将OneHotEncoder展开后的特征重要性聚合回原始特征。
    例如：city_Shanghai, city_Beijing -> city
    """
    aggregated = {}

    for feature_name, importance in raw_importance.items():
        # 查找下划线分隔的类别特征前缀
        if '_' in feature_name:
            # 尝试找到原始特征名
            parts = feature_name.rsplit('_', 1)
            if len(parts) == 2:
                prefix, suffix = parts
                # 检查是否是已知的类别特征
                if prefix in ["city", "region", "decoration", "orientation", "area_type", "floor_level"]:
                    if prefix not in aggregated:
                        aggregated[prefix] = 0
                    aggregated[prefix] += importance
                    continue
                elif suffix.isdigit():
                    # 可能是数字特征（如 bedrooms_0 等）
                    if prefix not in aggregated:
                        aggregated[prefix] = 0
                    aggregated[prefix] += importance
                    continue

        # 非展开特征直接保留
        if feature_name not in aggregated:
            aggregated[feature_name] = importance

    return aggregated


@app.post("/predict")
def predict(payload: RentFeatures):
    record = {
        "Posted On": payload.Posted_On,
        "BHK": payload.BHK,
        "Size": payload.Size,
        "Floor": payload.Floor,
        "Area Type": payload.Area_Type,
        "Area Locality": payload.Area_Locality,
        "City": payload.City,
        "Furnishing Status": payload.Furnishing_Status,
        "Tenant Preferred": payload.Tenant_Preferred,
        "Bathroom": payload.Bathroom,
        "Point of Contact": payload.Point_of_Contact,
    }

    try:
        pred = predict_one(record)
        return {"ok": True, "predicted_rent": float(pred)}
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail="Model not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
