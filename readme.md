<!--
 * @Author: Mendax
 * @Date: 2026-02-26 16:33:56
 * @LastEditors: Mendax
 * @LastEditTime: 2026-03-01 14:56:33
 * @Description: 
 * @FilePath: \project-main\readme.md
-->
# 快速使用

## 数据库配置

先往数据库内添加数据
数据库脚本位置(project-main\backend\src\main\resources\schema.sql)

## 前后端启用

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
