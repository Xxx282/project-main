import { useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Col, Form, Input, Modal, Row, Space, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getUserProfile, updateUserProfile, requestEmailChange, confirmEmailChange } from '../api/authApi'

const { Title, Text } = Typography

export function ProfilePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { message: appMessage } = App.useApp()

  const profileQuery = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: getUserProfile,
  })

  const [form] = Form.useForm<{
    username: string
    phone: string
    realName: string
  }>()

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailForm] = Form.useForm<{
    newEmail: string
    verificationCode: string
  }>()
  const [emailChangeLoading, setEmailChangeLoading] = useState(false)

  useEffect(() => {
    if (profileQuery.data) {
      form.setFieldsValue({
        username: profileQuery.data.username,
        phone: profileQuery.data.phone || '',
        realName: profileQuery.data.realName || '',
      })
    }
  }, [profileQuery.data, form])

  const handleUpdateProfile = async (values: { username: string; phone: string; realName: string }) => {
    try {
      await updateUserProfile({
        username: values.username,
        phone: values.phone || undefined,
        realName: values.realName || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      appMessage.success(t('pages.profile.updateSuccess'))
    } catch {
      appMessage.error(t('pages.profile.updateFailed'))
    }
  }

  const handleSendVerificationCode = async () => {
    try {
      const email = emailForm.getFieldValue('newEmail')
      if (!email) {
        appMessage.error(t('pages.profile.pleaseEnterNewEmail'))
        return
      }
      setEmailChangeLoading(true)
      await requestEmailChange(email)
      appMessage.success(t('pages.profile.verificationCodeSent'))
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : t('pages.profile.sendFailed'))
    } finally {
      setEmailChangeLoading(false)
    }
  }

  const handleConfirmEmailChange = async () => {
    try {
      const values = await emailForm.validateFields()
      setEmailChangeLoading(true)
      await confirmEmailChange(values.newEmail, values.verificationCode)
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      appMessage.success(t('pages.profile.emailChangeSuccess'))
      setEmailModalOpen(false)
      emailForm.resetFields()
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : t('pages.profile.confirmFailed'))
    } finally {
      setEmailChangeLoading(false)
    }
  }

  if (profileQuery.isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #7ec8ff 0%, #a3a0e8 50%, #b4a5e8 100%)',
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 48,
          }}
        >
          <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>
        </Card>
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #7ec8ff 0%, #a3a0e8 50%, #b4a5e8 100%)',
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 48,
          }}
        >
          <Typography.Text type="danger">{t('pages.profile.loadFailed')}</Typography.Text>
        </Card>
      </div>
    )
  }

  const user = profileQuery.data

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>
      {/* 全屏渐变背景层，盖住所有白底 */}
      <div
        className="profile-page-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
      />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, position: 'relative', zIndex: 1 }}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <PageHeader
            title={t('pages.profile.title')}
            subtitle={t('pages.profile.subtitle')}
            align="center"
          />

          <Card
            className="profile-center-card"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 24px 56px rgba(79, 172, 254, 0.12), 0 12px 28px rgba(102, 126, 234, 0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
            }}
            styles={{ body: { padding: '40px 48px' } }}
          >
            {/* 头像与用户名：居中置于卡片顶部 */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7ec8ff 0%, #a3a0e8 50%, #b4a5e8 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
                }}
              >
                <UserOutlined style={{ fontSize: 48 }} />
              </div>
              <Title level={4} style={{ margin: 0, color: '#1a1a1a', fontWeight: 600 }}>
                {user?.username}
              </Title>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 4 }}>
                {user?.role === 'tenant' ? t('common.tenant') : user?.role === 'landlord' ? t('common.landlord') : t('common.admin')}
              </Text>
            </div>

            {/* 表单：输入栏统一宽度与样式 */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                username: user?.username,
                phone: user?.phone || '',
                realName: user?.realName || '',
              }}
              style={{ maxWidth: 520, margin: '0 auto' }}
            >
              <Form.Item
                label={t('pages.profile.username')}
                name="username"
                rules={[
                  { required: true, message: t('pages.profile.usernameRequired') },
                  { min: 3, message: t('pages.profile.usernameMinLength') },
                ]}
              >
                <Input
                  placeholder={t('pages.profile.usernamePlaceholder')}
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item label={t('pages.profile.realName')} name="realName">
                <Input
                  placeholder={t('pages.profile.realNamePlaceholder')}
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item label={t('pages.profile.phone')} name="phone">
                <Input
                  placeholder={t('pages.profile.phonePlaceholder')}
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    {t('pages.profile.email')}
                    {user?.emailVerified && (
                      <Text type="success" style={{ fontSize: 13 }}>
                        ({t('pages.profile.verified')})
                      </Text>
                    )}
                  </Space>
                }
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    value={user?.email}
                    disabled
                    size="large"
                    style={{ flex: 1, borderRadius: '10px 0 0 10px' }}
                  />
                  <Button
                    size="large"
                    onClick={() => setEmailModalOpen(true)}
                    style={{
                      background: 'rgba(102, 126, 234, 0.12)',
                      borderColor: '#a3a0e8',
                      color: '#a3a0e8',
                      fontWeight: 600,
                      borderRadius: '0 10px 10px 0',
                    }}
                  >
                    {t('pages.profile.changeEmail')}
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item style={{ marginTop: 40, marginBottom: 0, textAlign: 'center' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={profileQuery.isLoading}
                  style={{
                    height: 48,
                    minWidth: 160,
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7ec8ff 0%, #a3a0e8 50%, #b4a5e8 100%)',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  {t('pages.profile.save')}
                </Button>
              </Form.Item>
            </Form>
          </Card>

        {/* 邮箱更改弹窗 */}
        <Modal
          title={t('pages.profile.changeEmail')}
          open={emailModalOpen}
          onCancel={() => {
            setEmailModalOpen(false)
            emailForm.resetFields()
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setEmailModalOpen(false)
                emailForm.resetFields()
              }}
            >
              {t('common.cancel')}
            </Button>,
            <Button
              key="confirm"
              type="primary"
              loading={emailChangeLoading}
              onClick={handleConfirmEmailChange}
              style={{
                background: 'linear-gradient(135deg, #7ec8ff 0%, #a3a0e8 50%, #b4a5e8 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {t('pages.profile.confirm')}
            </Button>,
          ]}
          styles={{ content: { borderRadius: 16 } }}
        >
        <Form form={emailForm} layout="vertical">
          <Form.Item
            label={t('pages.profile.newEmail')}
            name="newEmail"
            rules={[
              { required: true, message: t('pages.profile.emailRequired') },
              { type: 'email', message: t('pages.profile.invalidEmail') },
            ]}
          >
            <Input placeholder={t('pages.profile.newEmailPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('pages.profile.verificationCode')}
            name="verificationCode"
            rules={[{ required: true, message: t('pages.profile.codeRequired') }]}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder={t('pages.profile.codePlaceholder')} />
              <Button
                type="dashed"
                block
                onClick={handleSendVerificationCode}
                loading={emailChangeLoading}
              >
                {t('pages.profile.sendCode')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
        </Modal>
      </Space>
      </div>
    </div>
  )
}
