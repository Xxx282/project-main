import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag, Modal, Checkbox, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SettingOutlined, SearchOutlined } from '@ant-design/icons'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listListings } from '../api/tenantApi'
import type { Listing } from '../../../shared/api/types'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

// 字段设置相关
interface FieldOption {
  key: string
  title: string
  visible: boolean
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
    queryFn: () => listListings({
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
      if (raw) return JSON.parse(raw)
    } catch {}
    // 默认配置
    return [
      { key: 'id', title: 'ID', visible: true },
      { key: 'title', title: '标题', visible: true },
      { key: 'cityRegion', title: '城市/区域', visible: true },
      { key: 'price', title: '租金', visible: true },
      { key: 'layout', title: '户型', visible: true },
      { key: 'decorationOrientation', title: '装修/朝向', visible: true },
    ]
  }

  function saveColumnSettings(fields: FieldOption[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields))
  }

  // 动态生成列配置
  const columns = useMemo(() => {
    const settings = loadColumnSettings()
    const cols: ColumnsType<Listing> = []

    if (settings.find((s) => s.key === 'id' && s.visible)) {
      cols.push({ title: 'ID', dataIndex: 'id', width: 60 })
    }

    if (settings.find((s) => s.key === 'title' && s.visible)) {
      cols.push({ title: '标题', dataIndex: 'title' })
    }

    if (settings.find((s) => s.key === 'cityRegion' && s.visible)) {
      cols.push({
        title: '城市/区域',
        render: (_, row) => (
          <span>
            {row.city ?? '-'} {row.region ? `/ ${row.region}` : ''}
          </span>
        ),
      })
    }

    if (settings.find((s) => s.key === 'price' && s.visible)) {
      cols.push({
        title: '租金',
        dataIndex: 'price',
        align: 'right',
        render: (v) => <Typography.Text strong>¥ {v}</Typography.Text>,
      })
    }

    if (settings.find((s) => s.key === 'layout' && s.visible)) {
      cols.push({
        title: '户型',
        render: (_, row) => (
          <Tag color="blue">
            {(row.bedrooms ?? '-') + '室'} / {(row.bathrooms ?? '-') + '卫'}
          </Tag>
        ),
      })
    }

    if (settings.find((s) => s.key === 'decorationOrientation' && s.visible)) {
      cols.push({
        title: '装修/朝向',
        render: (_, row) => (
          <Tag color="geekblue">
            {row.decoration === 'rough' && '毛坯'}
            {row.decoration === 'simple' && '简装'}
            {row.decoration === 'fine' && '精装'}
            {row.decoration === 'luxury' && '豪华'}
            {row.decoration ? ' / ' : ''}
            {row.orientation === 'east' && '东'}
            {row.orientation === 'south' && '南'}
            {row.orientation === 'west' && '西'}
            {row.orientation === 'north' && '北'}
            {!row.decoration && !row.orientation && '-'}
          </Tag>
        ),
      })
    }

    // 操作列始终显示
    cols.push({
      title: '操作',
      render: (_, row) => <Link to={`/tenant/listings/${row.id}`}>详情</Link>,
    })

    return cols
  }, [])

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
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="房源列表"
        align="center"
      />

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
          pagination={{ pageSize: 8, showSizeChanger: false, placement: ['bottomCenter'] }}
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

