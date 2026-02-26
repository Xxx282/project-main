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
        subtitle="支持查看房源详细信息"
      />
      <Card>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="ID">{listingQ.data?.id ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="标题">{listingQ.data?.title ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="城市">{listingQ.data?.city ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="区域">{listingQ.data?.region ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="租金">
            {listingQ.data ? `¥ ${listingQ.data.price} / 月` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {listingQ.data?.status === 'available' && '可租'}
            {listingQ.data?.status === 'rented' && '已租'}
            {listingQ.data?.status === 'offline' && '下架'}
            {!listingQ.data?.status && '-'}
          </Descriptions.Item>
          <Descriptions.Item label="卧室数">{listingQ.data?.bedrooms ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="卫生间数">{listingQ.data?.bathrooms ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="面积">{listingQ.data?.area ? `${listingQ.data.area} m²` : '-'}</Descriptions.Item>
          <Descriptions.Item label="总楼层">{listingQ.data?.totalFloors ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="朝向">
            {listingQ.data?.orientation === 'east' && '东'}
            {listingQ.data?.orientation === 'south' && '南'}
            {listingQ.data?.orientation === 'west' && '西'}
            {listingQ.data?.orientation === 'north' && '北'}
            {!listingQ.data?.orientation && '-'}
          </Descriptions.Item>
          <Descriptions.Item label="装修">
            {listingQ.data?.decoration === 'rough' && '毛坯'}
            {listingQ.data?.decoration === 'simple' && '简装'}
            {listingQ.data?.decoration === 'fine' && '精装'}
            {listingQ.data?.decoration === 'luxury' && '豪华'}
            {!listingQ.data?.decoration && '-'}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{listingQ.data?.description ?? '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  )
}

