import { Button, Card, Form, Input, Radio, Space, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { register } from '../api/authApi'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<{
    username: string
    email: string
    password: string
    role: 'tenant' | 'landlord'
  }>()

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
<<<<<<< HEAD
      <PageHeader title="注册" />
      <Card style={{ maxWidth: 520 }}>
=======
      <PageHeader
        title="注册"
        subtitle="注册完成后跳转登录页（或由后端返回 token 自动登录）"
        align="center"
      />
      <Card
        style={{
          maxWidth: 520,
          margin: '0 auto',
          borderRadius: 16,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}
      >
>>>>>>> 525f37060275a5b973a7e3e6ca3a0cdd1bd4fb9f
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'tenant' }}
          onFinish={async (values) => {
            try {
              const res = await register(values)
              if ('accessToken' in (res as any)) {
                void message.success('注册成功（后端已返回 token）')
              } else {
                void message.success('注册成功，请登录')
              }
              navigate('/login', { replace: true })
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
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3, max: 20 }]}>
            <Input placeholder="3-20 位字符" autoComplete="username" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="name@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="至少 6 位" autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            注册
          </Button>
        </Form>
      </Card>
    </Space>
  )
}

