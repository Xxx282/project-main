import { useState } from 'react'
import { Button, Card, Form, Input, Space, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { forgotPassword } from '../api/authApi'
import { useAuthModal } from '../context/AuthModalContext'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const [form] = Form.useForm<{ email: string }>()
  const [loading, setLoading] = useState(false)

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('auth.forgotPassword')}
        subtitle={t('auth.forgotPasswordSubtitle')}
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
          onFinish={async (values) => {
            setLoading(true)
            try {
              await forgotPassword(values.email.trim())
              message.success(t('auth.forgotPasswordSuccess'))
              form.resetFields()
              openAuthModal('login')
            } catch (e) {
              message.error(e instanceof Error ? e.message : t('auth.forgotPasswordFailed'))
            } finally {
              setLoading(false)
            }
          }}
        >
          <Form.Item
            name="email"
            label={t('common.email')}
            rules={[
              { required: true, message: t('common.enterEmail') },
              { type: 'email', message: t('common.emailFormat') },
            ]}
          >
            <Input placeholder={t('common.emailPlaceholder')} autoComplete="email" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            {t('auth.sendResetLink')}
          </Button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="#" onClick={(e) => { e.preventDefault(); openAuthModal('login') }}>
              {t('auth.backToLogin')}
            </Link>
          </div>
        </Form>
      </Card>
    </Space>
  )
}
