import { Button, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'

const { Header, Content } = Layout

type TopNavKey =
  | 'tenant_listings'
  | 'tenant_reco'
  | 'tenant_prefs'
  | 'tenant_inquiries'
  | 'landlord_listings'
  | 'landlord_predict'
  | 'landlord_inquiries'
  | 'admin_dashboard'
  | 'admin_users'
  | 'admin_listings'
  | 'auth_login'
  | 'auth_register'

const items: MenuProps['items'] = [
  { key: 'tenant_listings', label: '租客-房源', onClick: () => void 0 },
  { key: 'tenant_reco', label: '租客-推荐', onClick: () => void 0 },
  { key: 'tenant_prefs', label: '租客-偏好', onClick: () => void 0 },
  { key: 'tenant_inquiries', label: '租客-咨询', onClick: () => void 0 },
  { key: 'landlord_listings', label: '房东-房源', onClick: () => void 0 },
  { key: 'landlord_predict', label: '房东-预测', onClick: () => void 0 },
  { key: 'landlord_inquiries', label: '房东-咨询', onClick: () => void 0 },
  { key: 'admin_dashboard', label: '管理-看板', onClick: () => void 0 },
  { key: 'admin_users', label: '管理-用户', onClick: () => void 0 },
  { key: 'admin_listings', label: '管理-审核', onClick: () => void 0 },
  { key: 'auth_login', label: '登录', onClick: () => void 0 },
  { key: 'auth_register', label: '注册', onClick: () => void 0 },
]

function keyToPath(key: TopNavKey): string {
  switch (key) {
    case 'tenant_listings':
      return '/tenant/listings'
    case 'tenant_reco':
      return '/tenant/recommendations'
    case 'tenant_prefs':
      return '/tenant/preferences'
    case 'tenant_inquiries':
      return '/tenant/inquiries'
    case 'landlord_listings':
      return '/landlord/listings'
    case 'landlord_predict':
      return '/landlord/predict'
    case 'landlord_inquiries':
      return '/landlord/inquiries'
    case 'admin_dashboard':
      return '/admin/dashboard'
    case 'admin_users':
      return '/admin/users'
    case 'admin_listings':
      return '/admin/listings'
    case 'auth_login':
      return '/login'
    case 'auth_register':
      return '/register'
  }
}

function pathToKey(pathname: string): TopNavKey {
  if (pathname.startsWith('/tenant/recommendations')) return 'tenant_reco'
  if (pathname.startsWith('/tenant/preferences')) return 'tenant_prefs'
  if (pathname.startsWith('/tenant/inquiries')) return 'tenant_inquiries'
  if (pathname.startsWith('/tenant')) return 'tenant_listings'

  if (pathname.startsWith('/landlord/predict')) return 'landlord_predict'
  if (pathname.startsWith('/landlord/inquiries')) return 'landlord_inquiries'
  if (pathname.startsWith('/landlord')) return 'landlord_listings'

  if (pathname.startsWith('/admin/users')) return 'admin_users'
  if (pathname.startsWith('/admin/listings')) return 'admin_listings'
  if (pathname.startsWith('/admin')) return 'admin_dashboard'

  if (pathname.startsWith('/register')) return 'auth_register'
  if (pathname.startsWith('/login')) return 'auth_login'
  return 'tenant_listings'
}

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const selectedKey = pathToKey(location.pathname)

  const onClick: MenuProps['onClick'] = (e) => {
    navigate(keyToPath(e.key as TopNavKey))
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Typography.Text style={{ color: '#fff', fontWeight: 600 }}>
          智能租房系统
        </Typography.Text>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={onClick}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Space>
          {auth.user ? (
            <>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                {auth.user.role}
              </Typography.Text>
              <Button
                size="small"
                onClick={() => {
                  auth.logout()
                  navigate('/login', { replace: true })
                }}
              >
                退出
              </Button>
            </>
          ) : (
            <Button size="small" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </Space>
      </Header>

      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  )
}

