# 智能租房系统 - 前端

## 环境要求
- Node.js 18+ 已安装

## 启动

```bash
cd frontend
npm install
npm run dev
```

打开：`http://127.0.0.1:5173/`

## 配置后端地址（联调用）
复制 `.env.example` 为 `.env.local` 并修改：

```bash
VITE_API_BASE_URL=http://localhost:8080
```

然后重启 `npm run dev`。

## 路由与角色
- `/login`、`/register`：公开页
- `/tenant/*`：租客（需要 `tenant` 角色）
- `/landlord/*`：房东（需要 `landlord` 角色）
- `/admin/*`：管理员（需要 `admin` 角色）

## 当前实现说明
- 未启动后端时：Tenant/Landlord/Admin 页面会尝试请求接口，失败则自动使用 mock 数据，方便先做 UI。
- 启动后端后：按接口返回值自动切换为真实数据。

---

## 功能页面

### 租客端（Tenant）
| 路由 | 描述 |
|------|------|
| `/tenant/listings` | 浏览房源列表 |
| `/tenant/listings/:id` | 房源详情 |
| `/tenant/recommendations` | 个性化推荐 |
| `/tenant/inquiries` | 我的咨询 |
| `/tenant/preferences` | 偏好设置 |

### 房东端（Landlord）
| 路由 | 描述 |
|------|------|
| `/landlord/listings` | 我的房源列表 |
| `/landlord/listings/create` | 发布新房源 |
| `/landlord/listings/:id/edit` | 编辑房源 |
| `/landlord/inquiries` | 收到的咨询 |
| `/landlord/price-predict` | 租金预测 |

### 管理员端（Admin）
| 路由 | 描述 |
|------|------|
| `/admin/users` | 用户管理 |
| `/admin/users/:id` | 用户详情 |

---

## ML 功能页面

### 1. 租金预测（房东端）

**路由**：`/landlord/price-predict`

**功能描述**：
- 输入房源特征（卧室数、面积、城市、区域等）
- 调用后端 `/api/ml/predict` 接口
- 显示预测租金、价格区间、置信度
- 展示特征重要性分析

**前端文件**：`src/features/landlord/pages/LandlordPricePredictPage.tsx`

### 2. 个性化推荐（租客端）

**路由**：`/tenant/recommendations`

**功能描述**：
- 设置租房偏好（预算、区域、户型等）
- 调用后端 `/api/ml/recommend` 接口
- 展示匹配分数最高的房源列表
- 显示推荐理由

**前端文件**：`src/features/tenant/pages/TenantRecommendationsPage.tsx`

## 测试账号

| 角色   | 邮箱                    | 密码     |
| ------ | ----------------------- | -------- |
| 房东   | landlord001@example.com | password |
| 租客   | tenant001@example.com   | password |
| 管理员 | admin001@example.com    | password |

## 技术栈

- React 18 + TypeScript
- Vite 5.x（构建工具）
- Ant Design 5.x（UI 组件库）
- TanStack React Query（数据请求与状态管理）
- React Router 6.x（路由管理）
- Axios（HTTP 客户端）

## 项目结构

```
frontend/
├── src/
│   ├── App.tsx                    # 应用入口
│   ├── main.tsx                   # React DOM 渲染
│   ├── app/
│   │   ├── routes.tsx             # 路由配置
│   │   └── shell/
│   │       └── MainLayout.tsx     # 主布局组件
│   ├── features/                  # 功能模块
│   │   ├── auth/                  # 认证模块
│   │   │   ├── api/              # API 调用
│   │   │   ├── components/       # 认证相关组件
│   │   │   ├── context/          # 状态管理
│   │   │   ├── pages/            # 登录/注册页
│   │   │   └── store/            # Zustand Store
│   │   ├── tenant/               # 租客功能
│   │   │   ├── api/              # API 调用
│   │   │   └── pages/            # 房源列表/详情/推荐等
│   │   ├── landlord/             # 房东功能
│   │   │   ├── api/              # API 调用
│   │   │   └── pages/            # 房源管理/价格预测等
│   │   └── admin/                # 管理员功能
│   │       ├── api/              # API 调用
│   │       └── pages/            # 用户管理/房源审核等
│   └── shared/                    # 共享资源
│       ├── api/                   # HTTP 配置、类型定义、Mock 数据
│       ├── ui/                    # 公共 UI 组件
│       └── types/                 # TypeScript 类型定义
├── public/                        # 静态资源
├── package.json
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 配置
└── .env.example                   # 环境变量示例
```
