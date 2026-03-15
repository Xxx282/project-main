import { Button, Dropdown, Layout, Menu, Space, Typography, Modal, Select } from 'antd'
import type { MenuProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useAuthModal } from '../../features/auth/context/AuthModalContext'
import type { UserRole } from '../../features/auth/store/authStore'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'
import { EmailVerifyModal } from '../../features/auth/components/EmailVerifyModal'
import { TenantPreferencesPage } from '../../features/tenant/pages/TenantPreferencesPage'

const { Header, Content } = Layout

type TopNavKey =
  | 'home'
  | 'tenant_listings'
  | 'tenant_reco'
  | 'tenant_prefs'
  | 'tenant_compare'
  | 'tenant_inquiries'
  | 'tenant_payments'
  | 'landlord_listings'
  | 'landlord_all_listings'
  | 'landlord_predict'
  | 'landlord_inquiries'
  | 'landlord_favorites'
  | 'landlord_orders'
  | 'admin_dashboard'
  | 'admin_users'
  | 'admin_listings'
  | 'admin_payments'
  | 'profile'
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
      // 偏好设置通过弹窗显示，不需要路由跳转
      return ''
    case 'tenant_compare':
      return '/tenant/compare'
    case 'tenant_inquiries':
      return '/tenant/inquiries'
    case 'tenant_payments':
      return '/tenant/payments'
    case 'landlord_listings':
      return '/landlord/listings'
    case 'landlord_all_listings':
      return '/landlord/all-listings'
    case 'landlord_predict':
      return '/landlord/predict'
    case 'landlord_inquiries':
      return '/landlord/inquiries'
    case 'landlord_orders':
      return '/landlord/orders'
    case 'landlord_favorites':
      return '/landlord/favorites'
    case 'admin_dashboard':
      return '/admin/dashboard'
    case 'admin_users':
      return '/admin/users'
    case 'admin_listings':
      return '/admin/listings'
    case 'admin_payments':
      return '/admin/payments'
    case 'profile':
      return '/profile'
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
  if (pathname.startsWith('/tenant/chats')) return 'tenant_inquiries'
  if (pathname.startsWith('/tenant/recommendations')) return 'tenant_reco'
  if (pathname.startsWith('/tenant/preferences')) return 'tenant_prefs'
  if (pathname.startsWith('/tenant/compare')) return 'tenant_compare'
  if (pathname.startsWith('/tenant/inquiries')) return 'tenant_inquiries'
  if (pathname.startsWith('/tenant/payments')) return 'tenant_payments'
  if (pathname.startsWith('/tenant')) return 'tenant_listings'

  if (pathname.startsWith('/landlord/favorites')) return 'landlord_favorites'
  if (pathname.startsWith('/landlord/all-listings')) return 'landlord_all_listings'
  if (pathname.startsWith('/landlord/predict')) return 'landlord_predict'
  if (pathname.startsWith('/landlord/inquiries')) return 'landlord_inquiries'
  if (pathname.startsWith('/landlord/orders')) return 'landlord_orders'
  if (pathname.startsWith('/landlord/favorites')) return 'landlord_favorites'
  if (pathname.startsWith('/landlord')) return 'landlord_listings'

  if (pathname.startsWith('/admin/users')) return 'admin_users'
  if (pathname.startsWith('/admin/listings')) return 'admin_listings'
  if (pathname.startsWith('/admin/payments')) return 'admin_payments'
  if (pathname.startsWith('/admin')) return 'admin_dashboard'

  if (pathname.startsWith('/profile')) return 'profile'

  if (pathname.startsWith('/register')) return 'auth_register'
  if (pathname.startsWith('/login')) return 'auth_login'
  return 'tenant_listings'
}

function getRoleMenu(t: (key: string) => string): Record<UserRole, { key: TopNavKey; label: string }[]> {
  return {
    tenant: [
      // { key: 'home', label: t('nav.home') },
      { key: 'tenant_listings', label: t('nav.listings') },
      { key: 'tenant_reco', label: t('nav.recommendations') },
      { key: 'tenant_compare', label: t('nav.favorites') },
      { key: 'tenant_inquiries', label: t('nav.consultation') },
      { key: 'tenant_payments', label: t('nav.payments') },
    ],
    landlord: [
      // { key: 'home', label: t('nav.home') },
      { key: 'landlord_all_listings', label: t('nav.listings') },
      { key: 'landlord_listings', label: t('nav.publish') },
      { key: 'landlord_orders', label: t('pages.ordersManagement') },
      { key: 'landlord_favorites', label: t('nav.favorites') },
      { key: 'landlord_predict', label: t('nav.prediction') },
      { key: 'landlord_inquiries', label: t('nav.consultation') },
    ],
    admin: [
      { key: 'home', label: t('nav.home') },
      { key: 'admin_dashboard', label: t('nav.dashboard') },
      { key: 'admin_users', label: t('nav.userManagement') },
      { key: 'admin_listings', label: t('nav.listingReview') },
      { key: 'admin_payments', label: t('nav.paymentManagement') },
    ],
  }
}

// 未登录用户的菜单配置：首页 + 房源
function getGuestMenu(t: (key: string) => string): { key: TopNavKey; label: string }[] {
  return [
    { key: 'home', label: t('nav.home') },
    { key: 'tenant_listings', label: t('nav.listings') },
  ]
}

export function MainLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const { authModal, openAuthModal, closeAuthModal } = useAuthModal()
  const selectedKey = pathToKey(location.pathname)
  const [scrollY, setScrollY] = useState(0)
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

  // 监听滚动位置
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 同步i18n语言变化到本地状态
  useEffect(() => {
    setCurrentLanguage(i18n.language)
  }, [i18n.language])

  // 处理从 RequireAuth 重定向回来时自动打开登录弹窗
  useEffect(() => {
    const state = location.state as { showAuthModal?: string } | undefined
    if (state?.showAuthModal && !auth.user) {
      openAuthModal(state.showAuthModal as 'login' | 'register')
      // 清除 state
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, auth.user, navigate, openAuthModal])

  // 判断是否是首页
  const isHomePage = location.pathname === '/'
  const isProfilePage = location.pathname.startsWith('/profile')
  // 与个人中心一致：渐变铺满、无白边。包含：个人中心、房源列表、推荐、收藏、我的订单、咨询、房东订单/房源/预测等
  const isGradientFullBleed =
    isProfilePage ||
    location.pathname.startsWith('/tenant/listings') ||
    location.pathname.startsWith('/tenant/recommendations') ||
    location.pathname.startsWith('/tenant/compare') ||
    location.pathname.startsWith('/tenant/payments') ||
    location.pathname.startsWith('/landlord/favorites') ||
    location.pathname.startsWith('/landlord/all-listings') ||
    location.pathname.startsWith('/tenant/inquiries') ||
    location.pathname.startsWith('/landlord/inquiries') ||
    location.pathname.startsWith('/tenant/chats/') ||
    location.pathname.startsWith('/landlord/listings') ||
    location.pathname.startsWith('/landlord/orders') ||
    location.pathname.startsWith('/landlord/predict')
  const isFullBleedPage = isHomePage || isProfilePage || isGradientFullBleed

  // 个人中心页：给 body 加渐变背景类（在 Layout 里做，确保路由一切换就生效）
  // 应用到所有页面
  useEffect(() => {
    document.body.classList.add('profile-page-body')
    return () => document.body.classList.remove('profile-page-body')
  }, [])

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

  // 处理语言切换
  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value)
    setCurrentLanguage(value)
    localStorage.setItem('language', value)
  }

  const menuItems: MenuProps['items'] = useMemo(() => {
    // 未登录时：首页 + 房源 + 租房(跳转登录) + 发布(跳转登录)
    if (!auth.user) {
      const base = getGuestMenu(t).map(({ key, label }) => ({
        key,
        label,
        onClick: () => navigate(keyToPath(key)),
      }))
      base.push(
        {
          key: 'rent_house',
          label: t('nav.rentHouse'),
          onClick: () => openAuthModal('login'),
        },
        {
          key: 'publish',
          label: t('nav.publish'),
          onClick: () => openAuthModal('login'),
        },
      )
      return base
    }
    // 登录后按用户角色显示菜单
    const base = getRoleMenu(t)[effectiveRole].map(({ key, label }) => ({
      key,
      label,
      onClick: key === 'tenant_prefs'
        ? () => openAuthModal('preferences')
        : () => navigate(keyToPath(key)),
    }))
    return base
  }, [effectiveRole, auth.user, navigate, t, openAuthModal])

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header style={headerStyle}>
        <Typography.Text style={{ color: navTextColor, fontWeight: 600, marginRight: 32 }}>
          {t('common.appName')}
        </Typography.Text>
        {/* 中间区域：让顶栏菜单居中显示 */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <Menu
            theme={isHomePage ? 'dark' : 'dark'}
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            overflowedIndicator={t('nav.home')}
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
          {/* 语言切换下拉菜单 */}
          <Select
            value={currentLanguage}
            onChange={handleLanguageChange}
            style={{
              width: 100,
            }}
            options={[
              { value: 'zh-CN', label: t('language.chinese') },
              { value: 'en-US', label: t('language.english') },
            ]}
            className="language-selector"
          />
          {auth.user ? (
            <>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'profile',
                      label: t('nav.profile'),
                      onClick: () => navigate('/profile'),
                    },
                    {
                      type: 'divider',
                    },
                    {
                      key: 'logout',
                      label: t('common.logout'),
                      onClick: () => auth.logout(),
                    },
                  ],
                }}
                placement="bottomRight"
              >
                <Typography.Text
                  style={{
                    color: navTextColor,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    transition: 'background 0.3s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {auth.user.username}
                </Typography.Text>
              </Dropdown>
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
                {t('common.login')}
              </Button>
              <Button
                type="primary"
                onClick={() => openAuthModal('register')}
              >
                {t('common.register')}
              </Button>
            </>
          )}
        </Space>
      </Header>

      <Content style={{ padding: isFullBleedPage ? 0 : 24, background: 'transparent' }}>
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
            borderRadius: isFullBleedPage ? 0 : 24,
            padding: isFullBleedPage ? 0 : 32,
            minHeight: isFullBleedPage ? '100vh' : '70vh',
            background: isFullBleedPage ? 'transparent' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: isFullBleedPage ? 'none' : 'blur(12px)',
            overflow: 'hidden',
            boxShadow: isFullBleedPage ? 'none' : '0 22px 45px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Outlet />
          </div>
        </div>

        {/* 首页上的登录/注册弹窗：只在未登录时可见 */}
        {!auth.user && (
          <Modal
            open={authModal.visible && authModal.mode !== 'preferences'}
            footer={null}
            onCancel={closeAuthModal}
            centered
            width={520}
            destroyOnHidden
            styles={{
              mask: {
                backgroundColor: 'rgba(0,0,0,0.1)',
                backdropFilter: 'blur(2px)',
              },
              body: {
                padding: 0,
                borderRadius: 16,
                overflow: 'hidden',
                background: 'transparent !important',
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
              {authModal.mode === 'login' ? (
                <LoginPage />
              ) : authModal.mode === 'verify-email' ? (
                <EmailVerifyModal />
              ) : (
                <RegisterPage />
              )}
            </div>
          </Modal>
        )}

        {/* 偏好设置弹窗：对所有用户可见 */}
        <Modal
          open={authModal.visible && authModal.mode === 'preferences'}
          footer={null}
          onCancel={closeAuthModal}
          centered
          width={600}
          destroyOnHidden
          title={null}
          styles={{
            mask: {
              backgroundColor: 'rgba(0,0,0,0.1)',
              backdropFilter: 'blur(2px)',
            },
            body: {
              padding: 0,
              borderRadius: 16,
              overflow: 'hidden',
            },
          }}
        >
          <TenantPreferencesPage />
        </Modal>
      </Content>
    </Layout>
  )
}
