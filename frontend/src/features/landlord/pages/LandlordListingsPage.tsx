import { Button, Card, Popconfirm, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { deleteListing, listMyListings } from '../api/landlordApi'

// 装修类型映射
const decorationMap: Record<string, string> = {
  rough: '毛坯',
  simple: '简装',
  fine: '精装',
  luxury: '豪华',
}

// 朝向类型映射
const orientationMap: Record<string, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
}

export function LandlordListingsPage() {
  const q = useQuery({
    queryKey: ['landlord', 'listings'],
    queryFn: () => listMyListings(),
  })

  const columns: ColumnsType<Listing> = [
    { title: 'ID', dataIndex: 'id' },
    { title: '标题', dataIndex: 'title' },
    { title: '城市/区域', render: (_, row) => `${row.city ?? '-'}/${row.region ?? '-'}` },
    { title: '租金', dataIndex: 'price', render: (v) => `¥ ${v}` },
    {
      title: '户型',
      render: (_, row) => (
        <Tag>
          {(row.bedrooms ?? '-') + '室'} / {(row.bathrooms ?? '-') + '卫'}
        </Tag>
      ),
    },
    {
      title: '装修/朝向',
      render: (_, row) => {
        const decoration = row.decoration ? decorationMap[row.decoration] ?? row.decoration : '-'
        const orientation = row.orientation ? orientationMap[row.orientation] ?? row.orientation : '-'
        return (
          <Tag>
            {decoration} / {orientation}
          </Tag>
        )
      },
    },
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

