import { Button, Card, Popconfirm, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { deleteListing, listMyListings } from '../api/landlordApi'

export function LandlordListingsPage() {
  const q = useQuery({
    queryKey: ['landlord', 'listings'],
    queryFn: () => listMyListings(),
  })

  const columns: ColumnsType<Listing> = [
    { title: 'ID', dataIndex: 'id' },
    { title: '标题', dataIndex: 'title' },
    { title: '租金', dataIndex: 'rent', render: (v) => `¥ ${v}` },
    {
      title: '操作',
      render: (_, row) => (
        <Space>
          <Link to={`/landlord/listings/${row.id}/edit`}>编辑</Link>
          <Popconfirm
            title="确定删除该房源？"
            okText="删除"
            cancelText="取消"
            onConfirm={async () => {
              await deleteListing(row.id)
              void message.success('已删除')
              void q.refetch()
            }}
          >
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="房东-房源管理"
        subtitle="（占位页）后续接入 /listings 的房东 CRUD"
        extra={
          <Link to="/landlord/listings/new">
            <Button type="primary">发布房源</Button>
          </Link>
        }
      />
      <Card>
        <Table<Listing>
          rowKey="id"
          loading={q.isLoading}
          columns={columns}
          dataSource={q.data ?? []}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </Space>
  )
}

