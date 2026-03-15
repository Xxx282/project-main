import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Result, Button, Card, Descriptions, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import { CheckCircleOutlined } from '@ant-design/icons'

export function TenantPaymentSuccessPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as {
    propertyId?: number
    amount?: number
    leaseType?: string
    months?: number
    leaseStart?: string
    leaseEnd?: string
  } | null

  useEffect(() => {
    // 如果没有状态数据，重定向到支付列表
    if (!state || !state.propertyId) {
      navigate('/tenant/payments', { replace: true })
    }
  }, [state, navigate])

  if (!state) {
    return null
  }

  const { amount, leaseType, months, leaseStart, leaseEnd } = state

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          status="success"
          title={t('pages.paymentSuccess')}
          subTitle={t('pages.paymentSuccessMessage')}
        />
      </Card>

      <Card title={t('pages.paymentDetails')}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label={t('pages.leaseType')}>
            {leaseType === 'long' ? t('pages.longTerm') : t('pages.shortTerm')}
          </Descriptions.Item>
          <Descriptions.Item label={t('pages.leaseDuration')}>
            {months} {t('pages.months')}
          </Descriptions.Item>
          <Descriptions.Item label={t('pages.leasePeriod')}>
            {leaseStart} ~ {leaseEnd}
          </Descriptions.Item>
          <Descriptions.Item label={t('pages.depositPaid')}>
            ¥ {amount?.toLocaleString() || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Space style={{ width: '100%', justifyContent: 'center' }}>
        <Button type="primary" onClick={() => navigate('/tenant/payments')}>
          {t('pages.viewOrders')}
        </Button>
        <Button onClick={() => navigate('/tenant')}>
          {t('pages.backToHome')}
        </Button>
      </Space>
    </Space>
  )
}
