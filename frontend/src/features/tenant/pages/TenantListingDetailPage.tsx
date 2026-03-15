import { Card, Descriptions, Space, Button, App } from 'antd'

import { HeartOutlined, HeartFilled, ArrowLeftOutlined, MessageOutlined, DollarOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListing, checkFavorite, addFavorite, removeFavorite, getListingImages, getOrCreateConversation, getLandlordInfo } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'
import { useAuthModal } from '../../auth/context/AuthModalContext'
import { ImageGallery } from '../../../shared/components/ImageGallery'

export function TenantListingDetailPage() {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const { openAuthModal } = useAuthModal()
  const propertyId = Number(id)

  const listingQ = useQuery({
    queryKey: ['tenant', 'listing', id],
    queryFn: () => getListing(propertyId),
    enabled: Boolean(id),
  })

  // 查询房东信息
  const landlordQ = useQuery({
    queryKey: ['tenant', 'listing', id, 'landlord'],
    queryFn: () => getLandlordInfo(propertyId),
    enabled: Boolean(id),
  })

  // 查询收藏状态（仅登录用户）
  const favoriteQ = useQuery({
    queryKey: ['tenant', 'favorite', id],
    queryFn: () => checkFavorite(propertyId),
    enabled: Boolean(id) && Boolean(auth.user),
  })

  // 获取房源图片
  const imagesQ = useQuery({
    queryKey: ['tenant', 'listing', id, 'images'],
    queryFn: () => getListingImages(propertyId),
    enabled: Boolean(id),
  })

  // 添加收藏 mutation
  const addFavoriteMutation = useMutation({
    mutationFn: () => addFavorite(propertyId),
    onSuccess: () => {
      message.success(t('pages.favoriteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['tenant', 'favorite', id] })
    },
    onError: () => {
      message.error(t('pages.favoriteFailed'))
    },
  })

  // 取消收藏 mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: () => removeFavorite(propertyId),
    onSuccess: () => {
      message.success(t('pages.unfavoriteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['tenant', 'favorite', id] })
    },
    onError: () => {
      message.error(t('pages.unfavoriteFailed'))
    },
  })

  // 咨询房东 mutation
  const contactLandlordMutation = useMutation({
    mutationFn: () => getOrCreateConversation(propertyId, landlordQ.data?.id!),
    onSuccess: (conversation) => {
      navigate(`/tenant/chats/${conversation.id}`)
    },
    onError: () => {
      message.error(t('pages.contactLandlordFailed') || '联系房东失败')
    },
  })

  const handleFavorite = () => {
    if (!auth.user) {
      openAuthModal('login')
      return
    }
    if (favoriteQ.data) {
      removeFavoriteMutation.mutate()
    } else {
      addFavoriteMutation.mutate()
    }
  }

  const handleContactLandlord = () => {
    if (!auth.user) {
      openAuthModal('login')
      return
    }
    if (!landlordQ.data?.id) {
      message.error(t('pages.landlordInfoNotReady'))
      return
    }
    contactLandlordMutation.mutate()
  }

  const handlePayment = () => {
    if (!auth.user) {
      openAuthModal('login')
      return
    }
    if (!landlordQ.data?.id) {
      message.error(t('pages.landlordInfoNotReady'))
      return
    }
    navigate(`/tenant/contract?propertyId=${propertyId}&payeeId=${landlordQ.data.id}`)
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      {/* 返回按钮 */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 8 }}
      >
        {t('common.back')}
      </Button>
      <PageHeader
        title={t('pages.listingDetails')}
        extra={
          <Space>
            {auth.user && (
              <Button
                type={favoriteQ.data ? 'primary' : 'default'}
                danger={favoriteQ.data}
                icon={favoriteQ.data ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleFavorite}
                loading={favoriteQ.isLoading || addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
              >
                {favoriteQ.data ? t('pages.favorited') : t('pages.favorite')}
              </Button>
            )}
            {!auth.user && (
              <Button
                type="default"
                icon={<HeartOutlined />}
                onClick={handleFavorite}
              >
                {t('pages.favorite')}
              </Button>
            )}
            {auth.user && auth.user.role !== 'landlord' && (
              <>
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={handleContactLandlord}
                  loading={contactLandlordMutation.isPending}
                >
                  {t('pages.contactLandlord') || '咨询房东'}
                </Button>
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={handlePayment}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  {t('pages.payNow') || '立即支付'}
                </Button>
              </>
            )}
          </Space>
        }
      />
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: 'none',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        {/* 图片画廊 */}
        <ImageGallery images={imagesQ.data ?? []} />

        <Descriptions
          bordered
          column={2}
          size="middle"
          labelStyle={{ padding: '14px 16px', fontWeight: 500, background: '#fafafa' }}
          contentStyle={{ padding: '14px 16px' }}
          style={{ marginTop: 24 }}
        >
          <Descriptions.Item label={t('common.id')}>{listingQ.data?.id ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('common.title')}>{listingQ.data?.title ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.city')}>{listingQ.data?.city ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.region')}>{listingQ.data?.region ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('common.price')}>
            {listingQ.data ? `¥ ${listingQ.data.price} ${t('common.yuanPerMonth')}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('pages.status')}>
            {listingQ.data?.status === 'available' && t('pages.available')}
            {listingQ.data?.status === 'rented' && t('pages.rented')}
            {listingQ.data?.status === 'offline' && t('pages.offline')}
            {!listingQ.data?.status && '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('pages.bedroomCountLabel')}>{listingQ.data?.bedrooms ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.bathroomCountLabel')}>{listingQ.data?.bathrooms ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.areaLabel')}>{listingQ.data?.area ? `${listingQ.data.area} m²` : '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.totalFloorsLabel')}>{listingQ.data?.totalFloors ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('pages.orientationLabel')}>
            {listingQ.data?.orientation === 'east' && t('common.east')}
            {listingQ.data?.orientation === 'south' && t('common.south')}
            {listingQ.data?.orientation === 'west' && t('common.west')}
            {listingQ.data?.orientation === 'north' && t('common.north')}
            {!listingQ.data?.orientation && '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('pages.decorationLabel')}>
            {listingQ.data?.decoration === 'rough' && t('common.rough')}
            {listingQ.data?.decoration === 'simple' && t('common.simple')}
            {listingQ.data?.decoration === 'fine' && t('common.fine')}
            {listingQ.data?.decoration === 'luxury' && t('common.luxury')}
            {!listingQ.data?.decoration && '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('pages.description')} span={2}>{listingQ.data?.description ?? '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
      </div>
    </div>
  )
}
