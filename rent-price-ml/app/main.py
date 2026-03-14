from fastapi import FastAPI
from pydantic import BaseModel
from model import predict_one
import time
import uvicorn

app = FastAPI(title="Rent Price Prediction API", version="1.0")


class RentFeatures(BaseModel):
    # 这里的字段名必须和你的 CSV 特征列一致（除了 Rent）
    # 你的列是：
    # 'Posted On', 'BHK', 'Size', 'Floor', 'Area Type', 'Area Locality',
    # 'City', 'Furnishing Status', 'Tenant Preferred', 'Bathroom', 'Point of Contact'
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
    bedrooms: int
    area: float
    city: str
    region: str = None
    bathrooms: float = 1
    propertyType: str = "Apartment"
    decoration: str = "Unfurnished"
    floor: int = 1
    totalFloors: int = 10
    orientation: str = "North"
    hasParking: bool = False
    hasElevator: bool = False
    hasBalcony: bool = False


@app.post("/api/v1/predict")
def api_v1_predict(payload: NewPredictRequest):
    start_time = int(time.time() * 1000)
    
    # Map new request fields to existing record dict
    record = {
        "Posted On": time.strftime("%Y-%m-%d"),
        "BHK": payload.bedrooms,
        "Size": int(payload.area),
        "Floor": f"{payload.floor} out of {payload.totalFloors}",
        "Area Type": payload.propertyType,
        "Area Locality": payload.region or "Unknown",
        "City": payload.city,
        "Furnishing Status": payload.decoration,
        "Tenant Preferred": "Family",
        "Bathroom": int(payload.bathrooms),
        "Point of Contact": "Contact Owner",
    }
    
    pred = predict_one(record)
    
    # Calculate confidence and bounds (simplified)
    confidence = 0.85
    lower_bound = pred * 0.9
    upper_bound = pred * 1.1
    
    response_time = int(time.time() * 1000) - start_time
    
    return {
        "predictedPrice": pred,
        "currency": "CNY",
        "confidence": confidence,
        "lowerBound": lower_bound,
        "upperBound": upper_bound,
        "modelVersion": "1.0",
        "algorithmName": "RandomForest",
        "featureImportance": [
            {"feature": "Size", "importance": 0.35},
            {"feature": "City", "importance": 0.25},
            {"feature": "BHK", "importance": 0.20},
            {"feature": "Bathroom", "importance": 0.10},
            {"feature": "Floor", "importance": 0.10}
        ],
        "responseTimeMs": response_time
    }


@app.post("/predict")
def predict(payload: RentFeatures):
    # 把字段名映射回原始列名
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

    pred = predict_one(record)
    return {"ok": True, "predicted_rent": pred}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)