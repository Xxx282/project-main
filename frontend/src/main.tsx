import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/context/AuthContext'
import { AuthModalProvider } from './features/auth/context/AuthModalContext'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          // 提升全局基础字号，解决字体偏小问题
          fontSize: 16,
          // 统一主色和背景色，让整体配色更协调
          colorPrimary: '#1677ff',
          colorBgLayout: '#f3f4f6',
          colorBgContainer: '#ffffff',
          borderRadius: 8,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthModalProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthModalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
)
