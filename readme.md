<!--
 * @Author: Mendax
 * @Date: 2026-02-26 16:33:56
 * @LastEditors: Mendax
 * @LastEditTime: 2026-03-14
 * @Description: 智能租房系统
 * @FilePath: \project-main\readme.md
-->
# 智能租房系统

## 项目简介

一个完整的智能租房平台，包含前端、后端和机器学习模块，支持房源管理、用户咨询、AI 智能回复等功能。

---

## 一、快速启动

### 环境要求

- **后端**: Java 17+, Maven 3.9+
- **前端**: Node.js 20.19+ 或 22.12+
- **数据库**: MySQL 8.0 (已在远程服务器运行)
- **ML 模块**: Python 3.8+
- **AI 服务** (可选): Ollama (本地免费模型)

### 前后端启动

```bash
# 前端
cd frontend
npm install
npm run dev

# 后端
cd backend
mvn clean install
mvn spring-boot:run
```

或使用已编译的 jar:
```bash
java -jar target\house-rental-backend-1.5.0.jar
```

**前端地址**: http://localhost:5173
**后端地址**: http://localhost:8080/api

### 一键启动 (Windows PowerShell)

```powershell
.\start.ps1
```

---

## 二、ML 模块配置

```bash
# 创建虚拟环境
python -m venv venv
# 激活
venv\Scripts\activate
# 安装依赖
pip install -r requirements.txt

# ml
cd rent-price-ml
python app/main.py
```

---

## 三、数据库配置

先往数据库内添加数据，数据库脚本位置: `backend/src/main/resources/schema.sql`

---

## 四、AI 功能配置 (可选)

### 使用 Ollama (本地免费)

1. 下载安装 Ollama: https://ollama.com
2. 启动并下载模型:
   ```bash
   ollama serve 
   ollama pull qwen3:4b
   ```
3. 配置 `backend/src/main/resources/application.yml`:
   ```yaml
   app:
     ai:
       enabled: true
       provider: ollama
       model: qwen3:4b
       ollama-url: http://localhost:11434
   ```

### 使用 DeepSeek API (付费)

```yaml
app:
  ai:
    enabled: true
    provider: openai
    model: deepseek-chat
    api:
      key: your-api-key
      url: https://api.deepseek.com/v1/chat/completions
```

---

## 五、项目结构

```
project-main/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/          # Java 源代码
│   │   └── com/rental/
│   │       ├── modules/        # 业务模块
│   │       │   ├── ai/         # AI 功能
│   │       │   ├── auth/       # 认证
│   │       │   ├── property/   # 房源
│   │       │   └── user/       # 用户
│   │       ├── config/         # 配置
│   │       └── security/       # 安全
│   ├── src/main/resources/
│   │   └── application.yml    # 应用配置
│   └── target/                 # 编译输出
│
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── features/           # 功能模块
│   │   ├── shared/             # 共享组件
│   │   └── i18n/               # 国际化
│   └── package.json
│
└── rent-price-ml/              # ML 价格预测模块
    ├── app/
    └── requirements.txt
```

---

## 六、技术栈

### 后端
- Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA (Hibernate)
- MySQL 8.0
- Maven

### 前端
- React 18
- TypeScript
- Vite
- Ant Design
- React Query
- React Router
- i18next (国际化)

### ML
- Python
- 机器学习模型

### AI
- Ollama (本地) / DeepSeek API (云端)
- Qwen3 / GPT 模型

---

## 七、常用命令

### Maven

```bash
# 编译
mvn compile

# 打包
mvn clean package -DskipTests

# 启动
mvn spring-boot:run -DskipTests

# 停止
taskkill /F /IM java.exe
```

### NPM

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产
npm run build
```

---

## 八、常见问题

### 1. 端口被占用

```powershell
# 查找占用端口的进程
netstat -ano | Select-String ":8080"

# 终止进程
Stop-Process -Id <进程ID> -Force
```

### 2. Node 版本过低

错误: `Vite requires Node.js version 20.19+`

解决: 升级 Node.js 或使用 nvm 切换版本

### 3. Maven 下载依赖慢

解决: 配置国内 Maven 镜像源，或使用 VPN

---

## 九、API 文档

启动后端后可访问:

- Swagger UI: http://localhost:8080/api/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api/v3/api-docs

---

## 十、功能说明

### 租户咨询 AI 智能回复

当租客与房东咨询房源时，可以点击「AI 智能回复」按钮获取回复建议。AI 会根据：
- 房源标题、价格、描述
- 对话历史
生成精准的回复建议。

---

## 十一、项目计划

- [ ] Todo: 1. 添加个人页面（实现租客/房东个人信息展示和修改）
- [ ] Todo：4. 添加管理页面（实现已租房源管理，如报修、续租等）
- [ ] Todo：咨询聊天页面图片发送
- [ ] 合同页面和流程实现
- [ ] 全流程实现

---

*最后更新: 2026-03-14*
