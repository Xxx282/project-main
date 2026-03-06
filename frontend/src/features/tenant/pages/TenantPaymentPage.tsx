import { Card, Form, InputNumber, Radio, Button, Space, Descriptions, Divider, Row, Col, message } from 'antd'
import { WechatOutlined, AlipayOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListing, getLandlordInfo } from '../../tenant/api/tenantApi'
import { createPayment } from '../../payment/api/paymentApi'

// 固定二维码图片
const QR_CODES = {
  WECHAT: '/wx.jpg',
  ALIPAY: '/alipay.jpg',
}

export function TenantPaymentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const propertyId = Number(searchParams.get('propertyId'))
  const payeeId = Number(searchParams.get('payeeId'))
  const [form] = Form.useForm()
  const [paymentChannel, setPaymentChannel] = useState<string>('WECHAT')

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

  // 创建支付订单
  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      message.success(t('pages.paymentOrderCreated'))
      navigate('/tenant/payments')
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
                paymentChannel: 'WECHAT',
              }}
            >
              <Form.Item name="paymentType" label={t('pages.paymentType')} rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value="DEPOSIT">{t('pages.deposit')}</Radio>
                  <Radio value="RENT">{t('pages.rent')}</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="amount" label={t('pages.amountYuan')} rules={[{ required: true, message: t('pages.enterPaymentAmount') }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={100}
                  placeholder={t('pages.enterPaymentAmount')}
                />
              </Form.Item>

              <Form.Item name="paymentChannel" label={t('pages.paymentMethod')} rules={[{ required: true }]}>
                <Radio.Group onChange={(e) => handleChannelChange(e.target.value)}>
                  <Radio value="WECHAT"><WechatOutlined /> {t('pages.wechatPay')}</Radio>
                  <Radio value="ALIPAY"><AlipayOutlined /> {t('pages.alipay')}</Radio>
                </Radio.Group>
              </Form.Item>

              <Divider />

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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

                <Button type="primary" htmlType="submit" size="large" block loading={createPaymentMutation.isPending}>
                  {t('pages.iHavePaid')}
                </Button>
                <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                  {t('pages.clickButtonIndicatesPayment')}
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
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
