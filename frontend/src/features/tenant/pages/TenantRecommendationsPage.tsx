import { useState, useRef, useEffect } from 'react'
import type { WheelEvent } from 'react'
import { Button, Card, Space, Typography, Empty, Image } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { SettingOutlined } from '@ant-design/icons'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { getRecommendations, getListingImages } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'

const { Text } = Typography

export function TenantRecommendationsPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const isGuest = !auth.user

  const [currentIndex, setCurrentIndex] = useState(0)
  const lastWheelTimeRef = useRef(0)
  const scrollbarRef = useRef<HTMLDivElement>(null)

  const recoQ = useQuery({
    queryKey: ['tenant', 'recommendations'],
    queryFn: () => getRecommendations(),
  })

  const listings = recoQ.data ?? []

  // 当房源切换时，进度条会自动更新（通过 CSS 动画）
  // 如果房源数量很多，可以添加横向滚动逻辑

  // 处理滚轮一次切换一条房源
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (listings.length <= 1) return

    const now = Date.now()
    // 简单节流，避免一次快速滚动跳太多条
    if (now - lastWheelTimeRef.current < 400) {
      return
    }

    if (event.deltaY > 0 && currentIndex < listings.length - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, listings.length - 1))
      lastWheelTimeRef.current = now
    } else if (event.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0))
      lastWheelTimeRef.current = now
    }
  }

  const handlePreferences = () => {
    navigate('/tenant/preferences')
  }

  // 渲染单个房源卡片（左侧封面图 + 右侧展示标题和价格）
  const renderListingCard = (listing: Listing) => (
    <Card
      hoverable
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{ padding: 24 }}
      onClick={() => navigate(`/tenant/listings/${listing.id}`)}
    >
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        {/* 左侧封面图 */}
        <div>
          <ListingThumbnail propertyId={listing.id} />
        </div>

        {/* 右侧展示标题和价格 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '12px 0',
          }}
        >
          <Typography.Title
            level={3}
            style={{
              margin: '0 0 16px 0',
              fontSize: 24,
              fontWeight: 600,
              color: '#1f2937',
              lineHeight: 1.4,
            }}
            ellipsis={{ rows: 2 }}
          >
            {listing.title || '暂无标题'}
          </Typography.Title>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <Text strong style={{ fontSize: 32, color: '#f97316', fontWeight: 700 }}>
              {listing.price ? `¥${listing.price}` : '价格待定'}
            </Text>
            {listing.price && (
              <Text style={{ fontSize: 16, color: '#6b7280', marginLeft: 4 }}>元 / 月</Text>
            )}
          </div>
          <Text
            style={{
              fontSize: 14,
              color: '#3b82f6',
              marginTop: 16,
              cursor: 'pointer',
            }}
          >
            点击查看详情 →
          </Text>
        </div>
      </div>
    </Card>
  )

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
              maxWidth: 1040,
              margin: '0 auto',
              borderRadius: 16,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e5e7eb',
            }}
            bodyStyle={{ padding: 32 }}
          >
            {/* 结果统计说明 */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 500 }}>
                本次根据您的偏好共为您筛选出{' '}
                <Text strong style={{ fontSize: 32, color: '#f97316', fontWeight: 700 }}>
                  {listings.length}
                </Text>{' '}
                套推荐房源
              </Text>
            </div>

            {/* 浏览说明 */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                使用鼠标滚轮每次切换上一/下一套推荐房源，点击卡片查看详情
              </Text>
            </div>

            {/* 单个房源展示 - 滚轮一次切换一个 */}
            <div
              style={{
                maxHeight: 600,
                padding: '0 24px 16px',
              }}
              onWheel={handleWheel}
            >
              {renderListingCard(listings[currentIndex])}
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  {currentIndex + 1} / {listings.length}
                </Text>
              </div>
            </div>
          </Card>

          {/* 底部横向进度条导航 - 图形化显示 */}
          <Card
            style={{
              maxWidth: 1040,
              margin: '0 auto',
              borderRadius: 16,
              padding: '24px 32px',
            }}
          >
            <div
              ref={scrollbarRef}
              style={{
                position: 'relative',
                width: '100%',
                padding: '20px 0',
              }}
            >
              {/* 背景进度条线 */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: '#e5e7eb',
                  borderRadius: 2,
                  transform: 'translateY(-50%)',
                }}
              />
              
              {/* 已完成的进度条 */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  height: 4,
                  backgroundColor: '#1890ff',
                  borderRadius: 2,
                  transform: 'translateY(-50%)',
                  width: listings.length > 1 
                    ? `${(currentIndex / (listings.length - 1)) * 100}%` 
                    : '0%',
                  transition: 'width 0.3s ease',
                }}
              />
              
              {/* 刻度点 */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    onClick={() => setCurrentIndex(index)}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  >
                    {/* 刻度点 */}
                    <div
                      style={{
                        width: index === currentIndex ? 20 : 12,
                        height: index === currentIndex ? 20 : 12,
                        borderRadius: '50%',
                        backgroundColor: index === currentIndex ? '#1890ff' : '#d9d9d9',
                        border: index === currentIndex ? '3px solid #fff' : '2px solid #fff',
                        boxShadow: index === currentIndex ? '0 0 0 3px rgba(24, 144, 255, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                    {/* 数字标签 */}
                    <div
                      style={{
                        position: 'absolute',
                        top: index === currentIndex ? -32 : -28,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: index === currentIndex ? 14 : 12,
                        fontWeight: index === currentIndex ? 'bold' : 'normal',
                        color: index === currentIndex ? '#1890ff' : '#666',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </Space>
  )
}

// 构建图片 URL（与列表页保持一致逻辑）
const buildImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  return imageUrl
}

// 推荐卡片左侧封面图组件
function ListingThumbnail({ propertyId }: { propertyId: number }) {
  const imagesQ = useQuery({
    queryKey: ['tenant', 'listing', propertyId, 'thumbnail'],
    queryFn: () => getListingImages(propertyId),
  })

  const images = imagesQ.data ?? []
  const hasImage = images.length > 0
  const cover = hasImage ? images[0] : null

  return (
    <div
      style={{
        width: 320,
        height: 240,
        overflow: 'hidden',
        borderRadius: 12,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hasImage ? '#f9fafb' : '#f3f4f6',
        transition: 'transform 0.3s ease',
      }}
    >
      {hasImage ? (
        <Image
          src={buildImageUrl(cover!.imageUrl)}
          alt="房源封面"
          width={320}
          height={240}
          style={{ objectFit: 'cover' }}
          preview={false}
        />
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 14 }}>暂无图片</span>
      )}
    </div>
  )
}

