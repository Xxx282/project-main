import { Table, Tag, Space, Button, Card, Modal, Form, Input, message, Badge, Tabs } from 'antd'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getPendingPayments, getAllPayments, reviewPayment, type PaymentOrder } from '../../payment/api/paymentApi'
import { useTranslation } from 'react-i18next'

export function AdminPaymentsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('pending')
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 待审核订单
  const pendingQuery = useQuery({
    queryKey: ['admin', 'payments', 'pending'],
    queryFn: async () => {
      const data = await getPendingPayments(0, 20)
      console.log('[AdminPayments] getPendingPayments 返回:', data)
      return data
    },
    enabled: activeTab === 'pending',
  })

  // 所有订单
  const allQuery = useQuery({
    queryKey: ['admin', 'payments', 'all'],
    queryFn: () => getAllPayments(0, 20),
    enabled: activeTab === 'all',
  })

  // 审核订单
  const reviewMutation = useMutation({
    mutationFn: reviewPayment,
    onSuccess: () => {
      message.success(t('pages.operationSuccess'))
      setReviewModalVisible(false)
      setSelectedOrder(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('pages.operationFailed'))
    },
  })

  const handleReview = (action: 'APPROVE' | 'REJECT') => {
    if (!selectedOrder) return
    const values = form.getFieldsValue()
    reviewMutation.mutate({
      orderId: selectedOrder.id,
      action,
      note: values.note,
    })
  }

  const openReviewModal = (order: PaymentOrder) => {
    setSelectedOrder(order)
    setReviewModalVisible(true)
  }

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: t('payment.status.pendingLandlordConfirm') },
      LANDLORD_CONFIRMED: { color: 'blue', text: t('payment.status.pendingAdminReview') },
      SUCCESS: { color: 'green', text: t('payment.status.completed') },
      REJECTED: { color: 'red', text: t('payment.status.rejected') },
      REFUNDED: { color: 'default', text: t('payment.status.refunded') },
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const columns = [
    {
      title: t('payment.orderNo'),
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
    },
    {
      title: t('payment.tenant'),
      dataIndex: 'payerUsername',
      key: 'payerUsername',
      width: 120,
    },
    {
      title: t('payment.landlord'),
      dataIndex: 'payeeUsername',
      key: 'payeeUsername',
      width: 120,
    },
    {
      title: t('payment.property'),
      dataIndex: 'propertyTitle',
      key: 'propertyTitle',
      ellipsis: true,
    },
    {
      title: t('payment.status.title'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 180,
      render: (_: any, record: PaymentOrder) => (
        <Space>
          <Button type="link" size="small" onClick={() => openReviewModal(record)}>
            {t('common.detail')}
          </Button>
          {record.status === 'LANDLORD_CONFIRMED' && (
            <>
              <Button type="link" size="small" onClick={() => {
                setSelectedOrder(record)
                setReviewModalVisible(true)
              }}>
                {t('common.agree')}
              </Button>
              <Button type="link" size="small" danger onClick={() => {
                reviewMutation.mutate({
                  orderId: record.id,
                  action: 'REJECT',
                  note: '',
                })
              }}>
                {t('common.reject')}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const pendingCount = pendingQuery.data?.totalElements || 0

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('payment.adminTitle')}
        subtitle={t('payment.adminSubtitle')}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pending',
            label: (
              <span>
                {t('payment.pendingReview')} <Badge count={pendingCount} offset={[10, 0]} />
              </span>
            ),
          },
          {
            key: 'all',
            label: t('payment.allOrders'),
          },
        ]}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={activeTab === 'pending' ? pendingQuery.data?.content || [] : allQuery.data?.content || []}
          loading={pendingQuery.isLoading || allQuery.isLoading}
          rowKey="id"
          pagination={{
            total: activeTab === 'pending' ? pendingQuery.data?.totalElements : allQuery.data?.totalElements,
          }}
        />
      </Card>

      {/* 审核弹窗 */}
      <Modal
        title={selectedOrder?.status === 'LANDLORD_CONFIRMED' ? t('payment.reviewOrder') : t('payment.orderDetail')}
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false)
          setSelectedOrder(null)
          form.resetFields()
        }}
        footer={selectedOrder?.status === 'LANDLORD_CONFIRMED' ? [
          <Button key="reject" danger onClick={() => handleReview('REJECT')}>
            {t('common.reject')}
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleReview('APPROVE')}>
            {t('common.agree')}
          </Button>,
        ] : [
          <Button key="close" onClick={() => setReviewModalVisible(false)}>
            {t('common.close')}
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div>
            <p><strong>{t('payment.orderNo')}：</strong>{selectedOrder.orderNo}</p>
            <p><strong>{t('payment.payer')}：</strong>{selectedOrder.payerUsername} ({selectedOrder.payerRealName || '-'})</p>
            <p><strong>{t('payment.payee')}：</strong>{selectedOrder.payeeUsername} ({selectedOrder.payeeRealName || '-'})</p>
            <p><strong>{t('payment.property')}：</strong>{selectedOrder.propertyTitle}</p>
            <p><strong>{t('payment.type')}：</strong>{selectedOrder.paymentType === 'DEPOSIT' ? t('payment.deposit') : t('payment.monthlyRent')}</p>
            <p><strong>{t('payment.amount')}：</strong>¥ {selectedOrder.amount}</p>
            <p><strong>{t('payment.paymentMethod')}：</strong>{selectedOrder.paymentChannel === 'WECHAT' ? t('payment.wechatPay') : t('payment.alipay')}</p>
            <p><strong>{t('payment.status.title')}：</strong>{getStatusTag(selectedOrder.status)}</p>
            <p><strong>{t('payment.createdAt')}：</strong>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            {selectedOrder.reviewNote && <p><strong>{t('payment.reviewNote')}：</strong>{selectedOrder.reviewNote}</p>}

            {selectedOrder.status === 'LANDLORD_CONFIRMED' && (
              <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item name="note" label={t('payment.note')}>
                  <Input.TextArea rows={3} placeholder={t('payment.notePlaceholder')} />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>
    </Space>
  )
}
