import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button, Card, Input, Space, message, Typography } from 'antd'
import { MailOutlined, LockOutlined, SendOutlined } from '@ant-design/icons'
import { http } from '../../../shared/api/http'
import { PageHeader } from '../../../shared/ui/PageHeader'

const { Text } = Typography

interface VerifyResponse {
  code: number
  message: string
  data: {
    message: string
  }
  timestamp: number
  success: boolean
}

export function EmailVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      message.error('缺少邮箱参数')
      navigate('/register')
    }
  }, [email, navigate])

  const handleVerify = async () => {
    if (!code) {
      message.warning('请输入验证码')
      return
    }
    if (code.length !== 6) {
      message.warning('验证码为6位数字')
      return
    }
    setLoading(true)
    try {
      await http.post<VerifyResponse>('/auth/verify-email', { email, code })
      message.success('验证成功！即将跳转到登录页...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      const errMsg = err.response?.data?.message || '验证失败，请重试'
      message.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await http.post('/auth/resend-code', { email })
      message.success('验证码已重新发送，请注意查收')
    } catch (err: any) {
      const errMsg = err.response?.data?.message || '发送失败，请稍后重试'
      message.error(errMsg)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="邮箱验证"
        subtitle="请输入发送到您邮箱的验证码"
        align="center"
      />
      <Card
        style={{
          maxWidth: 420,
          margin: '0 auto',
          borderRadius: 16,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid rgba(243, 244, 246, 0.5)',
          background: 'transparent',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <MailOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">验证码已发送至</Text>
            <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>{email}</div>
          </div>
        </div>

        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Input
            prefix={<LockOutlined />}
            placeholder="请输入6位验证码"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            size="large"
            style={{ textAlign: 'center', letterSpacing: '0.5em' }}
            onPressEnter={handleVerify}
          />

          <Button 
            type="primary" 
            block 
            size="large"
            loading={loading}
            onClick={handleVerify}
          >
            验证邮箱
          </Button>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">没有收到验证码？</Text>
            <Button 
              type="link" 
              loading={resendLoading}
              onClick={handleResend}
              icon={<SendOutlined />}
            >
              重新发送
            </Button>
          </div>
        </Space>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="link" onClick={() => navigate('/register')}>
            返回注册
          </Button>
        </div>
      </Card>
    </Space>
  )
}
