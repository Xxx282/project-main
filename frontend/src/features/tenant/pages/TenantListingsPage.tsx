import { Button, Card, Form, Image, Input, Space, Table, Modal, Checkbox, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SettingOutlined, SearchOutlined, RobotOutlined } from '@ant-design/icons'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListingImages, listListings, aiSearch } from '../api/tenantApi'
import type { Listing } from '../../../shared/api/types'
import { useAuth } from '../../auth/context/AuthContext'

// 字段设置相关
interface FieldOption {
  key: string
  title: string
  visible: boolean
}

// 默认字段配置（新增封面图列）
// Note: Field titles will be translated in the component using useTranslation
const DEFAULT_FIELDS: FieldOption[] = [
  { key: 'cover', title: 'cover', visible: true },
  { key: 'id', title: 'id', visible: true },
  { key: 'title', title: 'title', visible: true },
  { key: 'cityRegion', title: 'cityRegion', visible: true },
  { key: 'price', title: 'price', visible: true },
  { key: 'layout', title: 'layout', visible: true },
  { key: 'decorationOrientation', title: 'decorationOrientation', visible: true },
]

// 构建缩略图 URL - 与图片画廊保持一致逻辑
const buildImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  return imageUrl
}

export function TenantListingsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const auth = useAuth()
  const isGuest = !auth.user
  const cardMaxWidth = isGuest ? 1160 : 980

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const q = params.get('q') || undefined
  const useAiSearch = !!q?.trim()

  const listingsQ = useQuery({
    queryKey: ['tenant', 'listings', Object.fromEntries(params)],
    queryFn: async () => {
      if (useAiSearch) {
        try {
          const res = await aiSearch(q.trim(), 50)
          return { listings: res.properties, aiAnswer: res.aiAnswer }
        } catch {
          // AI 服务不可用时回退到普通搜索
          const listings = await listListings({ q })
          return { listings, aiAnswer: null }
        }
      }
      const listings = await listListings({
        q,
        city: params.get('city') || undefined,
        region: params.get('region') || undefined,
        bedrooms: params.get('bedrooms') ? Number(params.get('bedrooms')) : undefined,
        minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
        maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
      })
      return { listings, aiAnswer: null }
    },
  })

  const STORAGE_KEY = 'listings_columns'

  function loadColumnSettings(): FieldOption[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved: FieldOption[] = JSON.parse(raw)
        const map = new Map(saved.map((f) => [f.key, f]))
        // 合并新增的默认字段（例如封面图）
        DEFAULT_FIELDS.forEach((field) => {
          if (!map.has(field.key)) {
            map.set(field.key, field)
          }
        })
        return Array.from(map.values())
      }
    } catch {}
    // 默认配置
    return DEFAULT_FIELDS
  }

  function saveColumnSettings(fields: FieldOption[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
  }

  // 动态生成列配置（改为卡片式行布局）
  const columns = useMemo(() => {
    const settings = loadColumnSettings()
    const cols: ColumnsType<Listing> = [
      {
        title: t('common.listingInfo'),
        render: (_, row) => <ListingRow listing={row} settings={settings} />,
      },
    ]

    return cols
  }, [t])

  // 打开设置弹窗
  const handleOpenSettings = () => {
    form.setFieldsValue(
      loadColumnSettings().reduce((acc, field) => {
        acc[field.key] = field.visible
        return acc
      }, {} as Record<string, boolean>),
    )
    setSettingsModalOpen(true)
  }

  // 保存设置
  const handleSaveSettings = () => {
    form.validateFields().then((values) => {
      const newSettings = loadColumnSettings().map((field) => ({
        ...field,
        visible: values[field.key] ?? false,
      }))
      saveColumnSettings(newSettings)
      setSettingsModalOpen(false)
      // 刷新页面以应用新设置
      window.location.reload()
    })
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
      padding: '16px',
    }}>
      <div style={{ maxWidth: cardMaxWidth, margin: '0 auto' }}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <PageHeader title={t('pages.listings')} align="center" />

          {/* AI 智能搜索面板 */}
          <Card
            style={{
              width: '100%',
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: '1px solid #f3f4f6',
              background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
            }}
          >
        <Form
          layout="inline"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
          initialValues={Object.fromEntries(params)}
          onFinish={(v) => {
            const next = new URLSearchParams()
            if (v.q) next.set('q', v.q)
            setParams(next)
          }}
        >
          <Form.Item name="q" style={{ marginBottom: 0, flex: 1, maxWidth: 560 }}>
            <Input
              size="large"
              placeholder={t('pages.aiSearchPlaceholder') || t('pages.searchListings')}
              allowClear
              style={{
                width: '100%',
                height: 48,
                borderRadius: 24,
                fontSize: 16,
              }}
              prefix={<SearchOutlined style={{ color: '#999', fontSize: 18 }} />}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space size={12}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                style={{
                  height: 48,
                  paddingInline: 32,
                  borderRadius: 24,
                  fontSize: 16,
                  background: '#fff',
                  color: '#667eea',
                  fontWeight: 600,
                }}
              >
                {t('common.search')}
              </Button>
              <Button
                size="large"
                style={{
                  height: 48,
                  paddingInline: 24,
                  borderRadius: 24,
                  fontSize: 16,
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  color: '#fff',
                }}
                onClick={() => {
                  setParams(new URLSearchParams())
                }}
              >
                {t('common.reset')}
              </Button>
            </Space>
          </Form.Item>
            </Form>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
              {t('pages.aiSearchHint')}
            </div>
          </Card>

          {/* AI 搜索总结（仅当有搜索词且有 AI 回答时显示） */}
          {listingsQ.data?.aiAnswer && (
            <Card
              size="small"
              style={{
                width: '100%',
                borderRadius: 12,
                border: '1px solid #e6f4ff',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
              }}
            >
              <Space align="start" size={12}>
                <RobotOutlined style={{ fontSize: 24, color: '#1890ff', marginTop: 2 }} />
                <div>
                  <Typography.Text strong style={{ fontSize: 13, color: '#0958d9' }}>
                    {t('pages.aiSearchResult') || 'AI 搜索解读'}
                  </Typography.Text>
                  <Typography.Paragraph
                    style={{ marginBottom: 0, marginTop: 4, whiteSpace: 'pre-wrap' }}
                  >
                    {listingsQ.data.aiAnswer}
                  </Typography.Paragraph>
                </div>
              </Space>
            </Card>
          )}

          <Card
            title={t('pages.listings')}
            extra={
              <Button icon={<SettingOutlined />} onClick={handleOpenSettings}>
                {t('common.showFields')}
              </Button>
            }
            style={{
              width: '100%',
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: '1px solid #f3f4f6',
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <Table<Listing>
              rowKey="id"
              loading={listingsQ.isLoading}
              columns={columns}
              dataSource={listingsQ.data?.listings ?? []}
              size="middle"
              pagination={{ pageSize: 4, showSizeChanger: false, placement: ['bottomCenter'] }}
            />
          </Card>

          {/* 字段显示设置弹窗 */}
          <Modal
            title={t('common.fieldDisplaySettings')}
            open={settingsModalOpen}
            onOk={handleSaveSettings}
            onCancel={() => setSettingsModalOpen(false)}
            okText={t('common.save')}
            cancelText={t('common.cancel')}
          >
            <Form form={form} layout="vertical">
              <Form.Item name="cover" valuePropName="checked">
                <Checkbox>{t('common.cover')}</Checkbox>
              </Form.Item>
              <Form.Item name="id" valuePropName="checked">
                <Checkbox>{t('common.id')}</Checkbox>
              </Form.Item>
              <Form.Item name="title" valuePropName="checked">
                <Checkbox>{t('common.title')}</Checkbox>
              </Form.Item>
              <Form.Item name="cityRegion" valuePropName="checked">
                <Checkbox>{t('common.cityRegion')}</Checkbox>
              </Form.Item>
              <Form.Item name="price" valuePropName="checked">
                <Checkbox>{t('common.price')}</Checkbox>
              </Form.Item>
              <Form.Item name="layout" valuePropName="checked">
                <Checkbox>{t('common.layout')}</Checkbox>
              </Form.Item>
              <Form.Item name="decorationOrientation" valuePropName="checked">
                <Checkbox>{t('common.decorationOrientation')}</Checkbox>
              </Form.Item>
            </Form>
          </Modal>
        </Space>
      </div>
    </div>
  )
}

function ListingRow({ listing, settings }: { listing: Listing; settings: FieldOption[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const show = (key: string) => settings.find((s) => s.key === key && s.visible)

  const orientationLabel =
    (listing.orientation === 'east' && t('common.east')) ||
    (listing.orientation === 'south' && t('common.south')) ||
    (listing.orientation === 'west' && t('common.west')) ||
    (listing.orientation === 'north' && t('common.north')) ||
    undefined

  const decorationLabel =
    (listing.decoration === 'rough' && t('common.rough')) ||
    (listing.decoration === 'simple' && t('common.simple')) ||
    (listing.decoration === 'fine' && t('common.fine')) ||
    (listing.decoration === 'luxury' && t('common.luxury')) ||
    undefined

  const handleClick = () => {
    navigate(`/tenant/listings/${listing.id}`)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        padding: '12px 16px',
        gap: 16,
        cursor: 'pointer',
        borderRadius: 8,
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.backgroundColor = '#f9fafb'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.06)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
      }}
    >
      {show('cover') && (
        <div>
          <ListingThumbnail propertyId={listing.id} />
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          borderBottom: '1px solid #f3f4f6',
          paddingBottom: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {show('title') && (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                {listing.title}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#4b5563' }}>
            {show('layout') && (
              <span>
                {(listing.bedrooms ?? '-')}{t('common.bedrooms')} {(listing.bathrooms ?? '-')}{t('common.bathrooms')}
              </span>
            )}
            {typeof listing.area === 'number' && <span>{listing.area}㎡</span>}
            {show('cityRegion') && (
              <span>
                {listing.city ?? '-'} {listing.region ? `/ ${listing.region}` : ''}
              </span>
            )}
          </div>

          {show('decorationOrientation') && (decorationLabel || orientationLabel) && (
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {decorationLabel}
              {decorationLabel && orientationLabel && ' / '}
              {orientationLabel}
            </div>
          )}
        </div>

        {show('price') && (
          <div
            style={{
              minWidth: 120,
              textAlign: 'right',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            <Typography.Text strong style={{ color: '#f97316', fontSize: 26 }}>
              ¥ {listing.price}
            </Typography.Text>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{t('common.yuanPerMonth')}</span>
            <span style={{ fontSize: 12, color: '#3b82f6' }}>{t('common.viewDetails')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

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
        width: 220,
        height: 160,
        overflow: 'hidden',
        borderRadius: 10,
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hasImage ? '#f9fafb' : '#f3f4f6',
      }}
    >
      {hasImage ? (
        <Image
          src={buildImageUrl(cover!.imageUrl)}
          alt={t('common.coverImage')}
          width={220}
          height={160}
          style={{ objectFit: 'cover' }}
          preview={false}
        />
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 12 }}>{t('common.noImage')}</span>
      )}
    </div>
  )
}

