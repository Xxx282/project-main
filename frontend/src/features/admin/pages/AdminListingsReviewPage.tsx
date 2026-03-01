import { Button, Card, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listListingsForReview, reviewListing } from '../api/adminApi'

type ListingRow = {
  id: string
  title: string
  city: string
  region: string
  price: number
  bedrooms: number
  status: 'pending' | 'available' | 'rented' | 'offline'
}

export function AdminListingsReviewPage() {
  const queryClient = useQueryClient()

  const q = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: async () => {
      try {
        return await listListingsForReview()
      } catch {
        return []
      }
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      await reviewListing(id, approved ? 'approved' : 'rejected')
    },
    onSuccess: () => {
      message.success('审核操作成功')
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] })
    },
    onError: () => {
      message.error('审核操作失败')
    },
  })

  const columns: ColumnsType<ListingRow> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '城市', dataIndex: 'city', width: 100 },
    { title: '区域', dataIndex: 'region', width: 100 },
    { 
      title: '租金', 
      dataIndex: 'price', 
      width: 100,
      render: (v: number) => v ? `¥ ${v}/月` : '-'
    },
    { 
      title: '户型', 
      dataIndex: 'bedrooms', 
      width: 80,
      render: (v: number) => v ? `${v}室` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: ListingRow['status']) => {
        const map: Record<ListingRow['status'], { color: string; text: string }> = {
          pending: { color: 'gold', text: '待审核' },
          available: { color: 'green', text: '可租' },
          rented: { color: 'blue', text: '已租' },
          offline: { color: 'red', text: '下架' },
        }
        return <Tag color={map[v]?.color || 'default'}>{map[v]?.text || v}</Tag>
      },
    },
    {
      title: '操作',
      width: 150,
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={row.status !== 'pending'}
            loading={reviewMutation.isPending}
            onClick={() => {
              reviewMutation.mutate({ id: row.id, approved: true })
            }}
          >
            通过
          </Button>
          <Button
            size="small"
            danger
            disabled={row.status !== 'pending'}
            loading={reviewMutation.isPending}
            onClick={() => {
              reviewMutation.mutate({ id: row.id, approved: false })
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
    title: x.title ?? '-',
    city: x.city ?? '-',
    region: x.region ?? '-',
    price: x.price ?? 0,
    bedrooms: x.bedrooms ?? 0,
    status: (x.status as ListingRow['status']) || 'pending',
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
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </Space>
  )
}
