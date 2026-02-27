import { Button, Card, Form, Input, InputNumber, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { createInquiry, listMyInquiries } from '../api/tenantApi'

type InquiryRow = {
  id: string
  listingId: number
  message: string
  status: 'pending' | 'replied' | 'closed'
}

const columns: ColumnsType<InquiryRow> = [
  { title: 'ID', dataIndex: 'id' },
  { title: '房源', dataIndex: 'listingId' },
  { title: '内容', dataIndex: 'message' },
  {
    title: '状态',
    dataIndex: 'status',
    render: (v: InquiryRow['status']) => {
      const map: Record<InquiryRow['status'], { color: string; text: string }> = {
        pending: { color: 'gold', text: '待回复' },
        replied: { color: 'green', text: '已回复' },
        closed: { color: 'default', text: '已关闭' },
      }
      return <Tag color={map[v].color}>{map[v].text}</Tag>
    },
  },
]

export function TenantInquiriesPage() {
  const inquiriesQ = useQuery({
    queryKey: ['tenant', 'inquiries'],
    queryFn: () => listMyInquiries(),
  })

  const [form] = Form.useForm<{ listingId: number; message: string }>()

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="租客-咨询" subtitle="支持提交与记录查看（无后端时自动 mock）" />

      <Card title="发起咨询" style={{ maxWidth: 720, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            try {
              await createInquiry(v)
              void message.success('已提交')
              form.resetFields()
              void inquiriesQ.refetch()
            } catch {
              void message.error('提交失败')
            }
          }}
        >
          <Form.Item name="listingId" label="房源 ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="例如 1001" />
          </Form.Item>
          <Form.Item name="message" label="咨询内容" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请输入咨询内容" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form>
      </Card>

      <Card title="我的咨询记录">
        <Table<InquiryRow>
          rowKey="id"
          loading={inquiriesQ.isLoading}
          columns={columns}
          dataSource={(inquiriesQ.data ?? []) as InquiryRow[]}
          pagination={false}
        />
      </Card>
    </Space>
  )
}

