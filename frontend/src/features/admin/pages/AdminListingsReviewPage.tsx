import { Button, Card, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listListingsForReview, reviewListing } from '../api/adminApi'

type ListingRow = {
  id: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
}

export function AdminListingsReviewPage() {
  const q = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: async () => {
      try {
        return await listListingsForReview()
      } catch {
        return [{ id: '2001', title: '示例房源', status: 'pending' as const }]
      }
    },
  })

  const columns: ColumnsType<ListingRow> = [
    { title: 'ID', dataIndex: 'id' },
    { title: '标题', dataIndex: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: ListingRow['status']) => {
        const map: Record<ListingRow['status'], { color: string; text: string }> = {
          pending: { color: 'gold', text: '待审核' },
          approved: { color: 'green', text: '已通过' },
          rejected: { color: 'red', text: '已拒绝' },
        }
        return <Tag color={map[v].color}>{map[v].text}</Tag>
      },
    },
    {
      title: '操作',
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={row.status !== 'pending'}
            onClick={async () => {
              try {
                await reviewListing(row.id, 'approved')
                void message.success('已通过')
                void q.refetch()
              } catch {
                void message.error('操作失败（无后端时为 mock 行为）')
              }
            }}
          >
            通过
          </Button>
          <Button
            size="small"
            danger
            disabled={row.status !== 'pending'}
            onClick={async () => {
              try {
                await reviewListing(row.id, 'rejected')
                void message.success('已拒绝')
                void q.refetch()
              } catch {
                void message.error('操作失败（无后端时为 mock 行为）')
              }
            }}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ]

  const data: ListingRow[] = (q.data ?? []).map((x) => ({
    id: String(x.id),
    title: (x as any).title ?? '-',
    status: (((x as any).status ?? 'pending') as ListingRow['status']),
  }))

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="管理员-房源审核" />
      <Card>
        <Table<ListingRow>
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

