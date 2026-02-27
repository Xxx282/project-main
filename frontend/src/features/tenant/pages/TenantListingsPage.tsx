import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag, Modal, Checkbox, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SettingOutlined } from '@ant-design/icons'
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
    queryKey: ['tenant', 'listings'],
    queryFn: () => listListings({}),
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

      <Card
        title="筛选"
        style={{
          maxWidth: cardMaxWidth,
          margin: '0 auto',
          borderRadius: 12,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
          border: '1px solid #f3f4f6',
        }}
      >
        <Form
          layout="inline"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            columnGap: 16,
            rowGap: 8,
            alignItems: 'center',
          }}
          initialValues={Object.fromEntries(params)}
          onFinish={(v) => {
            const next = new URLSearchParams()
            if (v.q) next.set('q', v.q)
            if (v.region) next.set('region', v.region)
            if (v.bedrooms) next.set('bedrooms', String(v.bedrooms))
            if (v.minRent != null) next.set('minRent', String(v.minRent))
            if (v.maxRent != null) next.set('maxRent', String(v.maxRent))
            setParams(next)
          }}
        >
          <Form.Item name="q" label="关键词" style={{ minWidth: 260 }}>
            <Input placeholder="如：地铁/两室" allowClear style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="region" label="区域" style={{ minWidth: 260 }}>
            <Select
              allowClear
              options={[
                { label: '示例区域 A', value: '示例区域 A' },
                { label: '示例区域 B', value: '示例区域 B' },
              ]}
              placeholder="全部"
              style={{ width: 160 }}
            />
          </Form.Item>
          <Form.Item name="bedrooms" label="卧室数" style={{ minWidth: 260 }}>
            <Select
              allowClear
              options={[
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
              ]}
              placeholder="全部"
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item name="minRent" label="最低租金" style={{ minWidth: 260 }}>
            <InputNumber min={0} placeholder="0" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="maxRent" label="最高租金" style={{ minWidth: 260 }}>
            <InputNumber min={0} placeholder="不限" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            <Space size={40}>
              <Button type="primary" htmlType="submit">
                应用
              </Button>
              <Button
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
          pagination={{ pageSize: 8, showSizeChanger: false, position: ['bottomCenter'] }}
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

