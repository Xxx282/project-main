import { Button, Card, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { listListings } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'

const KEY = 'compareListingIds'

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveIds(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export function TenantComparePage() {
  const auth = useAuth()
  const isGuest = !auth.user
  const cardMaxWidth = isGuest ? 1160 : 980

  const ids = loadIds()
  const listingsQ = useQuery({
    queryKey: ['tenant', 'listings', 'compare'],
    queryFn: () => listListings({}),
  })

  const data = listingsQ.data?.filter((x) => ids.includes(String(x.id))) ?? []

  const columns: ColumnsType<Listing> = [
    { title: '标题', dataIndex: 'title' },
    { title: '区域', dataIndex: 'region', render: (v) => v ?? '-' },
    { title: '租金', dataIndex: 'price', render: (v) => `¥ ${v}` },
    { title: '卧室', dataIndex: 'bedrooms', render: (v) => v ?? '-' },
    { title: '卫生间', dataIndex: 'bathrooms', render: (v) => v ?? '-' },
    { title: '面积', dataIndex: 'area', render: (v) => v ?? '-' },
  ]

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader title="租客-房源对比" subtitle="（占位页）后续实现对比表与收藏" />
      <Card
        style={{
          maxWidth: cardMaxWidth,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}
      >
        <Typography.Paragraph>
          目前先用本地 localStorage 存一份对比列表。你可以从房源列表页进入详情后再扩展"加入对比"按钮。
        </Typography.Paragraph>
        <Space style={{ marginBottom: 12 }}>
          <Button
            onClick={() => {
              saveIds(['1', '2'])
              window.location.reload()
            }}
          >
            填充示例对比
          </Button>
          <Button
            danger
            onClick={() => {
              saveIds([])
              window.location.reload()
            }}
          >
            清空
          </Button>
          <Link to="/tenant/listings">返回房源列表</Link>
        </Space>
        <Table<Listing>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={listingsQ.isLoading}
          size="middle"
          pagination={false}
        />
      </Card>
    </Space>
  )
}
