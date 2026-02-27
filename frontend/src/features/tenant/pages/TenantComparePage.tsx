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
import { HeartFilled, DeleteOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
<<<<<<< HEAD
import { getMyFavorites, removeFavorite, type Favorite } from '../api/tenantApi'
import { getListing } from '../api/tenantApi'
=======
import type { Listing } from '../../../shared/api/types'
import { listListings } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'
>>>>>>> 525f37060275a5b973a7e3e6ca3a0cdd1bd4fb9f

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

function loadColumnSettings(): FieldOption[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // 默认配置
  return [
    { key: 'title', title: '房源标题', visible: true },
    { key: 'city', title: '城市', visible: true },
    { key: 'region', title: '区域', visible: true },
    { key: 'price', title: '租金', visible: true },
    { key: 'layout', title: '户型', visible: true },
    { key: 'area', title: '面积', visible: true },
    { key: 'status', title: '状态', visible: true },
    { key: 'createdAt', title: '收藏时间', visible: true },
  ]
}

function saveColumnSettings(fields: FieldOption[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
}

export function TenantComparePage() {
<<<<<<< HEAD
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()

  // 加载字段设置
  const columnSettings = useState<FieldOption[]>(loadColumnSettings())[0]

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
=======
  const auth = useAuth()
  const isGuest = !auth.user
  const cardMaxWidth = isGuest ? 1160 : 980

  const ids = loadIds()
  const listingsQ = useQuery({
    queryKey: ['tenant', 'listings', 'compare'],
    queryFn: () => listListings({}),
>>>>>>> 525f37060275a5b973a7e3e6ca3a0cdd1bd4fb9f
  })

  // 取消收藏 mutation
  const removeMutation = useMutation({
    mutationFn: (propertyId: number) => removeFavorite(propertyId),
    onSuccess: () => {
      message.success('取消收藏成功')
      queryClient.invalidateQueries({ queryKey: ['tenant', 'favorites'] })
    },
    onError: () => {
      message.error('取消收藏失败')
    },
  })

  // 动态生成列配置
  const columns = useMemo<ColumnsType<FavoriteProperty>>(() => {
    const settings = loadColumnSettings()
    const cols: ColumnsType<FavoriteProperty> = []

    if (settings.find((s) => s.key === 'title' && s.visible)) {
      cols.push({
        title: '房源标题',
        dataIndex: ['property', 'title'],
        render: (title, record) =>
          record.property ? (
            <Button type="link" onClick={() => navigate(`/tenant/listings/${record.property!.id}`)}>
              {title}
            </Button>
          ) : (
            '-'
          ),
      })
    }

    if (settings.find((s) => s.key === 'city' && s.visible)) {
      cols.push({
        title: '城市',
        dataIndex: ['property', 'city'],
        render: (v) => v ?? '-',
      })
    }

    if (settings.find((s) => s.key === 'region' && s.visible)) {
      cols.push({
        title: '区域',
        dataIndex: ['property', 'region'],
        render: (v) => v ?? '-',
      })
    }

    if (settings.find((s) => s.key === 'price' && s.visible)) {
      cols.push({
        title: '租金',
        dataIndex: ['property', 'price'],
        render: (v) => (v ? `¥ ${v}/月` : '-'),
      })
    }

    if (settings.find((s) => s.key === 'layout' && s.visible)) {
      cols.push({
        title: '户型',
        render: (_, record) => {
          if (!record.property) return '-'
          return `${record.property.bedrooms}室${record.property.bathrooms}卫`
        },
      })
    }

    if (settings.find((s) => s.key === 'area' && s.visible)) {
      cols.push({
        title: '面积',
        dataIndex: ['property', 'area'],
        render: (v) => (v ? `${v} m²` : '-'),
      })
    }

    if (settings.find((s) => s.key === 'status' && s.visible)) {
      cols.push({
        title: '状态',
        dataIndex: ['property', 'status'],
        render: (status) => {
          const color = status === 'available' ? 'green' : status === 'rented' ? 'red' : 'default'
          const text = status === 'available' ? '可租' : status === 'rented' ? '已租' : '下架'
          return <Tag color={color}>{text}</Tag>
        },
      })
    }

    if (settings.find((s) => s.key === 'createdAt' && s.visible)) {
      cols.push({
        title: '收藏时间',
        dataIndex: ['favorite', 'createdAt'],
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
      })
    }

    // 操作列始终显示
    cols.push({
      title: '操作',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeMutation.mutate(record.property!.id)}
          loading={removeMutation.isPending}
        >
          取消收藏
        </Button>
      ),
    })

    return cols
  }, [navigate, removeMutation])

  // 打开设置弹窗
  const handleOpenSettings = () => {
    form.setFieldsValue(loadColumnSettings().reduce((acc, field) => {
      acc[field.key] = field.visible
      return acc
    }, {} as Record<string, boolean>))
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
<<<<<<< HEAD
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="我的收藏"
        subtitle="查看和管理您收藏的房源"
        extra={
          <Space>
            <Button icon={<SettingOutlined />} onClick={handleOpenSettings}>
              显示字段
            </Button>
            <Link to="/tenant/listings">
              <Button type="primary" icon={<HomeOutlined />}>
                返回房源列表
              </Button>
            </Link>
          </Space>
        }
      />
      <Card>
        {favoritesQ.data?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <HeartFilled style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <p style={{ color: '#999' }}>暂无收藏房源</p>
            <Link to="/tenant/listings">
              <Button type="primary">去收藏房源</Button>
            </Link>
          </div>
        ) : (
          <Table<FavoriteProperty>
            rowKey={(record) => record.favorite.id}
            columns={columns}
            dataSource={favoritesQ.data ?? []}
            loading={favoritesQ.isLoading}
            pagination={{ pageSize: 10 }}
          />
        )}
=======
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader title="租客-房源对比" subtitle="（占位页）后续实现对比表与收藏" />
      <Card
        style={{
          maxWidth: cardMaxWidth,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}
      >
        <Typography.Paragraph>
          目前先用本地 localStorage 存一份对比列表。你可以从房源列表页进入详情后再扩展"加入对比"按钮。
        </Typography.Paragraph>
        <Space style={{ marginBottom: 12 }}>
          <Button
            onClick={() => {
              saveIds(['1', '2'])
              window.location.reload()
            }}
          >
            填充示例对比
          </Button>
          <Button
            danger
            onClick={() => {
              saveIds([])
              window.location.reload()
            }}
          >
            清空
          </Button>
          <Link to="/tenant/listings">返回房源列表</Link>
        </Space>
        <Table<Listing>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={listingsQ.isLoading}
          size="middle"
          pagination={false}
        />
>>>>>>> 525f37060275a5b973a7e3e6ca3a0cdd1bd4fb9f
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
          <Form.Item name="title" valuePropName="checked">
            <Checkbox>房源标题</Checkbox>
          </Form.Item>
          <Form.Item name="city" valuePropName="checked">
            <Checkbox>城市</Checkbox>
          </Form.Item>
          <Form.Item name="region" valuePropName="checked">
            <Checkbox>区域</Checkbox>
          </Form.Item>
          <Form.Item name="price" valuePropName="checked">
            <Checkbox>租金</Checkbox>
          </Form.Item>
          <Form.Item name="layout" valuePropName="checked">
            <Checkbox>户型</Checkbox>
          </Form.Item>
          <Form.Item name="area" valuePropName="checked">
            <Checkbox>面积</Checkbox>
          </Form.Item>
          <Form.Item name="status" valuePropName="checked">
            <Checkbox>状态</Checkbox>
          </Form.Item>
          <Form.Item name="createdAt" valuePropName="checked">
            <Checkbox>收藏时间</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
