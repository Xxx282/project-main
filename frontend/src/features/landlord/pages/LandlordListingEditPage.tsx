import { Button, Card, Form, Input, InputNumber, Select, Space, message, Divider, Upload, Typography, Row, Col } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  HomeOutlined, 
  EditOutlined, 
  PlusOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  BuildOutlined,
  FileTextOutlined,
  PictureOutlined
} from '@ant-design/icons'
import type { Listing, PropertyImage } from '../../../shared/api/types'
import { createListing, updateListing, getPropertyImages, uploadPropertyImages } from '../api/landlordApi'
import { getListing } from '../../tenant/api/tenantApi'
import { ImageUploader } from '../../../shared/components/ImageUploader'

const { TextArea } = Input

export function LandlordListingEditPage(props: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const { id } = useParams()
  const numericId = id ? Number(id) : undefined
  const navigate = useNavigate()
  
  // 朝向选项
  const orientationOptions = useMemo(() => [
    { label: t('common.east'), value: 'east' },
    { label: t('common.south'), value: 'south' },
    { label: t('common.west'), value: 'west' },
    { label: t('common.north'), value: 'north' },
  ], [t])

  // 装修情况选项
  const decorationOptions = useMemo(() => [
    { label: t('common.rough'), value: 'rough' },
    { label: t('common.simple'), value: 'simple' },
    { label: t('common.fine'), value: 'fine' },
    { label: t('common.luxury'), value: 'luxury' },
  ], [t])
  
  const title = props.mode === 'create' ? t('pages.createListing') : t('pages.editListing')

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
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Space orientation="vertical" size={28} style={{ width: '100%' }}>
          {/* 页面标题 */}
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: 'none',
            }}
          >
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              {props.mode === 'create' ? (
                <PlusOutlined style={{ fontSize: 32, color: '#b4a5e8', marginBottom: 8 }} />
              ) : (
                <EditOutlined style={{ fontSize: 32, color: '#b4a5e8', marginBottom: 8 }} />
              )}
              <Typography.Title level={2} style={{ margin: '8px 0', color: '#1a1a1a' }}>
                {props.mode === 'create' ? t('pages.landlordCreateListing') : t('pages.landlordEditListing')}
              </Typography.Title>
            </div>
          </Card>

          {/* 表单卡片 */}
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: 'none',
            }}
            styles={{ body: { padding: '32px 40px' } }}
          >
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
                        void message.success(t('pages.listingPublishedImagesUploaded'))
                      } catch {
                        void message.error(t('pages.listingPublishedImageUploadFailed'))
                      } finally {
                        setPendingFiles([])
                      }
                    } else {
                      void message.success(t('pages.published'))
                    }

                    navigate(`/landlord/listings/${created.id}/edit`, { replace: true })
                  } else {
                    await updateListing(numericId!, v)
                    void message.success(t('pages.saved'))
                  }
                } catch {
                  void message.error(t('pages.saveFailed'))
                }
              }}
            >
              <Form.Item 
                name="title" 
                label={
                  <span>
                    <FileTextOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                    {t('common.title')}
                  </span>
                } 
                rules={[{ required: true }]}
              >
                <Input placeholder={t('pages.titleExample')} size="large" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="price" 
                    label={
                      <span>
                        <DollarOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.pricePerMonth')}
                      </span>
                    } 
                    rules={[{ required: true }]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      min={0} 
                      placeholder={t('pages.priceExample')} 
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="area" 
                    label={
                      <span>
                        <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.areaSquareMeters')}
                      </span>
                    } 
                    rules={[{ required: true }]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      min={0} 
                      placeholder={t('pages.areaExample')} 
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="city" 
                    label={
                      <span>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.city')}
                      </span>
                    } 
                    rules={[{ required: true }]}
                  >
                    <Input placeholder={t('pages.cityExample')} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="region" 
                    label={
                      <span>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.region')}
                      </span>
                    } 
                    rules={[{ required: true }]}
                  >
                    <Input placeholder={t('pages.regionExample')} size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="bedrooms" 
                    label={
                      <span>
                        <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.bedroomCount')}
                      </span>
                    } 
                    rules={[{ required: true }]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      min={0} 
                      placeholder={t('pages.bedroomExample')} 
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="bathrooms" 
                    label={
                      <span>
                        <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.bathroomCount')}
                      </span>
                    } 
                    rules={[{ required: true }]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      min={0} 
                      placeholder={t('pages.bathroomExample')} 
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="totalFloors" 
                    label={
                      <span>
                        <BuildOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.totalFloorsCount')}
                      </span>
                    }
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      min={0} 
                      placeholder={t('pages.floorExample')} 
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    name="orientation" 
                    label={
                      <span>
                        <BuildOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('common.orientationLabel')}
                      </span>
                    }
                  >
                    <Select 
                      options={orientationOptions} 
                      placeholder={t('pages.selectOrientation')} 
                      allowClear 
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                name="decoration" 
                label={
                  <span>
                    <BuildOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                    {t('pages.decorationStatus')}
                  </span>
                }
              >
                <Select 
                  options={decorationOptions} 
                  placeholder={t('pages.selectDecoration')} 
                  allowClear 
                  size="large"
                />
              </Form.Item>

              <Form.Item 
                name="description" 
                label={
                  <span>
                    <FileTextOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                    {t('pages.listingDescription')}
                  </span>
                }
              >
                <TextArea 
                  rows={4} 
                  placeholder={t('pages.enterListingDescription')} 
                  size="large"
                />
              </Form.Item>

              {/* 创建房源时的图片选择区域（先选图，发布成功后自动上传） */}
              {props.mode === 'create' && (
                <Form.Item 
                  label={
                    <span>
                      <PictureOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                      {t('pages.listingImagesOptional')}
                    </span>
                  }
                >
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
                      <div style={{ marginTop: 8 }}>{t('pages.selectImages')}</div>
                    </div>
                  </Upload>
                  <div style={{ color: '#999', marginTop: 8 }}>{t('pages.imageUploadNote')}</div>
                </Form.Item>
              )}

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={listingQ.isLoading}
                  size="large"
                  block
                  icon={props.mode === 'create' ? <PlusOutlined /> : <EditOutlined />}
                  style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  {props.mode === 'create' ? t('pages.publish') : t('common.save')}
                </Button>
              </Form.Item>
            </Form>

            {/* 图片上传区域 - 仅在编辑模式或创建后显示 */}
            {props.mode === 'edit' && numericId && (
              <>
                <Divider style={{ margin: '24px 0' }} />
                <div style={{ marginTop: 16 }}>
                  <Typography.Title level={4} style={{ marginBottom: 16 }}>
                    <PictureOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                    {t('pages.listingImages')}
                  </Typography.Title>
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
      </div>
    </div>
  )
}

