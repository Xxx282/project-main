# 智能租房系统 - 前端

## 环境要求
- Node.js 已安装（你当前已安装）

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
│       ├── api/                   # HTTP 配置
│       ├── ui/                    # 公共 UI 组件
│       └── types/                 # TypeScript 类型定义
├── public/                        # 静态资源
├── package.json
├── vite.config.ts                 # Vite 配置
└── tsconfig.json                  # TypeScript 配置
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
