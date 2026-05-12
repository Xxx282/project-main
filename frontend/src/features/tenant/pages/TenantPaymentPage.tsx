import { Card, Form, InputNumber, Radio, Button, Space, Descriptions, Divider, Row, Col, Result, App } from 'antd'

import { AlipayOutlined, LoadingOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListing, getLandlordInfo } from '../../tenant/api/tenantApi'
import type { PaymentOrder } from '../../payment/api/paymentApi'
import { createPayment } from '../../payment/api/paymentApi'
import { usePaymentMonitor, type PaymentStatus } from '../../payment/hooks/usePaymentMonitor'

// 固定二维码图片
const QR_CODES = {
  WECHAT: '/wx.jpg',
  ALIPAY: '/alipay.jpg',
}

// 支付状态组件
function PaymentStatusDisplay({ 
  status, 
  onPay 
}: { 
  status: PaymentStatus
  onPay: () => void 
}) {
  const { t } = useTranslation()

  switch (status) {
    case 'MONITORING':
      return (
        <Result
          icon={<LoadingOutlined spin style={{ color: '#1890ff' }} />}
          title={t('pages.monitoringPayment')}
          subTitle={t('pages.pleaseCompletePayment')}
          extra={[
            <Button type="default" onClick={onPay} key="pay">
              {t('pages.iHavePaid')}
            </Button>
          ]}
        />
      )
    case 'SUCCESS':
      return (
        <Result
          status="success"
          title={t('pages.paymentSuccess')}
          subTitle={t('pages.paymentSuccessMessage')}
          extra={[
            <Button type="primary" onClick={() => window.location.href = '/tenant/payments'} key="view">
              {t('pages.viewOrders')}
            </Button>
          ]}
        />
      )
    case 'TIMEOUT':
      return (
        <Result
          status="warning"
          title={t('pages.paymentTimeout')}
          subTitle={t('pages.paymentTimeoutMessage')}
          extra={[
            <Button type="primary" onClick={onPay} key="retry">
              {t('pages.tryAgain')}
            </Button>
          ]}
        />
      )
    case 'ERROR':
      return (
        <Result
          status="error"
          title={t('pages.paymentError')}
          subTitle={t('pages.paymentErrorMessage')}
          extra={[
            <Button type="primary" onClick={onPay} key="retry">
              {t('pages.tryAgain')}
            </Button>
          ]}
        />
      )
    default:
      return null
  }
}

export function TenantPaymentPage() {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const propertyId = Number(searchParams.get('propertyId'))
  const payeeId = Number(searchParams.get('payeeId'))
  // 从 URL 参数获取定金、租赁类型、日期
  const deposit = Number(searchParams.get('deposit')) || 0
  const leaseType = searchParams.get('leaseType') || 'short' // long: 长租, short: 短租
  const months = Number(searchParams.get('months')) || 0
  const leaseStart = searchParams.get('leaseStart') || ''
  const leaseEnd = searchParams.get('leaseEnd') || ''
  const step = searchParams.get('step') || 'create' // create: 创建订单, confirm: 确认支付

  const [form] = Form.useForm()
  const [paymentChannel, setPaymentChannel] = useState<string>('ALIPAY')
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null)
  const [showQRCode, setShowQRCode] = useState(false) // 是否显示付款码
  const [hasAutoCreated, setHasAutoCreated] = useState(false) // 是否已自动创建订单

  // 如果是确认步骤(step=confirm)，自动创建订单并显示付款码（只有没有订单时才创建）
  useEffect(() => {
    if (step === 'confirm' && propertyId && payeeId && !currentOrder && !hasAutoCreated) {
      setHasAutoCreated(true)
      // 自动创建订单
      createPaymentMutation.mutate({
        payeeId,
        propertyId,
        paymentType: 'DEPOSIT',
        amount: deposit,
        paymentChannel: 'ALIPAY',
      })
      setShowQRCode(true)
    }
    // 如果是创建步骤(step=create)，确保不显示付款码
    if (step === 'create') {
      setShowQRCode(false)
      setHasAutoCreated(false)
    }
  }, [step, propertyId, payeeId, deposit, currentOrder])

  // 获取房源信息
  const listingQ = useQuery({
    queryKey: ['tenant', 'listing', propertyId],
    queryFn: () => getListing(propertyId),
    enabled: Boolean(propertyId),
  })

  // 获取房东信息
  const landlordQ = useQuery({
    queryKey: ['tenant', 'landlord', propertyId],
    queryFn: () => getLandlordInfo(propertyId),
    enabled: Boolean(propertyId),
  })

  // 支付监控（通过支付时间误差<5分钟判断）
  const {
    status: monitorStatus,
    start: startMonitor,
    stop: stopMonitor,
    isMonitoring,
  } = usePaymentMonitor({
    orderNo: currentOrder?.orderNo || '',
    amount: currentOrder?.amount || 0,
    timeoutSeconds: 60,  // 1分钟超时
    pollInterval: 3000,   // 前端轮询间隔
    onSuccess: () => {
      message.success(t('pages.paymentSuccess'))
      // 支付成功后跳转到成功页，使用 URL 参数中的 deposit 作为金额
      navigate('/tenant/payments/success', {
        state: {
          propertyId,
          amount: deposit,
          leaseType,
          months,
          leaseStart,
          leaseEnd,
        },
      })
    },
    onTimeout: () => {
      message.warning(t('pages.paymentTimeout'))
    },
    onError: (error) => {
      message.error(error.message || t('pages.monitorError'))
    },
  })

  // 创建支付订单
  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: (order) => {
      message.success(t('pages.paymentOrderCreated'))
      setCurrentOrder(order)
      // 自动开始监控
      startMonitor()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('pages.createOrderFailed'))
    },
  })

  const handleSubmit = (values: any) => {
    if (!propertyId || !payeeId) {
      message.error(t('pages.missingRequiredParams'))
      return
    }
    createPaymentMutation.mutate({
      payeeId,
      propertyId,
      paymentType: values.paymentType,
      amount: values.amount,
      paymentChannel: values.paymentChannel,
    })
  }

  const handleChannelChange = (value: string) => {
    setPaymentChannel(value)
  }

  // 处理"我已确认"按钮 - 跳转到确认支付页面
  const handleIHaveConfirmed = () => {
    // 跳转到确认支付页面，显示付款码
    navigate(`/tenant/payments/create?propertyId=${propertyId}&payeeId=${payeeId}&deposit=${deposit}&leaseType=${leaseType}&months=${months}&leaseStart=${leaseStart}&leaseEnd=${leaseEnd}&step=confirm`)
  }

  // 处理"我已支付"按钮 - 确认支付页面显示付款码，付款成功后隐藏
  const handleIPaid = () => {
    if (currentOrder) {
      // 如果已经在监控中，先停止再重新启动
      if (isMonitoring) {
        stopMonitor().then(() => {
          startMonitor()
        })
      } else {
        startMonitor()
      }
    }
  }

  // 确认支付页面显示付款码（step === 'confirm' 且未付款成功）
  const showPaymentQR = step === 'confirm' && monitorStatus !== 'SUCCESS'

  // 重新开始支付流程
  const handleRetry = () => {
    stopMonitor()
    setCurrentOrder(null)
  }

  // 付款成功后显示成功状态，不再显示付款码
  if (monitorStatus === 'SUCCESS') {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <PageHeader
          title={t('pages.paymentConfirm')}
          subtitle={t('pages.pleaseCompletePayment')}
        />
        <Card>
          <PaymentStatusDisplay status={monitorStatus} onPay={handleIPaid} />
        </Card>
      </Space>
    )
  }

  // 确认支付页面或监控中/超时/错误状态，显示付款码
  if (step === 'confirm' || monitorStatus === 'MONITORING' || monitorStatus === 'TIMEOUT' || monitorStatus === 'ERROR') {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <PageHeader
          title={t('pages.paymentConfirm')}
          subtitle={t('pages.pleaseCompletePayment')}
        />
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card>
              {/* 显示付款码 */}
              {showPaymentQR && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <img
                    src={QR_CODES[paymentChannel as keyof typeof QR_CODES]}
                    alt={paymentChannel === 'WECHAT' ? t('pages.wechatPay') : t('pages.alipay')}
                    style={{ width: 200, height: 200, border: '1px solid #eee' }}
                  />
                  <div style={{ marginTop: 10, color: '#666' }}>
                    {paymentChannel === 'WECHAT' ? t('pages.scanWechatQR') : t('pages.scanAlipayQR')}
                  </div>
                </div>
              )}

              {/* 显示状态信息 */}
              {monitorStatus === 'MONITORING' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <LoadingOutlined spin style={{ fontSize: 24, color: '#1890ff' }} />
                  <div style={{ marginTop: 10, color: '#666' }}>
                    {t('pages.monitoringPayment')}
                  </div>
                </div>
              )}

              {monitorStatus === 'TIMEOUT' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Result
                    status="warning"
                    title={t('pages.paymentTimeout')}
                    subTitle={t('pages.paymentTimeoutMessage')}
                  />
                </div>
              )}

              {monitorStatus === 'ERROR' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Result
                    status="error"
                    title={t('pages.paymentError')}
                    subTitle={t('pages.paymentErrorMessage')}
                  />
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                onClick={handleIPaid}
                loading={isMonitoring}
              >
                {t('pages.iHavePaid')}
              </Button>
              <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 10 }}>
                {t('pages.clickButtonIndicatesPayment')}
              </div>
            </Card>
          </Col>

          {/* 右侧：支付说明 */}
          <Col xs={24} md={12}>
            <Card title={t('pages.paymentProcessInstructions')}>
              <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>{t('pages.paymentStep1')}</li>
                <li>{t('pages.paymentStep2')}</li>
                <li>{t('pages.paymentStep3')}</li>
                <li>{t('pages.paymentStep4')}</li>
                <li>{t('pages.paymentStep5')}</li>
                <li>{t('pages.paymentStep6')}</li>
              </ol>
            </Card>

            <Card title={t('pages.propertyInfo')} style={{ marginTop: 16 }}>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label={t('pages.property')}>{listingQ.data?.title || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('pages.monthlyRent')}>¥ {listingQ.data?.price || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('pages.leaseType')}>{leaseType === 'long' ? t('pages.longTerm') : t('pages.shortTerm')}</Descriptions.Item>
                <Descriptions.Item label={t('pages.leaseDuration')}>{months} {t('pages.months')}</Descriptions.Item>
                <Descriptions.Item label={t('pages.leasePeriod')}>{leaseStart} ~ {leaseEnd}</Descriptions.Item>
                <Descriptions.Item label={t('pages.payableAmount')}>¥ {deposit}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Space>
    )
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('pages.createPayment')}
        subtitle={t('pages.createPaymentSubtitle')}
      />

      <Card>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label={t('pages.property')}>{listingQ.data?.title || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.monthlyRent')}>¥ {listingQ.data?.price || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.leaseType')}>{leaseType === 'long' ? t('pages.longTerm') : t('pages.shortTerm')}</Descriptions.Item>
          <Descriptions.Item label={t('pages.leaseDuration')}>{months} {t('pages.months')}</Descriptions.Item>
          <Descriptions.Item label={t('pages.leasePeriod')}>{leaseStart} ~ {leaseEnd}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={24}>
        {/* 左侧：支付表单 */}
        <Col xs={24} md={12}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                paymentType: 'DEPOSIT',
                paymentChannel: 'ALIPAY',
                amount: deposit,
              }}
            >
              <Form.Item name="paymentType" label={t('pages.paymentType')} rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value="DEPOSIT">{leaseType === 'long' ? t('pages.longTermDeposit') : t('pages.shortTermDeposit')}</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="amount" label={t('pages.amountYuan')}>
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  value={deposit}
                />
              </Form.Item>

              <Form.Item name="paymentChannel" label={t('pages.paymentMethod')} rules={[{ required: true }]}>
                <Radio.Group onChange={(e) => handleChannelChange(e.target.value)}>
                  <Radio value="ALIPAY"><AlipayOutlined /> {t('pages.alipay')}</Radio>
                </Radio.Group>
              </Form.Item>

              <Divider />

              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                {showQRCode && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <img
                      src={QR_CODES[paymentChannel as keyof typeof QR_CODES]}
                      alt={paymentChannel === 'WECHAT' ? t('pages.wechatPay') : t('pages.alipay')}
                      style={{ width: 200, height: 200, border: '1px solid #eee' }}
                    />
                    <div style={{ marginTop: 10, color: '#666' }}>
                      {paymentChannel === 'WECHAT' ? t('pages.scanWechatQR') : t('pages.scanAlipayQR')}
                    </div>
                  </div>
                )}

                {step === 'create' ? (
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => {
                      // 点击"我已确认"直接跳转，不显示付款码
                      form.validateFields().then(values => {
                        handleSubmit(values)
                        // 跳转到确认支付页面，显示付款码
                        navigate(`/tenant/payments/create?propertyId=${propertyId}&payeeId=${payeeId}&deposit=${values.amount || deposit}&leaseType=${leaseType}&months=${months}&leaseStart=${leaseStart}&leaseEnd=${leaseEnd}&step=confirm`)
                      }).catch(() => {
                        // 表单验证失败
                      })
                    }}
                    loading={createPaymentMutation.isPending}
                  >
                    {t('pages.iHaveConfirmed')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleIPaid}
                    loading={isMonitoring}
                  >
                    {t('pages.iHavePaid')}
                  </Button>
                )}
                <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                  {step === 'create' ? t('pages.confirmToShowQR') : t('pages.clickButtonIndicatesPayment')}
                </div>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* 右侧：支付说明 */}
        <Col xs={24} md={12}>
          <Card title={t('pages.paymentProcessInstructions')}>
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>{t('pages.paymentStep1')}</li>
              <li>{t('pages.paymentStep2')}</li>
              <li>{t('pages.paymentStep3')}</li>
              <li>{t('pages.paymentStep4')}</li>
              <li>{t('pages.paymentStep5')}</li>
              <li>{t('pages.paymentStep6')}</li>
            </ol>
          </Card>

          <Card title={t('pages.propertyInfo')} style={{ marginTop: 16 }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t('pages.propertyTitle')}>{listingQ.data?.title || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('pages.monthlyRent')}>¥ {listingQ.data?.price || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('pages.landlord')}>{landlordQ.data?.realName || landlordQ.data?.username || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('pages.contactPhone')}>{landlordQ.data?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('pages.leaseType')}>{leaseType === 'long' ? t('pages.longTerm') : t('pages.shortTerm')}</Descriptions.Item>
              <Descriptions.Item label={t('pages.leaseDuration')}>{months} {t('pages.months')}</Descriptions.Item>
              <Descriptions.Item label={t('pages.leasePeriod')}>{leaseStart} ~ {leaseEnd}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
