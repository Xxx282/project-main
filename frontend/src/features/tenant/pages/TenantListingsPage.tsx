import { Button, Card, Form, Image, Input, Space, Table, Modal, Checkbox, Typography, InputNumber, Select, Collapse, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SettingOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons'
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
// Note: Field titles will be translated in the component using useTranslation
const DEFAULT_FIELDS: FieldOption[] = [
  { key: 'cover', title: 'cover', visible: true },
  { key: 'id', title: 'id', visible: true },
  { key: 'title', title: 'title', visible: false },
  { key: 'cityRegion', title: 'cityRegion', visible: true },
  { key: 'price', title: 'price', visible: true },
  { key: 'layout', title: 'layout', visible: true },
  { key: 'decorationOrientation', title: 'decorationOrientation', visible: true },
]

// 预设城市选项（可勾选）
const CITY_OPTIONS = [
  { value: '杭州', labelKey: 'pages.cityHangzhou' },
  { value: '上海', labelKey: 'pages.cityShanghai' },
  { value: '北京', labelKey: 'pages.cityBeijing' },
  { value: '深圳', labelKey: 'pages.cityShenzhen' },
  { value: '广州', labelKey: 'pages.cityGuangzhou' },
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
  const [filterOpen, setFilterOpen] = useState(false)
  const [form] = Form.useForm()

  const listingsQ = useQuery({
    queryKey: ['tenant', 'listings', Object.fromEntries(params)],
    queryFn: () => {
      const cities = params.get('city')?.split(',').filter(Boolean) ?? []
      return listListings({
        q: params.get('q') || undefined,
        city: cities.length === 1 ? cities[0] : undefined,
        region: params.get('region') || undefined,
        bedrooms: params.get('bedrooms') ? Number(params.get('bedrooms')) : undefined,
        minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
        maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
        page: 0,
        size: 50,
      })
    },
  })

  // 解析城市、房型、朝向、装修多选（用于筛选，勾选即生效）
  const cityFilter = useMemo(
    () => params.get('city')?.split(',').filter(Boolean) ?? [],
    [params]
  )
  const bedroomFilter = useMemo(
    () => params.get('bedrooms')?.split(',').filter(Boolean).map(Number).filter(Boolean) ?? [],
    [params]
  )
  const orientationFilter = useMemo(
    () => params.get('orientation')?.split(',').filter(Boolean) ?? [],
    [params]
  )
  const decorationFilter = useMemo(
    () => params.get('decoration')?.split(',').filter(Boolean) ?? [],
    [params]
  )

  const filteredListings = useMemo(() => {
    const list = listingsQ.data ?? []
    return list.filter((item) => {
      if (cityFilter.length && item.city && !cityFilter.includes(item.city)) return false
      if (bedroomFilter.length && item.bedrooms && !bedroomFilter.includes(item.bedrooms)) return false
      if (orientationFilter.length && item.orientation && !orientationFilter.includes(item.orientation)) return false
      if (decorationFilter.length && item.decoration && !decorationFilter.includes(item.decoration)) return false
      return true
    })
  }, [listingsQ.data, cityFilter, bedroomFilter, orientationFilter, decorationFilter])

  const updateFilterParam = (key: string, values: string[]) => {
    const next = new URLSearchParams(params)
    if (values.length) next.set(key, values.join(','))
    else next.delete(key)
    setParams(next)
  }

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

  // 动态生成列配置（改为卡片式行布局，仅保留房源列表，不显示重复表头）
  const columns = useMemo(() => {
    const settings = loadColumnSettings()
    const cols: ColumnsType<Listing> = [
      {
        title: '', // 只保留上方「房源列表」标题，此处不再显示「房源信息」
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
      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
      padding: '16px',
    }}>
      <div style={{ maxWidth: cardMaxWidth, margin: '0 auto' }}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <PageHeader title={t('pages.listings')} align="center" />

          {/* 搜索 + 高级筛选面板 */}
          <Card
            style={{
              width: '100%',
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: 'none',
              background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
            }}
          >
            <Form
              key={params.toString()}
              layout="vertical"
              initialValues={{
                ...Object.fromEntries(params),
                city: cityFilter as string[],
                bedrooms: bedroomFilter as string[],
                orientation: orientationFilter as string[],
                decoration: decorationFilter as string[],
              }}
              onFinish={(v) => {
                const next = new URLSearchParams()
                if (v.q) next.set('q', v.q)
                if (v.region) next.set('region', v.region)
                if (v.minPrice != null) next.set('minPrice', String(v.minPrice))
                if (v.maxPrice != null) next.set('maxPrice', String(v.maxPrice))
                if (Array.isArray(v.city) && v.city.length) next.set('city', v.city.join(','))
                if (Array.isArray(v.bedrooms) && v.bedrooms.length) next.set('bedrooms', v.bedrooms.join(','))
                if (Array.isArray(v.orientation) && v.orientation.length) next.set('orientation', v.orientation.join(','))
                if (Array.isArray(v.decoration) && v.decoration.length) next.set('decoration', v.decoration.join(','))
                setParams(next)
              }}
            >
              {/* 关键词搜索行 */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 0 }}>
                <Form.Item name="q" style={{ marginBottom: 0, flex: 1 }}>
                  <Input
                    size="large"
                    placeholder={t('pages.searchListings')}
                    allowClear
                    style={{ height: 48, borderRadius: 24, fontSize: 18 }}
                    prefix={<SearchOutlined style={{ color: '#999', fontSize: 18 }} />}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    style={{
                      height: 48, paddingInline: 32, borderRadius: 24, fontSize: 18,
                      background: '#fff', color: '#b4a5e8', fontWeight: 600, border: 'none',
                    }}
                  >
                    {t('common.search')}
                  </Button>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    size="large"
                    style={{
                      height: 48, paddingInline: 24, borderRadius: 24, fontSize: 18,
                      background: '#fff', color: '#b4a5e8', fontWeight: 600, border: 'none',
                    }}
                    onClick={() => setFilterOpen(!filterOpen)}
                  >
                    <FilterOutlined /> {t('pages.filter')}
                  </Button>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    size="large"
                    style={{
                      height: 48, paddingInline: 24, borderRadius: 24, fontSize: 18,
                      background: '#fff', color: '#b4a5e8', fontWeight: 600, border: 'none',
                    }}
                    onClick={() => { setParams(new URLSearchParams()); setFilterOpen(false); }}
                  >
                    {t('common.reset')}
                  </Button>
                </Form.Item>
              </div>

              {/* 红圈内：贝壳式多维筛选 */}
              <Collapse
                ghost
                style={{ marginTop: 0 }}
                activeKey={filterOpen ? ['filters'] : []}
                onChange={() => setFilterOpen(!filterOpen)}
                expandIcon={() => null}
                items={[{
                  key: 'filters',
                  label: null,
                  style: { padding: 0 },
                  children: (
                    <div style={{ padding: '16px 0 8px', color: '#fff' }}>
                      {/* 第一行：位置（城市勾选，同朝向样式） */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t('pages.filterLocation')}</div>
                        <Form.Item name="city" style={{ marginBottom: 0 }}>
                          <Checkbox.Group
                            options={CITY_OPTIONS.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                            onChange={(vals) => updateFilterParam('city', (vals as string[]) || [])}
                          />
                        </Form.Item>
                      </div>

                      {/* 第二行：房型 */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t('pages.filterRoomType')}</div>
                        <Form.Item name="bedrooms" style={{ marginBottom: 0 }}>
                          <Checkbox.Group
                            options={[
                              { value: '1', label: t('pages.roomType1') },
                              { value: '2', label: t('pages.roomType2') },
                              { value: '3', label: t('pages.roomType3') },
                              { value: '4', label: t('pages.roomType4') },
                              { value: '5', label: t('pages.roomType5Plus') },
                            ]}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                            onChange={(vals) => updateFilterParam('bedrooms', (vals as string[]) || [])}
                          />
                        </Form.Item>
                      </div>

                      {/* 第三行：朝向 */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t('pages.filterOrientation')}</div>
                        <Form.Item name="orientation" style={{ marginBottom: 0 }}>
                          <Checkbox.Group
                            options={[
                              { value: 'south', label: t('pages.orientationSouth') },
                              { value: 'north', label: t('pages.orientationNorth') },
                              { value: 'east', label: t('pages.orientationEast') },
                              { value: 'west', label: t('pages.orientationWest') },
                            ]}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                            onChange={(vals) => updateFilterParam('orientation', (vals as string[]) || [])}
                          />
                        </Form.Item>
                      </div>

                      {/* 第四行：装修 */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t('pages.filterDecoration')}</div>
                        <Form.Item name="decoration" style={{ marginBottom: 0 }}>
                          <Checkbox.Group
                            options={[
                              { value: 'rough', label: t('common.rough') },
                              { value: 'simple', label: t('common.simple') },
                              { value: 'fine', label: t('common.fine') },
                              { value: 'luxury', label: t('common.luxury') },
                            ]}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                            onChange={(vals) => updateFilterParam('decoration', (vals as string[]) || [])}
                          />
                        </Form.Item>
                      </div>

                      {/* 价格 */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 12 }}>
                        <Form.Item name="minPrice" label={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{t('pages.minPrice')}</span>} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="0" min={0} step={500} style={{ width: 120, borderRadius: 8 }} prefix="¥" />
                        </Form.Item>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>-</span>
                        <Form.Item name="maxPrice" label={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{t('pages.maxPrice')}</span>} style={{ marginBottom: 0 }}>
                          <InputNumber placeholder="99999" min={0} step={500} style={{ width: 120, borderRadius: 8 }} prefix="¥" />
                        </Form.Item>
                      </div>
                    </div>
                  ),
                }]}
              />
            </Form>
          </Card>

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
              border: 'none',
            }}
            styles={{ body: { padding: '16px', fontSize: 18 } }}
          >
            <Table<Listing>
              rowKey="id"
              loading={listingsQ.isLoading}
              columns={columns}
              dataSource={filteredListings}
              size="middle"
              showHeader={false}
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

  // 卡片标签：几室、装修、朝向（与筛选维度对应）
  const tagLabels: string[] = []
  if (listing.bedrooms != null) {
    tagLabels.push(`${listing.bedrooms}${t('common.bedrooms')}`)
  }
  if (listing.decoration === 'fine') tagLabels.push(t('pages.tagFine'))
  else if (listing.decoration === 'luxury') tagLabels.push(t('pages.tagLuxury'))
  else if (listing.decoration === 'simple') tagLabels.push(t('pages.tagSimple'))
  else if (listing.decoration === 'rough') tagLabels.push(t('pages.tagRough'))
  if (listing.orientation === 'south') tagLabels.push(t('pages.orientationSouth'))
  else if (listing.orientation === 'north') tagLabels.push(t('pages.orientationNorth'))
  else if (listing.orientation === 'east') tagLabels.push(t('pages.orientationEast'))
  else if (listing.orientation === 'west') tagLabels.push(t('pages.orientationWest'))

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {show('title') && (
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                {listing.title}
              </span>
            )}
          </div>

          {tagLabels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {tagLabels.map((label) => (
                <Tag key={label} color="blue" style={{ marginRight: 0, fontSize: 15 }}>
                  {label}
                </Tag>
              ))}
            </div>
          )}
        </div>

        {show('price') && (
          <div
            style={{
              minWidth: 140,
              textAlign: 'right',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 6,
            }}
          >
            <Typography.Text strong style={{ color: '#f97316', fontSize: 28 }}>
              ¥ {listing.price}
            </Typography.Text>
            <span style={{ fontSize: 15, color: '#9ca3af' }}>{t('common.yuanPerMonth')}</span>
            <span style={{ fontSize: 15, color: '#3b82f6' }}>{t('common.viewDetails')}</span>
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
        width: 300,
        height: 220,
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
          width={300}
          height={220}
          style={{ objectFit: 'cover' }}
          preview={false}
        />
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 15 }}>{t('common.noImage')}</span>
      )}
    </div>
  )
}

