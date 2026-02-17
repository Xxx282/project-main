import { Button, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import type { UserRole } from '../../features/auth/store/authStore'

const { Header, Content } = Layout

type TopNavKey =
  | 'tenant_listings'
  | 'tenant_reco'
  | 'tenant_prefs'
  | 'tenant_compare'
  | 'tenant_inquiries'
  | 'landlord_listings'
  | 'landlord_predict'
  | 'landlord_inquiries'
  | 'admin_dashboard'
  | 'admin_users'
  | 'admin_listings'
  | 'auth_login'
  | 'auth_register'

function keyToPath(key: TopNavKey): string {
  switch (key) {
    case 'tenant_listings':
      return '/tenant/listings'
    case 'tenant_reco':
      return '/tenant/recommendations'
    case 'tenant_prefs':
      return '/tenant/preferences'
    case 'tenant_compare':
      return '/tenant/compare'
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
  if (pathname.startsWith('/tenant/compare')) return 'tenant_compare'
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

const ROLE_MENU: Record<UserRole, { key: TopNavKey; label: string }[]> = {
  tenant: [
    { key: 'tenant_listings', label: '房源' },
    { key: 'tenant_reco', label: '推荐' },
    { key: 'tenant_prefs', label: '偏好' },
    { key: 'tenant_compare', label: '对比' },
    { key: 'tenant_inquiries', label: '咨询' },
  ],
  landlord: [
    { key: 'landlord_listings', label: '房源管理' },
    { key: 'landlord_predict', label: '租金预测' },
    { key: 'landlord_inquiries', label: '咨询管理' },
  ],
  admin: [
    { key: 'admin_dashboard', label: '看板' },
    { key: 'admin_users', label: '用户管理' },
    { key: 'admin_listings', label: '房源审核' },
  ],
}

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const selectedKey = pathToKey(location.pathname)

  // 未登录默认显示租客菜单；登录后按用户角色显示
  const effectiveRole: UserRole = auth.user?.role ?? 'tenant'

  const menuItems: MenuProps['items'] = useMemo(() => {
    const base = ROLE_MENU[effectiveRole].map(({ key, label }) => ({
      key,
      label,
      onClick: () => navigate(keyToPath(key)),
    }))
    if (!auth.user) {
      base.push(
        { key: 'auth_login', label: '登录', onClick: () => navigate('/login') },
        { key: 'auth_register', label: '注册', onClick: () => navigate('/register') },
      )
    }
    return base
  }, [effectiveRole, auth.user, navigate])

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
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Space>
          {auth.user ? (
            <>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                {auth.user.role === 'tenant' && '租客'}
                {auth.user.role === 'landlord' && '房东'}
                {auth.user.role === 'admin' && '管理员'}
              </Typography.Text>
              <Button
                size="small"
                onClick={() => {
                  auth.logout()
                  navigate('/tenant/listings', { replace: true })
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

