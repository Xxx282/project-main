# Payment Monitor API

支付宝支付监控服务

## 启动服务

```bash
# 安装依赖
cd payment/app
pip install -r requirements.txt

# 启动服务
python main.py
```

或使用 uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 5001
```

## API 接口

### 健康检查

```bash
GET /health
GET /api/v1/health
```

### 启动监控

```bash
POST /api/v1/monitor/start

Request:
{
    "orderNo": "PAY202603151234567890",
    "amount": 100.00,
    "timeoutSeconds": 300
}

Response:
{
    "monitorId": "monitor_PAY202603151234567890_1234567890",
    "orderNo": "PAY202603151234567890",
    "amount": 100.00,
    "timeoutSeconds": 300,
    "status": "PENDING",
    "message": "监控已启动，请轮询状态接口获取结果"
}
```

### 获取监控状态

```bash
GET /api/v1/monitor/status/{monitor_id}

Response:
{
    "monitorId": "monitor_PAY202603151234567890_1234567890",
    "orderNo": "PAY202603151234567890",
    "amount": 100.00,
    "status": "MONITORING",
    "startTime": 1234567890000,
    "endTime": null,
    "checkCount": 5,
    "errorMessage": null,
    "paymentData": null
}
```

状态说明:
- `PENDING`: 等待启动
- `STARTING`: 正在启动
- `WAITING_LOGIN`: 等待登录
- `MONITORING`: 监控中
- `SUCCESS`: 支付成功
- `TIMEOUT`: 超时
- `ERROR`: 错误
- `STOPPED`: 已停止

### 停止监控

```bash
POST /api/v1/monitor/stop/{monitor_id}
```

## 与后端集成

后端可以通过 HTTP 调用此服务:

```java
// 启动监控
String monitorId = restTemplate.postForObject(
    "http://localhost:5001/api/v1/monitor/start",
    request,
    StartMonitorResponse.class
).getMonitorId();

// 轮询状态
while (true) {
    StatusResponse status = restTemplate.getForObject(
        "http://localhost:5001/api/v1/monitor/status/" + monitorId,
        StatusResponse.class
    );
    
    if ("SUCCESS".equals(status.getStatus())) {
        break;
    }
    
    Thread.sleep(5000);
}
```
