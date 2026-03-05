import { Card, Form, InputNumber, Radio, Button, Space, Descriptions, Divider, Row, Col, message } from 'antd'
import { WechatOutlined, AlipayOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListing, getLandlordInfo } from '../../tenant/api/tenantApi'
import { createPayment } from '../../payment/api/paymentApi'

// 固定二维码图片
const QR_CODES = {
  WECHAT: '/wx.jpg',
  ALIPAY: '/alipay.jpg',
}

export function TenantPaymentPage() {
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
      message.success('支付订单已创建，请等待管理员审核')
      navigate('/tenant/payments')
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '创建订单失败')
    },
  })

  const handleSubmit = (values: any) => {
    if (!propertyId || !payeeId) {
      message.error('缺少必要参数')
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
        title="发起支付"
        subtitle="扫码支付，创建订单后等待管理员审核"
      />

      <Card>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="房源">{listingQ.data?.title || '-'}</Descriptions.Item>
          <Descriptions.Item label="月租金">¥ {listingQ.data?.price || '-'}</Descriptions.Item>
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
              <Form.Item name="paymentType" label="支付类型" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio value="DEPOSIT">押金</Radio>
                  <Radio value="RENT">月租</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="amount" label="金额（元）" rules={[{ required: true, message: '请输入支付金额' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={100}
                  placeholder="请输入支付金额"
                />
              </Form.Item>

              <Form.Item name="paymentChannel" label="支付方式" rules={[{ required: true }]}>
                <Radio.Group onChange={(e) => handleChannelChange(e.target.value)}>
                  <Radio value="WECHAT"><WechatOutlined /> 微信支付</Radio>
                  <Radio value="ALIPAY"><AlipayOutlined /> 支付宝</Radio>
                </Radio.Group>
              </Form.Item>

              <Divider />

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <img 
                    src={QR_CODES[paymentChannel as keyof typeof QR_CODES]} 
                    alt={paymentChannel === 'WECHAT' ? '微信支付' : '支付宝'}
                    style={{ width: 200, height: 200, border: '1px solid #eee' }}
                  />
                  <div style={{ marginTop: 10, color: '#666' }}>
                    {paymentChannel === 'WECHAT' ? '请使用微信扫码支付' : '请使用支付宝扫码支付'}
                  </div>
                </div>

                <Button type="primary" htmlType="submit" size="large" block loading={createPaymentMutation.isPending}>
                  我已支付
                </Button>
                <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                  点击上方按钮表示您已完成支付
                </div>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* 右侧：支付说明 */}
        <Col xs={24} md={12}>
          <Card title="支付流程说明">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>选择支付类型（押金/月租）</li>
              <li>填写支付金额</li>
              <li>选择支付方式（微信/支付宝）</li>
              <li>使用对应APP扫描右侧二维码完成支付</li>
              <li>点击"我已支付"创建订单</li>
              <li>等待管理员审核通过</li>
            </ol>
          </Card>

          <Card title="房源信息" style={{ marginTop: 16 }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="房源标题">{listingQ.data?.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="月租金">¥ {listingQ.data?.price || '-'}</Descriptions.Item>
              <Descriptions.Item label="房东">{landlordQ.data?.realName || landlordQ.data?.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{landlordQ.data?.phone || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
