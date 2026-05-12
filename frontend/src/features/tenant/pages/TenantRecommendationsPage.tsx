import { useState, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Button, Card, Space, Typography, Empty, Image, Slider, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SettingOutlined } from '@ant-design/icons'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { getRecommendations, getListingImages } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'
import { useAuthModal } from '../../auth/context/AuthModalContext'

const { Text } = Typography

export function TenantRecommendationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const auth = useAuth()
  const { openAuthModal } = useAuthModal()
  const isGuest = !auth.user

  const [currentIndex, setCurrentIndex] = useState(0)
  const dragStartXRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  // 用于防止拖动过程中的误点击
  const dragPreventClickRef = useRef(false)
  const dragClickResetTimeoutRef = useRef<number | null>(null)
  const lastSwipeTimeRef = useRef(0)

  const recoQ = useQuery({
    queryKey: ['tenant', 'recommendations'],
    queryFn: () => getRecommendations(),
  })

  const listings = recoQ.data ?? []

  // 当房源切换时，进度条会自动更新（通过 CSS 动画）
  // 鼠标左右拖动切换当前房源
  const SWIPE_THRESHOLD = 80 // 触发切换的最小水平位移（像素）
  const SWIPE_COOLDOWN = 300 // 连续切换的最小时间间隔（毫秒）
  const DRAG_MOVE_THRESHOLD = 10 // 认为是拖动而不是点击的最小位移（像素）

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (listings.length <= 1) return
    // 如果上一次还有未清理的防点击延迟，先清掉
    if (dragClickResetTimeoutRef.current !== null) {
      window.clearTimeout(dragClickResetTimeoutRef.current)
      dragClickResetTimeoutRef.current = null
    }
    dragStartXRef.current = event.clientX
    isDraggingRef.current = true
    dragPreventClickRef.current = false
  }

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false
    dragStartXRef.current = null

    // 如果本次操作被认为是拖动，则稍微延迟清除防点击标记，避免刚结束拖动时的误触
    if (dragPreventClickRef.current) {
      dragClickResetTimeoutRef.current = window.setTimeout(() => {
        dragPreventClickRef.current = false
        dragClickResetTimeoutRef.current = null
      }, 80)
    } else {
      dragPreventClickRef.current = false
    }
  }

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) return
    if (listings.length <= 1) return

    const now = Date.now()
    if (now - lastSwipeTimeRef.current < SWIPE_COOLDOWN) {
      return
    }

    const deltaX = event.clientX - dragStartXRef.current

    // 只要移动超过一定距离，就认为是拖动，后续点击应被屏蔽
    if (Math.abs(deltaX) > DRAG_MOVE_THRESHOLD) {
      dragPreventClickRef.current = true
    }

    // 向左拖动（deltaX 为负数） -> 下一套
    if (deltaX < -SWIPE_THRESHOLD && currentIndex < listings.length - 1) {
      setCurrentIndex((prev) => Math.min(prev + 1, listings.length - 1))
      lastSwipeTimeRef.current = now
      handleMouseUpOrLeave()
    }

    // 向右拖动（deltaX 为正数） -> 上一套
    if (deltaX > SWIPE_THRESHOLD && currentIndex > 0) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0))
      lastSwipeTimeRef.current = now
      handleMouseUpOrLeave()
    }
  }

  const handlePreferences = () => {
    openAuthModal('preferences')
  }

  const handleSliderChange = (value: number | [number, number]) => {
    if (listings.length <= 0) return
    const v = Array.isArray(value) ? value[0] : value
    const targetIndex = Math.min(Math.max(v - 1, 0), listings.length - 1)
    setCurrentIndex(targetIndex)
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
      styles={{ body: { padding: 24 } }}
      onClick={() => {
        // 拖动过程中（包括刚结束的极短时间内）不响应点击，避免误进详情
        if (dragPreventClickRef.current) return
        navigate(`/tenant/listings/${listing.id}`)
      }}
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
            {listing.title || t('pages.noTitle')}
          </Typography.Title>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <Text strong style={{ fontSize: 32, color: '#f97316', fontWeight: 700 }}>
              {listing.price ? `¥${listing.price}` : t('pages.pricePending')}
            </Text>
            {listing.price && (
              <Text style={{ fontSize: 16, color: '#6b7280', marginLeft: 4 }}>{t('common.yuanPerMonth')}</Text>
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
            {t('pages.clickToViewDetails')}
          </Text>
        </div>
      </div>
    </Card>
  )

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title={t('pages.tenantRecommendations')}
        subtitle={isGuest ? t('pages.mockRecommendations') : t('pages.recommendationsSubtitle')}
        extra={
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={handlePreferences}
          >
            {t('pages.preferenceSettings')}
          </Button>
        }
      />

      {recoQ.isLoading ? (
        <Card style={{
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}>
          <div style={{ padding: 48 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>
            </div>
          </div>
        </Card>
      ) : listings.length === 0 ? (
        <Card style={{
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}>
          <Empty
            description={t('pages.noRecommendations')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handlePreferences}>
              {t('pages.setPreferencesForRecommendations')}
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          <Card
            style={{
              maxWidth: 1040,
              margin: '0 auto',
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: '1px solid #f3f4f6',
            }}
            styles={{ body: { padding: 32 } }}
          >
            {/* 结果统计说明 */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 500 }}>
                {t('pages.filteredResults')}{' '}
                <Text strong style={{ fontSize: 32, color: '#f97316', fontWeight: 700 }}>
                  {listings.length}
                </Text>{' '}
                {t('pages.recommendedListings')}
              </Text>
            </div>

            {/* 浏览说明 */}
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {t('pages.browseInstructions')}
              </Text>
            </div>

            {/* 轮播式房源展示 - translateX 平滑横向切换 */}
            <div
              style={{
                maxHeight: 600,
                padding: '0 24px 16px',
                overflow: 'hidden',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            >
              <div
                style={{
                  display: 'flex',
                  transition: 'transform 0.45s ease-in-out',
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    style={{
                      flex: '0 0 100%',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {renderListingCard(listing)}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  {currentIndex + 1} / {listings.length}
                </Text>
              </div>
            </div>
          </Card>

          {/* 底部横向滑动条导航 - 可拖动切换 */}
          <Card
            style={{
              maxWidth: 1040,
              margin: '0 auto',
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: '1px solid #f3f4f6',
              padding: '24px 32px',
            }}
          >
            <div style={{ padding: '8px 16px 0' }}>
              <Slider
                min={1}
                max={listings.length}
                step={1}
                value={currentIndex + 1}
                onChange={handleSliderChange}
                tooltip={{ formatter: (value) => `${t('pages.listing')} ${value} ${t('pages.set')}` }}
              />
            </div>
          </Card>
        </>
      )}
    </Space>
      </div>
    </div>
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
  const { t } = useTranslation()
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
          alt={t('common.coverImage')}
          width={320}
          height={240}
          style={{ objectFit: 'cover' }}
          preview={false}
        />
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 14 }}>{t('common.noImage')}</span>
      )}
    </div>
  )
}

