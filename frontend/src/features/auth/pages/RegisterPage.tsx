import { Button, Card, Form, Input, Radio, Space, Typography, message } from 'antd'
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
      <PageHeader
        title="注册"
        subtitle="注册完成后跳转登录页（或由后端返回 token 自动登录）"
      />
      <Card style={{ maxWidth: 520 }}>
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
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            如果后端设计为“注册后直接返回 token”，我会再补上自动登录逻辑。
          </Typography.Paragraph>
        </Form>
      </Card>
    </Space>
  )
}

