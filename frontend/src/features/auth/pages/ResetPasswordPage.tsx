import { useState } from 'react'
import { Button, Card, Form, Input, Space, message } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { resetPassword } from '../api/authApi'
import { useAuthModal } from '../context/AuthModalContext'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<{ newPassword: string; confirmPassword: string }>()

  if (!token || !email) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <PageHeader title={t('auth.resetPassword')} align="center" />
        <Card
          style={{
            maxWidth: 520,
            margin: '0 auto',
            borderRadius: 16,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(243, 244, 246, 0.5)',
          }}
        >
          <p style={{ marginBottom: 16 }}>{t('auth.resetLinkInvalid')}</p>
          <Link to="/forgot-password">{t('auth.requestResetAgain')}</Link>
        </Card>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('auth.resetPassword')}
        subtitle={t('auth.resetPasswordSubtitle')}
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
              await resetPassword({
                email,
                token,
                newPassword: values.newPassword,
              })
              message.success(t('auth.resetPasswordSuccess'))
              openAuthModal('login')
            } catch (e) {
              message.error(e instanceof Error ? e.message : t('auth.resetPasswordFailed'))
            } finally {
              setLoading(false)
            }
          }}
        >
          <Form.Item
            name="newPassword"
            label={t('auth.newPassword')}
            rules={[
              { required: true, message: t('common.enterPasswordRequired') },
              { min: 6, message: t('common.passwordMinLength') },
            ]}
          >
            <Input.Password placeholder={t('common.passwordPlaceholder')} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('auth.confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('auth.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                  return Promise.reject(new Error(t('auth.passwordMismatch')))
                },
              }),
            ]}
          >
            <Input.Password placeholder={t('common.passwordPlaceholder')} autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            {t('auth.resetPasswordSubmit')}
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
