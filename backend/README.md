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

## ML 服务集成

ML 服务由其他人实现，后端已预留接口。ML 服务需要运行在 `http://localhost:5000`：

```bash
# ML 服务需实现以下端点：
# - POST /api/v1/predict      租金预测
# - POST /api/v1/recommend    个性化推荐
# - GET  /api/v1/health       健康检查
```

ML 服务地址可通过环境变量配置：
```bash
ML_SERVICE_URL=http://localhost:5000 mvn spring-boot:run
```

## 技术栈

- Spring Boot 3.2.0 + Java 17
- Spring Security + JWT
- Spring Data JPA + MySQL
- Lombok + Validation
- Swagger/OpenAPI 3.0

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
│           ├── client/
│           ├── dto/
│           └── exception/
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
| GET  | `/api/inquiries/my`         | 获取我的咨询列表   | TENANT          |
| GET  | `/api/inquiries/landlord`   | 获取收到的咨询列表 | LANDLORD        |
| GET  | `/api/inquiries/{id}`       | 获取咨询详情       | 已登录          |

### ML 模块
| 方法 | 端点                | 描述        | 权限   |
| ---- | ------------------- | ----------- | ------ |
| POST | `/api/ml/predict`   | 租金预测    | 已登录 |
| POST | `/api/ml/recommend` | 个性化推荐  | 已登录 |
| GET  | `/api/ml/status`    | ML 服务状态 | 已登录 |

## 角色说明

| 角色     | 描述   | 主要权限                           |
| -------- | ------ | ---------------------------------- |
| tenant   | 租客   | 浏览房源、提交咨询、查看我的咨询   |
| landlord | 房东   | 管理房源、回复咨询、查看收到的咨询 |
| admin    | 管理员 | 用户管理、禁用/启用用户            |
