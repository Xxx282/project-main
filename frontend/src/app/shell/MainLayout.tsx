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
  | 'landlord_all_listings'
  | 'landlord_predict'
  | 'landlord_inquiries'
  | 'landlord_favorites'
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
    case 'landlord_all_listings':
      return '/landlord/all-listings'
    case 'landlord_predict':
      return '/landlord/predict'
    case 'landlord_inquiries':
      return '/landlord/inquiries'
    case 'landlord_favorites':
      return '/landlord/favorites'
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

  if (pathname.startsWith('/landlord/favorites')) return 'landlord_favorites'
  if (pathname.startsWith('/landlord/all-listings')) return 'landlord_all_listings'
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
    { key: 'tenant_compare', label: '收藏' },
    { key: 'tenant_inquiries', label: '咨询' },
  ],
  landlord: [
    { key: 'landlord_all_listings', label: '房源' },
    { key: 'landlord_listings', label: '我的' },
    { key: 'landlord_favorites', label: '收藏' },
    { key: 'landlord_predict', label: '预测' },
    { key: 'landlord_inquiries', label: '咨询' },
  ],
  admin: [
    { key: 'admin_dashboard', label: '看板' },
    { key: 'admin_users', label: '用户管理' },
    { key: 'admin_listings', label: '房源审核' },
  ],
}

// 未登录用户的菜单配置：只显示房源
const GUEST_MENU: { key: TopNavKey; label: string }[] = [
  { key: 'tenant_listings', label: '房源' },
]

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const selectedKey = pathToKey(location.pathname)

  // 未登录默认显示租客菜单；登录后按用户角色显示
  const effectiveRole: UserRole = auth.user?.role ?? 'tenant'

  const menuItems: MenuProps['items'] = useMemo(() => {
    // 未登录时只显示房源 + 登录 + 注册
    if (!auth.user) {
      const base = GUEST_MENU.map(({ key, label }) => ({
        key,
        label,
        onClick: () => navigate(keyToPath(key)),
      }))
      base.push(
        { key: 'auth_login', label: '登录', onClick: () => navigate('/login') },
        { key: 'auth_register', label: '注册', onClick: () => navigate('/register') },
      )
      return base
    }
    // 登录后按用户角色显示菜单
    const base = ROLE_MENU[effectiveRole].map(({ key, label }) => ({
      key,
      label,
      onClick: () => navigate(keyToPath(key)),
    }))
    return base
  }, [effectiveRole, auth.user, navigate])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingInline: 32,
          background: '#001529',
        }}
      >
        <Typography.Text style={{ color: '#fff', fontWeight: 600, marginRight: 32 }}>
          智能租房系统
        </Typography.Text>
        {/* 中间区域：让顶栏菜单居中显示 */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            overflowedIndicator="更多"
            style={{
              background: 'transparent',
              borderBottom: 'none',
              fontSize: 16,
              fontWeight: 500,
            }}
          />
        </div>
        <Space>
          {auth.user ? (
            <>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                {auth.user.username}
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
        <div
          style={{
            position: 'relative',
            borderRadius: 24,
            padding: 32,
            minHeight: '70vh',
            background:
              'radial-gradient(circle at top left, #e0e7ff 0, #f1f5f9 35%, #ffffff 100%)',
            overflow: 'hidden',
            boxShadow: '0 22px 45px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -40,
              backgroundImage: 'url(/pattern-grid.svg)',
              backgroundSize: '140px 140px',
              opacity: 0.55,
              pointerEvents: 'none',
            }}
          />
          {/* 彩色渐变光斑 */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              right: -60,
              width: 260,
              height: 260,
              borderRadius: '999px',
              background:
                'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.9), transparent 60%)',
              filter: 'blur(6px)',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -90,
              left: -70,
              width: 220,
              height: 220,
              borderRadius: '999px',
              background:
                'radial-gradient(circle at 70% 80%, rgba(236,72,153,0.9), transparent 60%)',
              filter: 'blur(8px)',
              opacity: 0.9,
            }}
          />
          <div style={{ position: 'relative' }}>
            <Outlet />
          </div>
        </div>
      </Content>
    </Layout>
  )
}
