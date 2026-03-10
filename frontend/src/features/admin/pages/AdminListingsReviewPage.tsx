import { Button, Card, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      message.success(t('pages.reviewOperationSuccess'))
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] })
    },
    onError: () => {
      message.error(t('pages.reviewOperationFailed'))
    },
  })

  const columns: ColumnsType<ListingRow> = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    { title: t('common.title'), dataIndex: 'title', ellipsis: true },
    { title: t('pages.city'), dataIndex: 'city', width: 100 },
    { title: t('pages.region'), dataIndex: 'region', width: 100 },
    { 
      title: t('common.price'), 
      dataIndex: 'price', 
      width: 100,
      render: (v: number) => v ? `¥ ${v}${t('common.yuanPerMonth')}` : '-'
    },
    { 
      title: t('common.layout'), 
      dataIndex: 'bedrooms', 
      width: 80,
      render: (v: number) => v ? `${v}${t('common.bedrooms')}` : '-'
    },
    {
      title: t('pages.status'),
      dataIndex: 'status',
      width: 100,
      render: (v: ListingRow['status']) => {
        const map: Record<ListingRow['status'], { color: string; text: string }> = {
          pending: { color: 'gold', text: t('pages.pendingReview') },
          available: { color: 'green', text: t('pages.available') },
          rented: { color: 'blue', text: t('pages.rented') },
          offline: { color: 'red', text: t('pages.offline') },
        }
        return <Tag color={map[v]?.color || 'default'}>{map[v]?.text || v}</Tag>
      },
    },
    {
      title: t('common.operation'),
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
            {t('pages.approve')}
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
            {t('pages.reject')}
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
      <PageHeader title={t('pages.adminListingReview')} />
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
