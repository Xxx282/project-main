import { Button, Card, Form, Input, InputNumber, Select, Space, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing } from '../../../shared/api/types'
import { createListing, updateListing } from '../api/landlordApi'
import { getListing } from '../../tenant/api/tenantApi'

const { TextArea } = Input

// 朝向选项
const orientationOptions = [
  { label: '东', value: 'east' },
  { label: '南', value: 'south' },
  { label: '西', value: 'west' },
  { label: '北', value: 'north' },
]

// 装修情况选项
const decorationOptions = [
  { label: '毛坯', value: 'rough' },
  { label: '简装', value: 'simple' },
  { label: '精装', value: 'fine' },
  { label: '豪华', value: 'luxury' },
]

export function LandlordListingEditPage(props: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const numericId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const title = props.mode === 'create' ? '发布房源' : '编辑房源'

  const listingQ = useQuery({
    queryKey: ['landlord', 'listing', numericId],
    queryFn: () => getListing(numericId!),
    enabled: props.mode === 'edit' && numericId !== undefined,
  })

  const [form] = Form.useForm<Partial<Listing>>()
  useEffect(() => {
    if (listingQ.data) form.setFieldsValue(listingQ.data)
  }, [listingQ.data, form])

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={`房东-${title}`}
        subtitle="（占位页）后续接入创建/更新接口与表单校验"
      />
      <Card style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            try {
              if (props.mode === 'create') {
                const created = await createListing(v)
                void message.success('已发布')
                navigate(`/landlord/listings/${created.id}/edit`, { replace: true })
              } else {
                await updateListing(numericId!, v)
                void message.success('已保存')
              }
            } catch {
              void message.error('保存失败')
            }
          }}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="例如：近地铁两室一厅" />
          </Form.Item>
          <Form.Item name="price" label="租金（每月）" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="例如 3500" />
          </Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true }]}>
            <Input placeholder="例如：上海" />
          </Form.Item>
          <Form.Item name="region" label="区域" rules={[{ required: true }]}>
            <Input placeholder="例如：浦东新区" />
          </Form.Item>
          <Form.Item name="bedrooms" label="卧室数" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="例如 2" />
          </Form.Item>
          <Form.Item name="bathrooms" label="卫生间数" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="例如 1" />
          </Form.Item>
          <Form.Item name="area" label="面积（㎡）" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="例如 65" />
          </Form.Item>
          <Form.Item name="totalFloors" label="总楼层数">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="例如 30" />
          </Form.Item>
          <Form.Item name="orientation" label="朝向">
            <Select options={orientationOptions} placeholder="请选择朝向" allowClear />
          </Form.Item>
          <Form.Item name="decoration" label="装修情况">
            <Select options={decorationOptions} placeholder="请选择装修情况" allowClear />
          </Form.Item>
          <Form.Item name="description" label="房源描述">
            <TextArea rows={4} placeholder="请输入房源描述" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={listingQ.isLoading}>
            {props.mode === 'create' ? '发布' : '保存'}
          </Button>
        </Form>
      </Card>
    </Space>
  )
}

