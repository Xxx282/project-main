import { Card, Descriptions, Space, Button, message } from 'antd'
import { HeartOutlined, HeartFilled, ArrowLeftOutlined, MessageOutlined, DollarOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListing, checkFavorite, addFavorite, removeFavorite, getListingImages, getOrCreateConversation } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'
import { ImageGallery } from '../../../shared/components/ImageGallery'

export function TenantListingDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const propertyId = Number(id)

  const listingQ = useQuery({
    queryKey: ['tenant', 'listing', id],
    queryFn: () => getListing(propertyId),
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

  const handleFavorite = () => {
    if (favoriteQ.data) {
      removeFavoriteMutation.mutate()
    } else {
      addFavoriteMutation.mutate()
    }
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
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
              <>
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => {
                    if (!listingQ.data) return
                    navigate(`/tenant/contract?propertyId=${propertyId}&payeeId=${listingQ.data.landlordId}`)
                  }}
                >
                  {t('pages.pay')}
                </Button>
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={async () => {
                    if (!listingQ.data) return
                    try {
                      // 获取或创建对话（如果有已有对话则返回，没有则创建）
                      const conversation = await getOrCreateConversation(propertyId, listingQ.data!.landlordId!)
                      // 跳转到对话页面
                      navigate(`/tenant/chats/${conversation.id}`)
                    } catch (error) {
                      message.error(t('pages.consultFailed'))
                    }
                  }}
                >
                  {t('pages.consultLandlord')}
                </Button>
              </>
            )}
            {auth.user ? (
              <Button
                type={favoriteQ.data ? 'primary' : 'default'}
                danger={favoriteQ.data}
                icon={favoriteQ.data ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleFavorite}
                loading={favoriteQ.isLoading || addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
              >
                {favoriteQ.data ? t('pages.favorited') : t('pages.favorite')}
              </Button>
            ) : null}
          </Space>
        }
      />
      <Card>
        {/* 图片画廊 */}
        <ImageGallery images={imagesQ.data ?? []} />

        <Descriptions bordered size="small" column={2}>
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
  )
}
