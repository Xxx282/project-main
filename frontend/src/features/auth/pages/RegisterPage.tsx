import { Button, Card, Form, Input, Radio, Space, message } from 'antd'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { register } from '../api/authApi'
import { useAuthModal } from '../context/AuthModalContext'
import { useAuth } from '../context/AuthContext'
import { authStore } from '../store/authStore'

export function RegisterPage() {
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
        title="注册"
        subtitle="注册完成后需要邮箱验证"
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
                void message.success('注册成功，已自动登录')
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
                void message.success('注册成功，请登录')
                if (isInModal) {
                  openAuthModal('login')
                } else {
                  navigate('/login', { replace: true })
                }
              }
            } catch {
              void message.error('注册失败：请检查后端是否已启动，或该邮箱是否已被注册')
            }
          }}
        >
          <Form.Item name="role" label="注册为" rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { label: '租客', value: 'tenant' },
                { label: '房东', value: 'landlord' },
              ]}
            />
          </Form.Item>
          <Form.Item name="username" label="用户名" rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 20, message: '用户名长度必须在3-20之间' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
          ]}>
            <Input placeholder="3-20 位字母、数字、下划线" autoComplete="username" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱格式，如：name@example.com' }
          ]}>
            <Input 
              placeholder="name@example.com" 
              autoComplete="email"
              onBlur={(e) => {
                const value = e.target.value
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  message.warning('邮箱格式似乎不太对哦~')
                }
              }}
            />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' }
          ]}>
            <Input placeholder="11位手机号" autoComplete="tel" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' }
          ]}>
            <Input.Password placeholder="至少 6 位" autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            注册
          </Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          已有账号？<Link to="/login">立即登录</Link>
        </div>
      </Card>
    </Space>
  )
}

