import { Button, Card, Form, Input, Radio, Space, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { login } from '../api/authApi'
import { authStore, type UserRole } from '../store/authStore'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const [form] = Form.useForm<{
    role: UserRole
    email: string
    password: string
    remember: boolean
  }>()

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="登录" />
      <Card style={{ maxWidth: 520 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'tenant', remember: true }}
          onFinish={async (values) => {
            try {
              const res = await login({
                usernameOrEmail: values.email,
                password: values.password,
                role: values.role,
              })
              authStore.setToken(res.accessToken, values.remember)
              await auth.refresh()

              const role = res.user.role
              if (role === 'tenant') navigate('/tenant/listings', { replace: true })
              else if (role === 'landlord') navigate('/landlord/listings', { replace: true })
              else navigate('/admin/dashboard', { replace: true })
            } catch (e) {
              void message.error('登录失败：请检查后端是否已启动以及账号密码是否正确')
            }
          }}
        >
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { label: '租客', value: 'tenant' },
                { label: '房东', value: 'landlord' },
                { label: '管理员', value: 'admin' },
              ]}
            />
          </Form.Item>
          <Form.Item name="email" label="用户名 / 邮箱" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名或邮箱" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="请输入" autoComplete="current-password" />
          </Form.Item>
          <Form.Item name="remember" rules={[{ required: true }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '记住登录（localStorage）', value: true },
                { label: '仅本次（内存）', value: false },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </Space>
  )
}

