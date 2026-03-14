import { Button, Card, Checkbox, Form, Input, Space, message } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { login } from '../api/authApi'
import { authStore, type UserRole } from '../store/authStore'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const { closeAuthModal, authModal } = useAuthModal()
  const isInModal = location.pathname === '/' // 在首页时，说明是在模态框中

  const [form] = Form.useForm<{
    email: string
    password: string
    remember: boolean
  }>()

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('pages.login')}
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
          initialValues={{ remember: true, email: authModal.email }}
          onFinish={async (values) => {
            try {
              const res = await login({
                usernameOrEmail: values.email,
                password: values.password,
              })
              authStore.setToken(res.accessToken, values.remember)
              await auth.refresh()

              if (isInModal) {
                // 在模态框中，登录成功后关闭模态框
                closeAuthModal()
              } else {
                // 不在模态框中，按角色跳转
                const role = res.user.role
                if (role === 'tenant') navigate('/tenant/listings', { replace: true })
                else if (role === 'landlord') navigate('/landlord/listings', { replace: true })
                else navigate('/admin/dashboard', { replace: true })
              }
            } catch (e) {
              void message.error(t('common.loginFailed'))
            }
          }}
        >
          <Form.Item name="email" label={t('common.usernameOrEmail')} rules={[{ required: true }]}>
            <Input placeholder={t('common.enterUsernameOrEmail')} autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label={t('common.password')} rules={[{ required: true }]}>
            <Input.Password placeholder={t('common.enterPassword')} autoComplete="current-password" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 24 }}>
            <Checkbox
              style={{
                fontSize: 15,
                color: 'rgba(0,0,0,0.75)',
                alignItems: 'center',
              }}
              className="login-remember-checkbox"
            >
              {t('common.autoLogin')}
            </Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" style={{ height: 48, fontSize: 16, fontWeight: 600, borderRadius: 10 }}>
            {t('common.login')}
          </Button>
        </Form>
      </Card>
    </Space>
  )
}

