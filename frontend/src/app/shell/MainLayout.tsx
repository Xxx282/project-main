import { Button, Layout, Menu, Space, Typography, Modal } from 'antd'
import type { MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useAuthModal } from '../../features/auth/context/AuthModalContext'
import type { UserRole } from '../../features/auth/store/authStore'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'

const { Header, Content } = Layout

type TopNavKey =
  | 'home'
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
  | 'rent_house'
  | 'publish'

function keyToPath(key: TopNavKey): string {
  switch (key) {
    case 'home':
      return '/'
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
    case 'rent_house':
      return '/login'
    case 'publish':
      return '/login'
  }
}

function pathToKey(pathname: string): TopNavKey {
  if (pathname === '/') return 'home'
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
    // { key: 'home', label: '首页' },
    { key: 'tenant_listings', label: '房源' },
    { key: 'tenant_reco', label: '推荐' },
    { key: 'tenant_compare', label: '收藏' },
    { key: 'tenant_inquiries', label: '咨询' },
  ],
  landlord: [
    // { key: 'home', label: '首页' },
    { key: 'landlord_all_listings', label: '房源' },
    { key: 'landlord_listings', label: '我的' },
    { key: 'landlord_favorites', label: '收藏' },
    { key: 'landlord_predict', label: '预测' },
    { key: 'landlord_inquiries', label: '咨询' },
  ],
  admin: [
    { key: 'home', label: '首页' },
    { key: 'admin_dashboard', label: '看板' },
    { key: 'admin_users', label: '用户管理' },
    { key: 'admin_listings', label: '房源审核' },
  ],
}

// 未登录用户的菜单配置：首页 + 房源
const GUEST_MENU: { key: TopNavKey; label: string }[] = [
  { key: 'home', label: '首页' },
  { key: 'tenant_listings', label: '房源' },
]

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const { authModal, openAuthModal, closeAuthModal } = useAuthModal()
  const selectedKey = pathToKey(location.pathname)
  const [scrollY, setScrollY] = useState(0)

  // 监听滚动位置
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 判断是否是首页
  const isHomePage = location.pathname === '/'

  // 首页导航栏透明，其他页面使用深色背景
  const headerStyle: React.CSSProperties = isHomePage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        paddingInline: 32,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
        backdropFilter: 'blur(8px)',
      }
    : {
        display: 'flex',
        alignItems: 'center',
        paddingInline: 32,
        background: '#001529',
      }

  // 导航栏文字颜色
  const navTextColor = isHomePage ? '#fff' : '#fff'

  // 未登录默认显示租客菜单；登录后按用户角色显示
  const effectiveRole: UserRole = auth.user?.role ?? 'tenant'

  const menuItems: MenuProps['items'] = useMemo(() => {
    // 未登录时：首页 + 房源 + 租房(跳转登录) + 发布(跳转登录)
    if (!auth.user) {
      const base = GUEST_MENU.map(({ key, label }) => ({
        key,
        label,
        onClick: () => navigate(keyToPath(key)),
      }))
      base.push(
        {
          key: 'rent_house',
          label: '租房',
          onClick: () => openAuthModal('login'),
        },
        {
          key: 'publish',
          label: '发布',
          onClick: () => openAuthModal('login'),
        },
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
      <Header style={headerStyle}>
        <Typography.Text style={{ color: navTextColor, fontWeight: 600, marginRight: 32 }}>
          智能租房系统
        </Typography.Text>
        {/* 中间区域：让顶栏菜单居中显示 */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <Menu
            theme={isHomePage ? 'dark' : 'dark'}
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            overflowedIndicator="更多"
            style={{
              background: 'transparent',
              borderBottom: 'none',
              fontSize: 16,
              fontWeight: 500,
              color: navTextColor,
              width: '100%',
              maxWidth: 'none',
              flexShrink: 0,
            }}
          />
        </div>
        <Space size="middle">
          {auth.user ? (
            <>
              <Typography.Text style={{ color: navTextColor }}>
                {auth.user.username}
              </Typography.Text>
              <Button
                onClick={() => {
                  auth.logout()
                  navigate('/tenant/listings', { replace: true })
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: navTextColor,
                }}
              >
                退出
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => openAuthModal('login')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.5)',
                  color: navTextColor,
                }}
              >
                登录
              </Button>
              <Button
                type="primary"
                onClick={() => openAuthModal('register')}
              >
                注册
              </Button>
            </>
          )}
        </Space>
      </Header>

      <Content style={{ padding: isHomePage ? 0 : 24 }}>
        {/* 首页视差背景 */}
        {isHomePage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1,
              overflow: 'hidden',
            }}
          >
            {/* 城市背景 - 最底层 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/city.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `translateY(${scrollY * 0.3}px)`,
                opacity: Math.min(1, scrollY / 600),
              }}
            />
            {/* 天空层 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/sky.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center bottom',
                transform: `translateY(${-scrollY * 0.2}px) scale(${1 + scrollY * 0.0005})`,
                opacity: Math.max(0, 1 - scrollY / 400),
              }}
            />
            {/* 遮罩层 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(to bottom, 
                  rgba(0,0,0,0.3) 0%, 
                  rgba(0,0,0,0.1) 30%, 
                  rgba(0,0,0,0.4) 100%)`,
              }}
            />
          </div>
        )}

        <div
          style={{
            position: 'relative',
            borderRadius: isHomePage ? 0 : 24,
            padding: isHomePage ? 0 : 32,
            minHeight: isHomePage ? '100vh' : '70vh',
            background: isHomePage ? 'transparent' :
              'radial-gradient(circle at top left, #e0e7ff 0, #f1f5f9 35%, #ffffff 100%)',
            overflow: 'hidden',
            boxShadow: isHomePage ? 'none' : '0 22px 45px rgba(15, 23, 42, 0.15)',
          }}
        >
          {!isHomePage && (
            <>
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
            </>
          )}
          <div style={{ position: 'relative' }}>
            <Outlet />
          </div>
        </div>

        {/* 首页上的登录/注册弹窗：只在未登录时可见 */}
        {!auth.user && (
          <Modal
            open={authModal.visible}
            footer={null}
            onCancel={closeAuthModal}
            centered
            width={520}
            destroyOnClose
            maskStyle={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              backdropFilter: 'blur(2px)',
            }}
            styles={{
              body: {
                padding: 0,
                borderRadius: 16,
                overflow: 'hidden',
                background: 'transparent !important',
              },
              content: {
                background: 'transparent !important',
                boxShadow: 'none',
              },
            }}
            className="transparent-modal"
          >
            <div
              style={{
                padding: 24,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                borderRadius: 16,
              }}
            >
              {authModal.mode === 'login' ? <LoginPage /> : <RegisterPage />}
            </div>
          </Modal>
        )}
      </Content>
    </Layout>
  )
}
