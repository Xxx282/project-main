# 智能租房系统

完整的智能租房平台，包含前端、后端和机器学习模块，支持房源管理、用户咨询、AI 智能回复等功能。

---

## 快速启动

### 环境要求

- **后端**: Java 17+, Maven 3.9+
- **前端**: Node.js 20.19+ 或 22.12+
- **数据库**: MySQL 8.0
- **ML 模块**: Python 3.8+
- **AI 服务** (可选): Ollama

### 启动命令

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

或直接运行已编译的 jar:
```bash
java -jar target\house-rental-backend-1.5.0.jar
```

**前端地址**: http://localhost:5173  
**后端地址**: http://localhost:8080/api

> Windows 可执行 `.\start.ps1` 一键启动

---

## ML 模块

```bash
cd rent-price-ml
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app/main.py
```

---

## AI 功能配置 (可选)

### Ollama (本地免费)

1. 下载安装: https://ollama.com
2. 启动服务并下载模型:
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

### DeepSeek API (付费)

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

## 项目结构

```
project-main/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/          # Java 源代码
│   └── src/main/resources/
│       └── application.yml
│
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── features/           # 功能模块
│   │   ├── shared/             # 共享组件
│   │   └── i18n/               # 国际化
│   └── package.json
│
└── rent-price-ml/              # ML 价格预测模块
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 后端 | Spring Boot 3.2, Spring Security + JWT, Spring Data JPA, MySQL 8.0 |
| 前端 | React 18, TypeScript, Vite, Ant Design, React Query, React Router |
| ML | Python, 机器学习模型 |
| AI | Ollama / DeepSeek API |

---

## 常用命令

### Maven
```bash
mvn clean package -DskipTests    # 打包
mvn spring-boot:run -DskipTests # 启动
```

### NPM
```bash
npm install   # 安装依赖
npm run dev   # 开发模式
npm run build # 生产构建
```

---

## 常见问题

**端口被占用**
```powershell
netstat -ano | Select-String ":8080"
Stop-Process -Id <PID> -Force
```

**Node 版本过低**: 升级 Node.js 或使用 nvm 切换版本

**Maven 下载慢**: 配置国内 Maven 镜像源

---

## API 文档

启动后端后访问:
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api/v3/api-docs
