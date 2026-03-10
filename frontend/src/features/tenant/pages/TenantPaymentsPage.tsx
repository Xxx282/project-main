import { Table, Tag, Space, Card } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getMyPayments, type PaymentOrder } from '../../payment/api/paymentApi'

export function TenantPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tenant', 'payments'],
    queryFn: () => getMyPayments(0, 20),
  })

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: '待审核' },
      SUCCESS: { color: 'green', text: '已支付' },
      REJECTED: { color: 'red', text: '已拒绝' },
      REFUNDED: { color: 'default', text: '已退款' },
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const getPaymentTypeTag = (type: string) => {
    return <Tag color="blue">{type === 'DEPOSIT' ? '押金' : '月租'}</Tag>
  }

  const getChannelTag = (channel: string) => {
    return <Tag>{channel === 'WECHAT' ? '微信支付' : '支付宝'}</Tag>
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
    },
    {
      title: '房源',
      dataIndex: 'propertyTitle',
      key: 'propertyTitle',
      ellipsis: true,
    },
    {
      title: '支付类型',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
      render: (type: string) => getPaymentTypeTag(type),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `¥ ${amount}`,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentChannel',
      key: 'paymentChannel',
      width: 100,
      render: (channel: string) => getChannelTag(channel),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ]

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="我的支付订单"
        subtitle="查看支付记录和订单状态"
      />
      <Card>
        <Table
          columns={columns}
          dataSource={data?.content || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: (data?.number || 0) + 1,
            pageSize: data?.size || 10,
            total: data?.totalElements || 0,
            onChange: () => {},
          }}
        />
      </Card>
    </Space>
  )
}
