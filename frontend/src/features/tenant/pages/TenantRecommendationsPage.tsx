import { useState } from 'react'
import { Button, Card, Descriptions, Space, Typography, Empty, Carousel, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { SettingOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { getRecommendations } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'

const { Text } = Typography

// 朝向映射
const orientationMap: Record<string, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
}

// 装修映射
const decorationMap: Record<string, string> = {
  rough: '毛坯',
  simple: '简装',
  fine: '精装',
  luxury: '豪华',
}

// 状态映射
const statusMap: Record<string, string> = {
  available: '可租',
  rented: '已租',
  offline: '下架',
}

export function TenantRecommendationsPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const isGuest = !auth.user

  const [currentIndex, setCurrentIndex] = useState(0)

  const recoQ = useQuery({
    queryKey: ['tenant', 'recommendations'],
    queryFn: () => getRecommendations(),
  })

  const listings = recoQ.data ?? []

  const handlePreferences = () => {
    navigate('/tenant/preferences')
  }

  // 渲染单个房源卡片
  const renderListingCard = (listing: Listing) => (
    <Card
      hoverable
      style={{ maxWidth: 800, margin: '0 auto' }}
      onClick={() => navigate(`/tenant/listings/${listing.id}`)}
    >
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="ID">{listing.id}</Descriptions.Item>
        <Descriptions.Item label="标题">{listing.title}</Descriptions.Item>
        <Descriptions.Item label="城市">{listing.city ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="区域">{listing.region ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="租金">
          {listing.price ? `¥ ${listing.price} / 月` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {listing.status ? statusMap[listing.status] : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="卧室数">{listing.bedrooms ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="卫生间数">{listing.bathrooms ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="面积">{listing.area ? `${listing.area} m²` : '-'}</Descriptions.Item>
        <Descriptions.Item label="总楼层">{listing.totalFloors ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="朝向">
          {listing.orientation ? orientationMap[listing.orientation] : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="装修">
          {listing.decoration ? decorationMap[listing.decoration] : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>
          {listing.description ?? '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )

  // 处理上一个
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // 处理下一个
  const handleNext = () => {
    if (currentIndex < listings.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="租客-个性化推荐"
        subtitle={isGuest ? '无后端时自动使用 mock 推荐' : '根据您的偏好为您推荐房源'}
        extra={
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={handlePreferences}
          >
            偏好设置
          </Button>
        }
      />

      {listings.length === 0 ? (
        <Card style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Empty
            description="暂无推荐房源"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handlePreferences}>
              设置偏好获取推荐
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          <Card
            style={{
              maxWidth: 840,
              margin: '0 auto',
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: '1px solid #f3f4f6',
            }}
          >
            {/* 卡片切换导航 */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button
                  icon={<LeftOutlined />}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  上一条
                </Button>
                <Text>
                  {currentIndex + 1} / {listings.length}
                </Text>
                <Button
                  onClick={handleNext}
                  disabled={currentIndex === listings.length - 1}
                >
                  下一条 <RightOutlined />
                </Button>
              </Space>
              <Text type="secondary">
                点击卡片查看详情
              </Text>
            </div>

            {/* 房源卡片展示 */}
            <div style={{ padding: '0 20px' }}>
              {renderListingCard(listings[currentIndex])}
            </div>
          </Card>

          {/* 底部缩略图导航 */}
          <Card
            style={{
              maxWidth: 840,
              margin: '0 auto',
              borderRadius: 12,
            }}
          >
            <div style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 8,
            }}>
              {listings.map((listing, index) => (
                <Card
                  key={listing.id}
                  size="small"
                  hoverable
                  onClick={() => setCurrentIndex(index)}
                  style={{
                    minWidth: 120,
                    maxWidth: 150,
                    cursor: 'pointer',
                    border: index === currentIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    opacity: index === currentIndex ? 1 : 0.7,
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontWeight: index === currentIndex ? 600 : 400,
                      color: index === currentIndex ? '#1890ff' : '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {listing.title?.substring(0, 8) ?? '无标题'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      ¥{listing.price}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </>
      )}
    </Space>
  )
}

