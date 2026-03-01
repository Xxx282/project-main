import { Button, Card, Form, Image, Input, InputNumber, Select, Space, Table, Tag, Modal, Checkbox, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SettingOutlined, SearchOutlined } from '@ant-design/icons'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getListingImages, listListings } from '../api/tenantApi'
import type { Listing } from '../../../shared/api/types'
import { useAuth } from '../../auth/context/AuthContext'

// 字段设置相关
interface FieldOption {
  key: string
  title: string
  visible: boolean
}

// 默认字段配置（新增封面图列）
const DEFAULT_FIELDS: FieldOption[] = [
  { key: 'cover', title: '封面图', visible: true },
  { key: 'id', title: 'ID', visible: true },
  { key: 'title', title: '标题', visible: true },
  { key: 'cityRegion', title: '城市/区域', visible: true },
  { key: 'price', title: '租金', visible: true },
  { key: 'layout', title: '户型', visible: true },
  { key: 'decorationOrientation', title: '装修/朝向', visible: true },
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
  const [params, setParams] = useSearchParams()
  const auth = useAuth()
  const isGuest = !auth.user
  const cardMaxWidth = isGuest ? 1160 : 980

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const listingsQ = useQuery({
    queryKey: ['tenant', 'listings', Object.fromEntries(params)],
    queryFn: () =>
      listListings({
        q: params.get('q') || undefined,
        city: params.get('city') || undefined,
        region: params.get('region') || undefined,
        bedrooms: params.get('bedrooms') ? Number(params.get('bedrooms')) : undefined,
        minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
        maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
      }),
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
        title: '房源信息',
        render: (_, row) => <ListingRow listing={row} settings={settings} />,
      },
    ]

    return cols
  }, [])

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
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader title="房源列表" align="center" />

      {/* 关键词搜索面板 */}
      <Card
        style={{
          maxWidth: cardMaxWidth,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          <Form.Item name="q" style={{ marginBottom: 0, flex: 1, maxWidth: 500 }}>
            <Input
              size="large"
              placeholder="搜索房源标题"
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
                搜索
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
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="房源列表"
        extra={
          <Button icon={<SettingOutlined />} onClick={handleOpenSettings}>
            显示字段
          </Button>
        }
        style={{
          maxWidth: cardMaxWidth,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}
      >
        <Table<Listing>
          rowKey="id"
          loading={listingsQ.isLoading}
          columns={columns}
          dataSource={listingsQ.data ?? []}
          size="middle"
          pagination={{ pageSize: 4, showSizeChanger: false, placement: ['bottomCenter'] }}
        />
      </Card>

      {/* 字段显示设置弹窗 */}
      <Modal
        title="显示字段设置"
        open={settingsModalOpen}
        onOk={handleSaveSettings}
        onCancel={() => setSettingsModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="cover" valuePropName="checked">
            <Checkbox>封面图</Checkbox>
          </Form.Item>
          <Form.Item name="id" valuePropName="checked">
            <Checkbox>ID</Checkbox>
          </Form.Item>
          <Form.Item name="title" valuePropName="checked">
            <Checkbox>标题</Checkbox>
          </Form.Item>
          <Form.Item name="cityRegion" valuePropName="checked">
            <Checkbox>城市/区域</Checkbox>
          </Form.Item>
          <Form.Item name="price" valuePropName="checked">
            <Checkbox>租金</Checkbox>
          </Form.Item>
          <Form.Item name="layout" valuePropName="checked">
            <Checkbox>户型</Checkbox>
          </Form.Item>
          <Form.Item name="decorationOrientation" valuePropName="checked">
            <Checkbox>装修/朝向</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

function ListingRow({ listing, settings }: { listing: Listing; settings: FieldOption[] }) {
  const navigate = useNavigate()
  const show = (key: string) => settings.find((s) => s.key === key && s.visible)

  const orientationLabel =
    (listing.orientation === 'east' && '东') ||
    (listing.orientation === 'south' && '南') ||
    (listing.orientation === 'west' && '西') ||
    (listing.orientation === 'north' && '北') ||
    undefined

  const decorationLabel =
    (listing.decoration === 'rough' && '毛坯') ||
    (listing.decoration === 'simple' && '简装') ||
    (listing.decoration === 'fine' && '精装') ||
    (listing.decoration === 'luxury' && '豪华') ||
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
        padding: 16,
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
                {(listing.bedrooms ?? '-')}室 {(listing.bathrooms ?? '-')}卫
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
            <span style={{ fontSize: 12, color: '#9ca3af' }}>元 / 月</span>
            <span style={{ fontSize: 12, color: '#3b82f6' }}>查看详情</span>
          </div>
        )}
      </div>
    </div>
  )
}

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
          alt="房源封面"
          width={220}
          height={160}
          style={{ objectFit: 'cover' }}
          preview={false}
        />
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 12 }}>暂无图片</span>
      )}
    </div>
  )
}

