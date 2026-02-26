import { Card, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listLandlordInquiries } from '../api/landlordApi'

type InquiryRow = {
  id: string
  listingId: number
  fromUser: string
  message: string
  status: 'pending' | 'replied' | 'closed'
}

const columns: ColumnsType<InquiryRow> = [
  { title: 'ID', dataIndex: 'id' },
  { title: '房源', dataIndex: 'listingId' },
  { title: '来自', dataIndex: 'fromUser' },
  { title: '内容', dataIndex: 'message' },
  {
    title: '状态',
    dataIndex: 'status',
    render: (v: InquiryRow['status']) => {
      const map: Record<InquiryRow['status'], { color: string; text: string }> = {
        pending: { color: 'gold', text: '待处理' },
        replied: { color: 'green', text: '已回复' },
        closed: { color: 'default', text: '已关闭' },
      }
      return <Tag color={map[v].color}>{map[v].text}</Tag>
    },
  },
]

export function LandlordInquiriesPage() {
  const q = useQuery({
    queryKey: ['landlord', 'inquiries'],
    queryFn: () => listLandlordInquiries(),
  })

  const data: InquiryRow[] = (q.data ?? []).map((x) => ({
    id: x.id,
    listingId: x.listingId,
    fromUser: x.tenantUsername ?? '租客',
    message: x.message,
    status: x.status,
  }))

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="房东-咨询管理" subtitle="（占位页）后续接入 /landlord/inquiries" />
      <Card>
        <Typography.Paragraph type="secondary">
          后续会支持：回复、关闭、按状态过滤、按房源筛选。
        </Typography.Paragraph>
        <Table<InquiryRow>
          rowKey="id"
          loading={q.isLoading}
          columns={columns}
          dataSource={data}
          pagination={false}
        />
      </Card>
    </Space>
  )
}

