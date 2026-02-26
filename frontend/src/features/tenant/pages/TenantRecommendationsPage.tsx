import { Card, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { getRecommendations } from '../api/tenantApi'

export function TenantRecommendationsPage() {
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
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="租客-个性化推荐" subtitle="无后端时自动使用 mock 推荐" />
      <Card>
        <Table<Listing>
          rowKey="id"
          loading={recoQ.isLoading}
          columns={columns}
          dataSource={recoQ.data ?? []}
          pagination={false}
        />
      </Card>
    </Space>
  )
}

