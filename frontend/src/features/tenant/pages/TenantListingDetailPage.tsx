import { Card, Descriptions, Space } from 'antd'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListing } from '../api/tenantApi'

export function TenantListingDetailPage() {
  const { id } = useParams()
  const listingQ = useQuery({
    queryKey: ['tenant', 'listing', id],
    queryFn: () => getListing(id!),
    enabled: Boolean(id),
  })

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="租客-房源详情"
        subtitle="（占位页）后续接入 /listings/:id"
      />
      <Card>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Listing ID">{id}</Descriptions.Item>
          <Descriptions.Item label="标题">{listingQ.data?.title ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="租金">
            {listingQ.data ? `¥ ${listingQ.data.rent} / 月` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="区域">{listingQ.data?.region ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="卧室数">{listingQ.data?.bedrooms ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="卫生间数">{listingQ.data?.bathrooms ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="面积">{listingQ.data?.area ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="描述">{listingQ.data?.description ?? '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  )
}

