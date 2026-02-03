# 智能租房系统 - 后端

## 环境要求
- JDK 17 或以上
- Maven 3.6+
- MySQL 8.0 或以上

## 启动

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

打开：`http://localhost:8080/api`

## 配置数据库

确保 MySQL 中已创建数据库：
```sql
CREATE DATABASE house_rental_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

初始化数据表：
```bash
mysql -u root -p house_rental_system < src/main/resources/schema.sql
```

## 配置（可选）

复制 `application.yml` 并修改以下配置项：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/house_rental_system
    username: root
    password: your_password  # 修改为你的 MySQL 密码

app:
  jwt:
    secret: your_jwt_secret_key  # 修改为更安全的密钥（至少256位）
```

## API 文档

启动后访问 Swagger UI：
- Swagger UI：`http://localhost:8080/swagger-ui.html`
- OpenAPI JSON：`http://localhost:8080/v3/api-docs`

## 测试账号

| 角色   | 邮箱                    | 密码     |
| ------ | ----------------------- | -------- |
| 房东   | landlord001@example.com | password |
| 租客   | tenant001@example.com   | password |
| 管理员 | admin001@example.com    | password |

## 联调前端

前端请求后端地址配置：
```bash
# 在 frontend 目录下
cp .env.example .env.local
# 修改 VITE_API_BASE_URL=http://localhost:8080
```

---

## ML 服务集成

### 概述

后端已完整集成机器学习服务，提供**租金预测**和**个性化推荐**两大核心功能。ML 服务需要单独部署运行。

### ML 服务地址配置

ML 服务地址可通过 `application.yml` 或环境变量配置：

**方式一：修改配置文件**
```yaml
ml:
  service:
    url: http://localhost:5000  # ML 服务地址
    timeout: 30000              # 请求超时时间（毫秒）
```

**方式二：环境变量**
```bash
ML_SERVICE_URL=http://localhost:5000 mvn spring-boot:run
```

### ML 服务 API 接口

ML 服务需要实现以下 REST API 端点：

#### 1. 租金预测
- **端点**：`POST /api/v1/predict`
- **描述**：基于房源特征预测租金价格
- **请求体**：
```json
{
  "bedrooms": 2,           // 必填：卧室数量
  "area": 80.0,           // 必填：面积（平方米）
  "city": "北京",          // 必填：城市
  "region": "朝阳区",       // 区域
  "bathrooms": 1.5,       // 可选：卫生间数量
  "propertyType": "公寓",   // 可选：房屋类型
  "decoration": "精装",     // 可选：装修情况
  "floor": 5,             // 可选：楼层
  "totalFloors": 20,      // 可选：总楼层
  "orientation": "南",      // 可选：朝向
  "hasParking": true,     // 可选：是否有停车位
  "hasElevator": true,    // 可选：是否有电梯
  "hasBalcony": true      // 可选：是否有阳台
}
```
- **响应体**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "predictedPrice": 6500.00,
    "currency": "CNY",
    "confidence": 0.92,
    "lowerBound": 6000.00,
    "upperBound": 7000.00,
    "modelVersion": "v1.2.0",
    "algorithmName": "XGBoost",
    "featureImportance": [
      {"feature": "area", "importance": 0.35},
      {"feature": "bedrooms", "importance": 0.25},
      {"feature": "city", "importance": 0.20}
    ],
    "responseTimeMs": 156
  }
}
```

#### 2. 个性化推荐
- **端点**：`POST /api/v1/recommend`
- **描述**：基于用户偏好推荐房源
- **请求体**：
```json
{
  "userId": 7,                     // 用户ID
  "budgetMin": 3000,                // 预算下限
  "budgetMax": 8000,               // 预算上限
  "preferredRegions": ["朝阳区", "海淀区"],  // 偏好区域
  "minBedrooms": 2,                 // 最少卧室数
  "maxBedrooms": 3,                 // 最多卧室数
  "minArea": 50.0,                  // 最小面积
  "maxArea": 100.0,                 // 最大面积
  "propertyTypes": ["公寓", "小区"],  // 房屋类型偏好
  "limit": 10,                      // 返回数量限制
  "excludeListingIds": [1, 2, 3]    // 排除的房源ID
}
```
- **响应体**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "recommendations": [
      {
        "listingId": 1001,
        "title": "朝阳公园附近精装两居室",
        "predictedMatchScore": 0.95,
        "predictedRent": 5500.00,
        "reason": "符合您的预算和区域偏好，交通便利"
      }
    ],
    "totalCount": 5,
    "modelVersion": "v1.2.0"
  }
}
```

#### 3. 健康检查
- **端点**：`GET /api/v1/health`
- **描述**：检查 ML 服务是否可用
- **响应**：`200 OK` 表示服务可用

### 后端 ML API 端点

后端为前端提供了以下 REST API：

| 方法 | 端点                | 描述          | 权限              |
| ---- | ------------------- | ------------- | ----------------- |
| POST | `/api/ml/predict`   | 租金预测      | TENANT/LANDLORD/ADMIN |
| POST | `/api/ml/recommend` | 个性化推荐    | TENANT/LANDLORD/ADMIN |
| GET  | `/api/ml/status`    | ML 服务状态   | 已登录            |

### 启动 ML 服务（示例）

```bash
# 假设 ML 服务使用 Python/Flask 实现
cd ml-service
pip install -r requirements.txt
python app.py
```

ML 服务默认运行在 `http://localhost:5000`。

### 错误处理

| 错误码 | 说明                          |
| ------ | ----------------------------- |
| 400    | 请求参数错误                   |
| 500    | ML 服务不可用或内部错误        |
| 501    | ML 功能未实现                  |

当 ML 服务不可用时，后端会返回 500 错误，前端应提供友好的错误提示。

---

## 技术栈

- Spring Boot 3.2.0 + Java 17
- Spring Security + JWT
- Spring Data JPA + MySQL
- Lombok + Validation
- Swagger/OpenAPI 3.0
- RestTemplate（ML 服务客户端）

## 项目结构

```
backend/
├── pom.xml
├── src/main/java/com/rental/
│   ├── RentalApplication.java       # 启动类
│   ├── config/                     # 配置类
│   │   ├── SecurityConfig.java     # 安全配置
│   │   ├── MlServiceConfig.java   # ML 服务配置
│   │   └── SwaggerConfig.java      # API 文档配置
│   ├── common/                     # 通用模块
│   │   ├── Result.java            # 统一响应
│   │   ├── ResultCode.java        # 响应状态码
│   │   └── exception/             # 异常处理
│   │       ├── BusinessException.java
│   │       └── MlServiceException.java
│   ├── security/                  # 安全模块
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── JwtTokenProvider.java
│   │   └── UserDetailsServiceImpl.java
│   └── modules/                   # 业务模块
│       ├── auth/                  # 认证模块
│       │   ├── controller/
│       │   ├── service/
│       │   └── entity/
│       ├── user/                  # 用户模块
│       │   ├── controller/
│       │   ├── service/
│       │   ├── entity/
│       │   └── repository/
│       ├── property/              # 房源模块
│       │   ├── controller/
│       │   ├── service/
│       │   ├── entity/
│       │   └── repository/
│       ├── inquiry/              # 咨询模块
│       │   ├── controller/
│       │   ├── service/
│       │   ├── entity/
│       │   └── repository/
│       └── ml/                   # ML 服务接口
│           ├── controller/       # ML API 控制器
│           ├── service/          # ML 服务层
│           ├── client/          # ML 客户端实现
│           ├── dto/             # 数据传输对象
│           └── exception/       # ML 异常定义
└── src/main/resources/
    ├── application.yml            # 应用配置
    └── schema.sql                 # 数据库脚本
```

## API 端点

### 认证模块
| 方法 | 端点                 | 描述         | 权限   |
| ---- | -------------------- | ------------ | ------ |
| POST | `/api/auth/login`    | 用户登录     | 公开   |
| POST | `/api/auth/register` | 用户注册     | 公开   |
| GET  | `/api/auth/me`       | 获取当前用户 | 已登录 |

### 用户模块
| 方法 | 端点                      | 描述                 | 权限   |
| ---- | ------------------------- | -------------------- | ------ |
| GET  | `/api/users`              | 获取所有用户列表     | ADMIN  |
| GET  | `/api/users/{id}`         | 根据ID获取用户信息   | 已登录 |
| GET  | `/api/users/role/{role}`  | 根据角色获取用户列表 | ADMIN  |
| GET  | `/api/users/active`       | 获取已激活用户列表   | ADMIN  |
| PUT  | `/api/users/{id}/disable` | 禁用用户             | ADMIN  |
| PUT  | `/api/users/{id}/enable`  | 启用用户             | ADMIN  |
| GET  | `/api/users/profile`      | 获取当前用户信息     | 已登录 |

### 房源模块
| 方法   | 端点                        | 描述                     | 权限     |
| ------ | --------------------------- | ------------------------ | -------- |
| GET    | `/api/listings`             | 获取房源列表（支持筛选） | 公开     |
| GET    | `/api/listings/{id}`        | 获取房源详情             | 公开     |
| GET    | `/api/listings/mine`        | 获取我的房源列表         | LANDLORD |
| POST   | `/api/listings`             | 创建房源                 | LANDLORD |
| PUT    | `/api/listings/{id}`        | 更新房源                 | LANDLORD |
| DELETE | `/api/listings/{id}`        | 删除房源                 | LANDLORD |
| PATCH  | `/api/listings/{id}/status` | 更新房源状态             | LANDLORD |
| GET    | `/api/listings/available`   | 获取可租房源列表         | 公开     |

### 咨询模块
| 方法 | 端点                        | 描述               | 权限            |
| ---- | --------------------------- | ------------------ | --------------- |
| POST | `/api/inquiries`            | 提交咨询           | TENANT          |
| POST | `/api/inquiries/{id}/reply` | 回复咨询           | LANDLORD        |
| POST | `/api/inquiries/{id}/close` | 关闭咨询           | LANDLORD/TENANT |
| GET  | `/api/inquiries/my`          | 获取我的咨询列表   | TENANT          |
| GET  | `/api/inquiries/landlord`    | 获取收到的咨询列表 | LANDLORD        |
| GET  | `/api/inquiries/{id}`       | 获取咨询详情       | 已登录          |

### ML 模块
| 方法 | 端点                | 描述        | 权限              |
| ---- | ------------------- | ----------- | ----------------- |
| POST | `/api/ml/predict`   | 租金预测    | TENANT/LANDLORD/ADMIN |
| POST | `/api/ml/recommend` | 个性化推荐  | TENANT/LANDLORD/ADMIN |
| GET  | `/api/ml/status`    | ML 服务状态 | 已登录            |

## 角色说明

| 角色     | 描述   | 主要权限                           |
| -------- | ------ | ---------------------------------- |
| tenant   | 租客   | 浏览房源、提交咨询、查看我的咨询   |
| landlord | 房东   | 管理房源、回复咨询、查看收到的咨询 |
| admin    | 管理员 | 用户管理、禁用/启用用户            |
