import { useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Col, Form, Input, Modal, Row, Space, Typography, message } from 'antd'
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
      <div style={{ textAlign: 'center', padding: 50 }}>
        {t('common.loading')}
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <div style={{ textAlign: 'center', padding: 50, color: '#ff4d4f' }}>
        {t('pages.profile.loadFailed')}
      </div>
    )
  }

  const user = profileQuery.data

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('pages.profile.title')}
        subtitle={t('pages.profile.subtitle')}
      />

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Row gutter={24}>
          <Col xs={24} sm={8} style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 48,
                color: '#fff',
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <Title level={4} style={{ marginBottom: 4 }}>{user?.username}</Title>
            <Text type="secondary">{user?.role === 'tenant' ? t('common.tenant') : user?.role === 'landlord' ? t('common.landlord') : t('common.admin')}</Text>
          </Col>

          <Col xs={24} sm={16}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                username: user?.username,
                phone: user?.phone || '',
                realName: user?.realName || '',
              }}
            >
              <Form.Item
                label={t('pages.profile.username')}
                name="username"
                rules={[
                  { required: true, message: t('pages.profile.usernameRequired') },
                  { min: 3, message: t('pages.profile.usernameMinLength') },
                ]}
              >
                <Input placeholder={t('pages.profile.usernamePlaceholder')} />
              </Form.Item>

              <Form.Item
                label={t('pages.profile.realName')}
                name="realName"
              >
                <Input placeholder={t('pages.profile.realNamePlaceholder')} />
              </Form.Item>

              <Form.Item
                label={t('pages.profile.phone')}
                name="phone"
              >
                <Input placeholder={t('pages.profile.phonePlaceholder')} />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    {t('pages.profile.email')}
                    {user?.emailVerified && (
                      <Text type="success" style={{ fontSize: 12 }}>
                        ({t('pages.profile.verified')})
                      </Text>
                    )}
                  </Space>
                }
              >
                <Space>
                  <Input
                    value={user?.email}
                    disabled
                    style={{ width: 250 }}
                  />
                  <Button onClick={() => setEmailModalOpen(true)}>
                    {t('pages.profile.changeEmail')}
                  </Button>
                </Space>
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Button type="primary" htmlType="submit" loading={profileQuery.isLoading}>
                  {t('pages.profile.save')}
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
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
          <Button key="cancel" onClick={() => {
            setEmailModalOpen(false)
            emailForm.resetFields()
          }}>
            {t('common.cancel')}
          </Button>,
          <Button key="confirm" type="primary" loading={emailChangeLoading} onClick={handleConfirmEmailChange}>
            {t('pages.profile.confirm')}
          </Button>,
        ]}
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
  )
}
