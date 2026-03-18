import { Button, Card, Popconfirm, Space, Table, Tag, Typography, Empty, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { 
  HomeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import type { Listing } from '../../../shared/api/types'
import { deleteListing, listMyListings } from '../api/landlordApi'

export function LandlordListingsPage() {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const q = useQuery({
    queryKey: ['landlord', 'listings'],
    queryFn: () => listMyListings(),
  })

  const columns: ColumnsType<Listing> = [
    { 
      title: t('common.id'), 
      dataIndex: 'id',
      width: 80,
    },
    { 
      title: t('common.title'), 
      dataIndex: 'title',
      ellipsis: true,
    },
    { 
      title: t('common.cityRegion'), 
      render: (_, row) => `${row.city ?? '-'}/${row.region ?? '-'}`,
      width: 180,
    },
    { 
      title: t('common.price'), 
      dataIndex: 'price', 
      render: (v) => (
        <span style={{ color: '#b4a5e8', fontWeight: 600 }}>
          ￥ {v?.toLocaleString()}
        </span>
      ),
      width: 120,
    },
    {
      title: t('common.layout'),
      render: (_, row) => (
        <Tag color="blue" icon={<HomeOutlined />}>
          {(row.bedrooms ?? '-')} bed / {(row.bathrooms ?? '-')} bath
        </Tag>
      ),
      width: 180,
    },
    {
      title: t('common.decorationOrientation'),
      render: (_, row) => {
        const decoration = row.decoration ? t(`common.${row.decoration}`) : '-'
        const orientation = row.orientation ? t(`common.${row.orientation}`) : '-'
        return (
          <Tag color="purple">
            {decoration} / {orientation}
          </Tag>
        )
      },
      width: 200,
    },
    {
      title: t('common.operation'),
      render: (_, row) => (
        <Space>
          <Link to={`/landlord/listings/${row.id}/edit`}>
            <Button 
              type="link" 
              icon={<EditOutlined />}
              style={{ color: '#b4a5e8' }}
            >
              {t('common.edit')}
            </Button>
          </Link>
          <Popconfirm
            title={t('pages.confirmDeleteListing')}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
            onConfirm={async () => {
              await deleteListing(row.id)
              void message.success(t('pages.deleted'))
              void q.refetch()
            }}
          >
            <Button 
              danger 
              type="link" 
              icon={<DeleteOutlined />}
              size="small"
            >
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 180,
      fixed: 'right' as const,
    },
  ]

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* 页面标题 */}
          <Card 
            style={{ 
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: 'none',
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div>
                <FileTextOutlined style={{ fontSize: 32, color: '#b4a5e8', marginRight: 12 }} />
                <Typography.Title level={2} style={{ margin: 0, display: 'inline-block', color: '#1a1a1a' }}>
                  {t('pages.landlordListingsManagement')}
                </Typography.Title>
              </div>
              <Link to="/landlord/listings/new">
                <Button 
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    height: 40,
                    fontWeight: 600,
                  }}
                >
                  {t('pages.publishListing')}
                </Button>
              </Link>
            </div>
          </Card>

          {/* 表格卡片 */}
          <Card 
            style={{ 
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: 'none',
            }}
          >
            {q.data && q.data.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: '#999' }}>
                    {t('pages.noListings')}
                  </span>
                }
              >
                <Link to="/landlord/listings/new">
                  <Button 
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
                      border: 'none',
                    }}
                  >
                    {t('pages.publishListing')}
                  </Button>
                </Link>
              </Empty>
            ) : (
              <Table<Listing>
                rowKey="id"
                loading={q.isLoading}
                columns={columns}
                dataSource={q.data ?? []}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => t('pages.totalListings', { total }),
                }}
                scroll={{ x: 1200 }}
              />
            )}
          </Card>
        </Space>
      </div>
    </div>
  )
}

