import { Card, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { getRecommendations } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'

export function TenantRecommendationsPage() {
  const auth = useAuth()
  const isGuest = !auth.user
  const cardMaxWidth = isGuest ? 1160 : 980

  const recoQ = useQuery({
    queryKey: ['tenant', 'recommendations'],
    queryFn: () => getRecommendations(),
  })

  const columns: ColumnsType<Listing> = [
    { title: '标题', dataIndex: 'title' },
    { title: '区域', dataIndex: 'region', render: (v) => v ?? '-' },
    { title: '租金', dataIndex: 'price', render: (v) => `¥ ${v}` },
    { title: '操作', render: (_, row) => <Link to={`/tenant/listings/${row.id}`}>详情</Link> },
  ]

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader title="租客-个性化推荐" subtitle="无后端时自动使用 mock 推荐" />
      <Card
        style={{
          maxWidth: cardMaxWidth,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}
      >
        <Table<Listing>
          rowKey="id"
          loading={recoQ.isLoading}
          columns={columns}
          dataSource={recoQ.data ?? []}
          size="middle"
          pagination={false}
        />
      </Card>
    </Space>
  )
}

