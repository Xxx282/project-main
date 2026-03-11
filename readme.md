<!--
 * @Author: Mendax
 * @Date: 2026-02-26 16:33:56
 * @LastEditors: Mendax
 * @LastEditTime: 2026-03-09 23:28:04
 * @Description: 
 * @FilePath: \project-main\readme.md
-->
# 智能租房

## 快速使用

### ML模块配置

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

### 数据库配置

先往数据库内添加数据
数据库脚本位置(project-main\backend\src\main\resources\schema.sql)

### 前后端启用

```bash
# frontend
cd frontend
npm install
npm run dev

# backend
cd backend
mvn clean install
mvn spring-boot:run
```

## 项目计划

- [ ] Todo: 1. 添加个人页面（实现租客/房东个人信息展示和修改）
- [ ] Todo：4. 添加管理页面（实现已租房源管理，如报修、续租等）
- [ ] Todo：5. 添加辅助功能（如邮箱检验、平台支付、邮箱通知等）
- [ ] Todo：咨询聊天页面图片发送
- [ ] 合同页面和流程实现

- [ ] 全流程实现
