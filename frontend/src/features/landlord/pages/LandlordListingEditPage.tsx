import { Button, Card, Form, Input, InputNumber, Select, Space, message, Divider, Upload } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import type { Listing, PropertyImage } from '../../../shared/api/types'
import { createListing, updateListing, getPropertyImages, uploadPropertyImages } from '../api/landlordApi'
import { getListing } from '../../tenant/api/tenantApi'
import { ImageUploader } from '../../../shared/components/ImageUploader'

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

  // 图片状态
  const [images, setImages] = useState<PropertyImage[]>([])
  // 创建房源时暂存待上传的图片文件（房源创建成功后再统一上传）
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const listingQ = useQuery({
    queryKey: ['landlord', 'listing', numericId],
    queryFn: () => getListing(numericId!),
    enabled: props.mode === 'edit' && numericId !== undefined,
  })

  // 编辑模式下加载图片
  const imagesQ = useQuery({
    queryKey: ['landlord', 'listing', numericId, 'images'],
    queryFn: () => getPropertyImages(numericId!),
    enabled: props.mode === 'edit' && numericId !== undefined,
  })

  useEffect(() => {
    if (imagesQ.data) {
      setImages(imagesQ.data)
    }
  }, [imagesQ.data])

  const [form] = Form.useForm<Partial<Listing>>()
  useEffect(() => {
    if (listingQ.data) form.setFieldsValue(listingQ.data)
  }, [listingQ.data, form])

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={`房东-${title}`}
        subtitle={`房东-${title}`}
      />
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            try {
              if (props.mode === 'create') {
                const created = await createListing(v)

                // 如果创建时已选择图片，则在房源创建成功后自动上传
                if (pendingFiles.length > 0) {
                  try {
                    await uploadPropertyImages(created.id, pendingFiles)
                    void message.success('房源已发布，图片已上传')
                  } catch {
                    void message.error('房源已发布，但图片上传失败，请稍后在编辑页面重试')
                  } finally {
                    setPendingFiles([])
                  }
                } else {
                  void message.success('已发布')
                }

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

          {/* 创建房源时的图片选择区域（先选图，发布成功后自动上传） */}
          {props.mode === 'create' && (
            <Form.Item label="房源图片（可选）">
              <Upload
                listType="picture-card"
                beforeUpload={(file) => {
                  setPendingFiles((prev) => [...prev, file])
                  return false // 阻止 Upload 组件自动上传，改为在表单提交后统一上传
                }}
                multiple
                accept="image/*"
              >
                <div style={{ padding: '12px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, lineHeight: 1 }}>+</div>
                  <div style={{ marginTop: 8 }}>选择图片</div>
                </div>
              </Upload>
              <div style={{ color: '#999', marginTop: 8 }}>图片会在发布成功后自动上传，之后可在编辑页面继续管理</div>
            </Form.Item>
          )}

          <Button type="primary" htmlType="submit" loading={listingQ.isLoading}>
            {props.mode === 'create' ? '发布' : '保存'}
          </Button>
        </Form>

        {/* 图片上传区域 - 仅在编辑模式或创建后显示 */}
        {props.mode === 'edit' && numericId && (
          <>
            <Divider />
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 16 }}>房源图片</h3>
              <ImageUploader
                propertyId={numericId}
                images={images}
                onImagesChange={setImages}
              />
            </div>
          </>
        )}
      </Card>
    </Space>
  )
}

