import { Button, Card, Form, Space, Table, Tag, Modal, Checkbox } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SettingOutlined } from '@ant-design/icons'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listListings } from '../api/tenantApi'
import type { Listing } from '../../../shared/api/types'

// 字段设置相关
interface FieldOption {
  key: string
  title: string
  visible: boolean
}

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

export function TenantListingsPage() {
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()

  const listingsQ = useQuery({
    queryKey: ['tenant', 'listings'],
    queryFn: () => listListings({}),
  })

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
      cols.push({ title: '租金', dataIndex: 'price', render: (v) => `¥ ${v}` })
    }

    if (settings.find((s) => s.key === 'layout' && s.visible)) {
      cols.push({
        title: '户型',
        render: (_, row) => (
          <Tag>
            {(row.bedrooms ?? '-') + '室'} / {(row.bathrooms ?? '-') + '卫'}
          </Tag>
        ),
      })
    }

    if (settings.find((s) => s.key === 'decorationOrientation' && s.visible)) {
      cols.push({
        title: '装修/朝向',
        render: (_, row) => (
          <Tag>
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
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="房源列表"
        extra={
          <Button icon={<SettingOutlined />} onClick={handleOpenSettings}>
            显示字段
          </Button>
        }
      />

      <Card title="房源">
        <Table<Listing>
          rowKey="id"
          loading={listingsQ.isLoading}
          columns={columns}
          dataSource={listingsQ.data ?? []}
          pagination={{ pageSize: 8 }}
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

