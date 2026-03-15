import { Button, Card, Form, Input, Radio, Space, message } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { register } from '../api/authApi'
import { useAuthModal } from '../context/AuthModalContext'
import { useAuth } from '../context/AuthContext'
import { authStore } from '../store/authStore'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { closeAuthModal, openAuthModal } = useAuthModal()
  const auth = useAuth()
  const isInModal = location.pathname === '/' // 在首页时，说明是在模态框中
  const [form] = Form.useForm<{
    username: string
    email: string
    password: string
    phone: string
    role: 'tenant' | 'landlord'
  }>()

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('pages.register')}
        subtitle={t('common.emailVerificationRequired')}
        align="center"
      />
      <Card
        style={{
          maxWidth: 520,
          margin: '0 auto',
          borderRadius: 16,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid rgba(243, 244, 246, 0.5)',
          background: 'transparent',
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'tenant' }}
          onFinish={async (values) => {
            try {
              const res = await register(values) as any
              if (res.accessToken) {
                // 如果后端返回了 token，自动登录（兼容旧逻辑）
                authStore.setToken(res.accessToken, true)
                await auth.refresh()
                void message.success(t('common.registerSuccess'))
                if (isInModal) {
                  closeAuthModal()
                } else {
                  const role = res.user?.role || 'tenant'
                  if (role === 'tenant') navigate('/tenant/listings', { replace: true })
                  else if (role === 'landlord') navigate('/landlord/listings', { replace: true })
                  else navigate('/admin/dashboard', { replace: true })
                }
              } else if (res.message) {
                // 需要邮箱验证
                void message.success(res.message)
                // 保存密码到 localStorage，验证成功后自动登录
                localStorage.setItem('pending_password', values.password)
                // 打开邮箱验证弹窗
                openAuthModal('verify-email', values.email)
              } else {
                void message.success(t('common.registerSuccessLogin'))
                openAuthModal('login')
              }
            } catch {
              void message.error(t('common.registerFailed'))
            }
          }}
        >
          <Form.Item name="role" label={t('common.registerAs')} rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { label: t('common.tenant'), value: 'tenant' },
                { label: t('common.landlord'), value: 'landlord' },
              ]}
            />
          </Form.Item>
          <Form.Item name="username" label={t('common.username')} rules={[
            { required: true, message: t('common.enterUsername') },
            { min: 3, max: 20, message: t('common.usernameLength') },
            { pattern: /^[a-zA-Z0-9_]+$/, message: t('common.usernamePattern') }
          ]}>
            <Input placeholder={t('common.usernamePlaceholder')} autoComplete="username" />
          </Form.Item>
          <Form.Item name="email" label={t('common.email')} rules={[
            { required: true, message: t('common.enterEmail') },
            { type: 'email', message: t('common.emailFormat') }
          ]}>
            <Input 
              placeholder={t('common.emailPlaceholder')} 
              autoComplete="email"
              onBlur={(e) => {
                const value = e.target.value
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  message.warning(t('common.emailFormatWarning'))
                }
              }}
            />
          </Form.Item>
          <Form.Item name="phone" label={t('common.phone')} rules={[
            { required: true, message: t('common.enterPhone') },
            { pattern: /^1[3-9]\d{9}$/, message: t('common.phonePattern') }
          ]}>
            <Input placeholder={t('common.phonePlaceholder')} autoComplete="tel" />
          </Form.Item>
          <Form.Item name="password" label={t('common.password')} rules={[
            { required: true, message: t('common.enterPasswordRequired') },
            { min: 6, message: t('common.passwordMinLength') }
          ]}>
            <Input.Password placeholder={t('common.passwordPlaceholder')} autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {t('common.register')}
          </Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {t('common.alreadyHaveAccount')}
          <Link to="#" onClick={(e) => { e.preventDefault(); openAuthModal('login') }}>
            {t('common.loginNow')}
          </Link>
        </div>
      </Card>
    </Space>
  )
}

