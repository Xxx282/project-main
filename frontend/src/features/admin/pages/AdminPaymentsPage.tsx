import { Table, Tag, Space, Button, Card, Modal, Form, Input, message, Badge, Tabs } from 'antd'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getPendingPayments, getAllPayments, reviewPayment, type PaymentOrder } from '../../payment/api/paymentApi'

export function AdminPaymentsPage() {
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
      message.success('操作成功')
      setReviewModalVisible(false)
      setSelectedOrder(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || '操作失败')
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
      PENDING: { color: 'orange', text: '待房东确认' },
      LANDLORD_CONFIRMED: { color: 'blue', text: '待管理员审核' },
      SUCCESS: { color: 'green', text: '已完成' },
      REJECTED: { color: 'red', text: '已拒绝' },
      REFUNDED: { color: 'default', text: '已退款' },
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
    },
    {
      title: '租户',
      dataIndex: 'payerUsername',
      key: 'payerUsername',
      width: 120,
    },
    {
      title: '房东',
      dataIndex: 'payeeUsername',
      key: 'payeeUsername',
      width: 120,
    },
    {
      title: '房源',
      dataIndex: 'propertyTitle',
      key: 'propertyTitle',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: PaymentOrder) => (
        <Space>
          <Button type="link" size="small" onClick={() => openReviewModal(record)}>
            详情
          </Button>
          {record.status === 'LANDLORD_CONFIRMED' && (
            <>
              <Button type="link" size="small" onClick={() => {
                setSelectedOrder(record)
                setReviewModalVisible(true)
              }}>
                同意
              </Button>
              <Button type="link" size="small" danger onClick={() => {
                reviewMutation.mutate({
                  orderId: record.id,
                  action: 'REJECT',
                  note: '',
                })
              }}>
                退回
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
        title="支付订单管理"
        subtitle="审核租客支付订单"
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pending',
            label: (
              <span>
                待审核 <Badge count={pendingCount} offset={[10, 0]} />
              </span>
            ),
          },
          {
            key: 'all',
            label: '所有订单',
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
        title={selectedOrder?.status === 'LANDLORD_CONFIRMED' ? '审核订单' : '订单详情'}
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false)
          setSelectedOrder(null)
          form.resetFields()
        }}
        footer={selectedOrder?.status === 'LANDLORD_CONFIRMED' ? [
          <Button key="reject" danger onClick={() => handleReview('REJECT')}>
            退回
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleReview('APPROVE')}>
            同意
          </Button>,
        ] : [
          <Button key="close" onClick={() => setReviewModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div>
            <p><strong>订单号：</strong>{selectedOrder.orderNo}</p>
            <p><strong>支付者：</strong>{selectedOrder.payerUsername} ({selectedOrder.payerRealName || '-'})</p>
            <p><strong>收款者：</strong>{selectedOrder.payeeUsername} ({selectedOrder.payeeRealName || '-'})</p>
            <p><strong>房源：</strong>{selectedOrder.propertyTitle}</p>
            <p><strong>类型：</strong>{selectedOrder.paymentType === 'DEPOSIT' ? '押金' : '月租'}</p>
            <p><strong>金额：</strong>¥ {selectedOrder.amount}</p>
            <p><strong>支付方式：</strong>{selectedOrder.paymentChannel === 'WECHAT' ? '微信支付' : '支付宝'}</p>
            <p><strong>状态：</strong>{getStatusTag(selectedOrder.status)}</p>
            <p><strong>创建时间：</strong>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            {selectedOrder.reviewNote && <p><strong>审核备注：</strong>{selectedOrder.reviewNote}</p>}

            {selectedOrder.status === 'LANDLORD_CONFIRMED' && (
              <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item name="note" label="备注">
                  <Input.TextArea rows={3} placeholder="可选填写审核备注" />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>
    </Space>
  )
}
