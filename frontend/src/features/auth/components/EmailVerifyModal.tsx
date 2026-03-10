import { useState } from 'react'
import { Button, Input, Space, message, Typography } from 'antd'
import { MailOutlined, LockOutlined, SendOutlined } from '@ant-design/icons'
import { http } from '../../../shared/api/http'
import { useAuthModal } from '../context/AuthModalContext'

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

export function EmailVerifyModal() {
  const { authModal, openAuthModal, closeAuthModal } = useAuthModal()
  const email = authModal.email || ''
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

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
      message.success('邮箱验证成功！')

      // 清除临时密码
      localStorage.removeItem('pending_password')

      // 关闭验证弹窗，打开登录弹窗（带上邮箱）
      closeAuthModal()
      // 延迟一点打开登录弹窗，让用户看到验证成功的提示
      setTimeout(() => {
        openAuthModal('login', email)
      }, 500)
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

  if (authModal.mode !== 'verify-email') return null

  return (
    <div>
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
          验证并登录
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
    </div>
  )
}
