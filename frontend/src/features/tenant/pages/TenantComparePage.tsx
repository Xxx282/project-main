/*
 * @Author: Mendax
 * @Date: 2026-02-17 21:23:56
 * @LastEditors: Mendax
 * @LastEditTime: 2026-02-26
 * @Description: 租客-我的收藏页面
 * @FilePath: \project-main\frontend\src\features\tenant\pages\TenantComparePage.tsx
 */
import { Button, Card, Space, Table, Tag, message, Modal, Checkbox, Form } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { HeartFilled, DeleteOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getMyFavorites, removeFavorite, type Favorite } from '../api/tenantApi'
import { getListing } from '../api/tenantApi'

// 收藏的房源详情
interface FavoriteProperty {
  favorite: Favorite
  property: {
    id: number
    title: string
    city: string
    region: string
    price: number
    bedrooms: number
    bathrooms: number
    area: number
    status: string
  } | null
}

// 可配置的字段选项
interface FieldOption {
  key: string
  title: string
  visible: boolean
}

const STORAGE_KEY = 'tenant_favorites_columns'

function loadColumnSettings(t: any): FieldOption[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // 默认配置
  return [
    { key: 'title', title: t('pages.propertyTitle'), visible: true },
    { key: 'city', title: t('pages.city'), visible: true },
    { key: 'region', title: t('pages.region'), visible: true },
    { key: 'price', title: t('common.price'), visible: true },
    { key: 'layout', title: t('common.layout'), visible: true },
    { key: 'area', title: t('pages.areaLabel'), visible: true },
    { key: 'status', title: t('pages.status'), visible: true },
    { key: 'createdAt', title: t('pages.favoriteTime'), visible: true },
  ]
}

function saveColumnSettings(fields: FieldOption[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
}

export function TenantComparePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()

  // 获取收藏列表
  const favoritesQ = useQuery({
    queryKey: ['tenant', 'favorites'],
    queryFn: async () => {
      const { favorites } = await getMyFavorites()
      // 获取每个收藏对应的房源详情
      const promises = favorites.map(async (fav) => {
        try {
          const property = await getListing(fav.propertyId)
          return { favorite: fav, property }
        } catch {
          return { favorite: fav, property: null }
        }
      })
      const results = await Promise.all(promises)
      return results as FavoriteProperty[]
    },
  })

  // 取消收藏 mutation
  const removeMutation = useMutation({
    mutationFn: (propertyId: number) => removeFavorite(propertyId),
    onSuccess: () => {
      message.success(t('pages.unfavoriteSuccessMessage'))
      queryClient.invalidateQueries({ queryKey: ['tenant', 'favorites'] })
    },
    onError: () => {
      message.error(t('pages.unfavoriteFailedMessage'))
    },
  })

  // 动态生成列配置
  const columns = useMemo<ColumnsType<FavoriteProperty>>(() => {
    const settings = loadColumnSettings(t)
    const cols: ColumnsType<FavoriteProperty> = []

    if (settings.find((s) => s.key === 'title' && s.visible)) {
      cols.push({
        title: t('pages.propertyTitle'),
        dataIndex: ['property', 'title'],
        width: 160,
        ellipsis: true,
        render: (title, record) =>
          record.property ? (
            <Button
              type="link"
              title={typeof title === 'string' ? title : ''}
              onClick={() => navigate(`/tenant/listings/${record.property!.id}`)}
              style={{
                color: '#b4a5e8',
                fontWeight: 600,
                padding: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                textAlign: 'left',
              }}
            >
              {title}
            </Button>
          ) : (
            '-'
          ),
      })
    }

    if (settings.find((s) => s.key === 'city' && s.visible)) {
      cols.push({
        title: t('pages.city'),
        dataIndex: ['property', 'city'],
        width: 100,
        ellipsis: true,
        render: (v) => v ?? '-',
      })
    }

    if (settings.find((s) => s.key === 'region' && s.visible)) {
      cols.push({
        title: t('pages.region'),
        dataIndex: ['property', 'region'],
        width: 100,
        ellipsis: true,
        render: (v) => v ?? '-',
      })
    }

    if (settings.find((s) => s.key === 'price' && s.visible)) {
      cols.push({
        title: t('common.price'),
        dataIndex: ['property', 'price'],
        render: (v) => (v ? `¥ ${v}${t('common.yuanPerMonth')}` : '-'),
      })
    }

    if (settings.find((s) => s.key === 'layout' && s.visible)) {
      cols.push({
        title: t('common.layout'),
        render: (_, record) => {
          if (!record.property) return '-'
          return `${record.property.bedrooms}${t('common.bedrooms')}${record.property.bathrooms}${t('common.bathrooms')}`
        },
      })
    }

    if (settings.find((s) => s.key === 'area' && s.visible)) {
      cols.push({
        title: t('pages.areaLabel'),
        dataIndex: ['property', 'area'],
        render: (v) => (v ? `${v} m²` : '-'),
      })
    }

    if (settings.find((s) => s.key === 'status' && s.visible)) {
      cols.push({
        title: t('pages.status'),
        dataIndex: ['property', 'status'],
        render: (status) => {
          const color = status === 'available' ? 'green' : status === 'rented' ? 'red' : 'default'
          const text = status === 'available' ? t('pages.available') : status === 'rented' ? t('pages.rented') : t('pages.offline')
          return <Tag color={color}>{text}</Tag>
        },
      })
    }

    if (settings.find((s) => s.key === 'createdAt' && s.visible)) {
      cols.push({
        title: t('pages.favoriteTime'),
        dataIndex: ['favorite', 'createdAt'],
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
      })
    }

    // 操作列始终显示（固定宽度避免英文时被挤出）
    cols.push({
      title: t('common.operation'),
      key: 'operation',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeMutation.mutate(record.property!.id)}
          loading={removeMutation.isPending}
          style={{
            borderRadius: '8px',
            fontWeight: 500,
          }}
        >
          {t('pages.unfavorite')}
        </Button>
      ),
    })

    return cols
  }, [navigate, removeMutation, t])

  // 打开设置弹窗
  const handleOpenSettings = () => {
    form.setFieldsValue(loadColumnSettings(t).reduce((acc, field) => {
      acc[field.key] = field.visible
      return acc
    }, {} as Record<string, boolean>))
    setSettingsModalOpen(true)
  }

  // 保存设置
  const handleSaveSettings = () => {
    form.validateFields().then((values) => {
      const newSettings = loadColumnSettings(t).map((field) => ({
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
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          <PageHeader
            title={t('pages.myFavorites')}
            subtitle={t('pages.viewManageFavorites')}
            extra={
              <Space>
                <Button 
                  icon={<SettingOutlined />} 
                  onClick={handleOpenSettings}
                  size="large"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    color: '#b4a5e8',
                    fontWeight: 600,
                    borderRadius: '24px',
                    height: '48px',
                    paddingInline: '24px',
                  }}
                >
                  {t('pages.showFields')}
                </Button>
                <Link to="/tenant/listings">
                  <Button 
                    type="primary" 
                    icon={<HomeOutlined />}
                    size="large"
                    style={{
                      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
                      border: 'none',
                      borderRadius: '24px',
                      height: '48px',
                      paddingInline: '32px',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    {t('pages.backToListings')}
                  </Button>
                </Link>
              </Space>
            }
          />
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {favoritesQ.data?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <HeartFilled style={{ fontSize: 64, color: '#b4a5e8', marginBottom: 24, opacity: 0.6 }} />
                <p style={{ color: '#666', fontSize: 16, marginBottom: 24 }}>{t('pages.noFavorites')}</p>
                <Link to="/tenant/listings">
                  <Button 
                    type="primary"
                    size="large"
                    style={{
                      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
                      border: 'none',
                      borderRadius: '24px',
                      height: '48px',
                      paddingInline: '32px',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    {t('pages.goToFavorites')}
                  </Button>
                </Link>
              </div>
            ) : (
              <Table<FavoriteProperty>
                rowKey={(record) => record.favorite.id}
                columns={columns}
                dataSource={favoritesQ.data ?? []}
                loading={favoritesQ.isLoading}
                scroll={{ x: 1000 }}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                style={{
                  borderRadius: '8px',
                }}
                rowClassName={() => 'favorite-table-row'}
                components={{
                  body: {
                    row: (props: any) => (
                      <tr
                        {...props}
                        style={{
                          ...props.style,
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9ff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      />
                    ),
                  },
                }}
              />
            )}
          </Card>

          {/* 字段显示设置弹窗 */}
          <Modal
            title={t('pages.displayFieldSettings')}
            open={settingsModalOpen}
            onOk={handleSaveSettings}
            onCancel={() => setSettingsModalOpen(false)}
            okText={t('common.save')}
            cancelText={t('common.cancel')}
            styles={{
              content: {
                borderRadius: '16px',
              },
            }}
            okButtonProps={{
              style: {
                background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
              },
            }}
          >
            <Form form={form} layout="vertical">
              <Form.Item name="title" valuePropName="checked">
                <Checkbox>{t('pages.propertyTitle')}</Checkbox>
              </Form.Item>
              <Form.Item name="city" valuePropName="checked">
                <Checkbox>{t('pages.city')}</Checkbox>
              </Form.Item>
              <Form.Item name="region" valuePropName="checked">
                <Checkbox>{t('pages.region')}</Checkbox>
              </Form.Item>
              <Form.Item name="price" valuePropName="checked">
                <Checkbox>{t('common.price')}</Checkbox>
              </Form.Item>
              <Form.Item name="layout" valuePropName="checked">
                <Checkbox>{t('common.layout')}</Checkbox>
              </Form.Item>
              <Form.Item name="area" valuePropName="checked">
                <Checkbox>{t('pages.areaLabel')}</Checkbox>
              </Form.Item>
              <Form.Item name="status" valuePropName="checked">
                <Checkbox>{t('pages.status')}</Checkbox>
              </Form.Item>
              <Form.Item name="createdAt" valuePropName="checked">
                <Checkbox>{t('pages.favoriteTime')}</Checkbox>
              </Form.Item>
            </Form>
          </Modal>
        </Space>
      </div>
    </div>
  )
}
