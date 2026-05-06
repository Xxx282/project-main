import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntApp } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { AuthProvider } from './features/auth/context/AuthContext'
import { AuthModalProvider } from './features/auth/context/AuthModalContext'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          fontSize: 18,
          colorPrimary: '#6d5dfc',
          colorInfo: '#6d5dfc',
          colorBgLayout: '#f1efff',
          colorBgContainer: '#ffffff',
          colorText: '#1f2937',
          colorTextSecondary: '#64748b',
          colorBorder: '#dcd8ff',
          borderRadius: 8,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AuthModalProvider>
              <AntApp>
                <App />
              </AntApp>
            </AuthModalProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
)
