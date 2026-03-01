import { Card, Descriptions, Space, Button, message } from 'antd'
import { HeartOutlined, HeartFilled, ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListing, checkFavorite, addFavorite, removeFavorite, getListingImages } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'
import { ImageGallery } from '../../../shared/components/ImageGallery'

export function TenantListingDetailPage() {
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
      message.success('收藏成功')
      queryClient.invalidateQueries({ queryKey: ['tenant', 'favorite', id] })
    },
    onError: () => {
      message.error('收藏失败')
    },
  })

  // 取消收藏 mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: () => removeFavorite(propertyId),
    onSuccess: () => {
      message.success('取消收藏成功')
      queryClient.invalidateQueries({ queryKey: ['tenant', 'favorite', id] })
    },
    onError: () => {
      message.error('取消收藏失败')
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
        返回
      </Button>
      <PageHeader
        title="房源详情"
        extra={
          auth.user ? (
            <Button
              type={favoriteQ.data ? 'primary' : 'default'}
              danger={favoriteQ.data}
              icon={favoriteQ.data ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleFavorite}
              loading={favoriteQ.isLoading || addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
            >
              {favoriteQ.data ? '已收藏' : '收藏'}
            </Button>
          ) : null
        }
      />
      <Card>
        {/* 图片画廊 */}
        <ImageGallery images={imagesQ.data ?? []} />

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
