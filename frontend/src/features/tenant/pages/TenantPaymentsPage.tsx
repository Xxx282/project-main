import { Table, Tag, Space, Card } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getMyPayments } from '../../payment/api/paymentApi'
import { useTranslation } from 'react-i18next'

export function TenantPaymentsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['tenant', 'payments'],
    queryFn: () => getMyPayments(0, 20),
  })

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

  const getPaymentTypeTag = (type: string) => {
    return <Tag color="blue">{type === 'DEPOSIT' ? t('payment.deposit') : t('payment.monthlyRent')}</Tag>
  }

  const getChannelTag = (channel: string) => {
    return <Tag>{channel === 'WECHAT' ? t('payment.wechatPay') : t('payment.alipay')}</Tag>
  }

  const columns = [
    {
      title: t('payment.orderNo'),
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
    },
    {
      title: t('payment.property'),
      dataIndex: 'propertyTitle',
      key: 'propertyTitle',
      ellipsis: true,
    },
    {
      title: t('payment.type'),
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
      render: (type: string) => getPaymentTypeTag(type),
    },
    {
      title: t('payment.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `¥ ${amount}`,
    },
    {
      title: t('payment.paymentMethod'),
      dataIndex: 'paymentChannel',
      key: 'paymentChannel',
      width: 100,
      render: (channel: string) => getChannelTag(channel),
    },
    {
      title: t('payment.status.title'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t('payment.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ]

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('payment.myPayments')}
        subtitle={t('payment.myPaymentsSubtitle')}
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
