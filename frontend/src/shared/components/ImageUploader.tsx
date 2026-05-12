import { Button, Card, Image, message, Upload, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons'
import { useState } from 'react'
import type { PropertyImage } from '../api/types'
import { uploadPropertyImages, deletePropertyImage } from '../../features/landlord/api/landlordApi'

interface ImageUploaderProps {
  propertyId: number
  images: PropertyImage[]
  onImagesChange: (images: PropertyImage[]) => void
  disabled?: boolean
}

// 构建完整的图片URL - 后端已返回完整URL，这里直接返回
const buildImageUrl = (imageUrl: string) => {
  if (!imageUrl) return ''
  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // 其他情况返回原值
  return imageUrl
}

export function ImageUploader({ propertyId, images, onImagesChange, disabled }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  // 处理文件上传
  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const uploadedImages = await uploadPropertyImages(propertyId, [file])
      onImagesChange([...images, uploadedImages[0]])
      message.success('上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  // 处理删除图片
  const handleDelete = async (imageId: number) => {
    try {
      await deletePropertyImage(propertyId, imageId)
      onImagesChange(images.filter((img) => img.id !== imageId))
      message.success('删除成功')
    } catch {
      message.error('删除失败')
    }
  }

  // 上传按钮
  const uploadButton = (
    <div style={{ padding: '20px 0', textAlign: 'center' }}>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Upload
          listType="picture-card"
          beforeUpload={(file) => {
            handleUpload(file)
            return false // 阻止自动上传
          }}
          showUploadList={false}
          disabled={disabled || uploading}
          accept="image/*"
        >
          {uploadButton}
        </Upload>
      </div>

      {/* 已上传的图片列表 */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {images.map((img) => (
            <Card
              key={img.id}
              hoverable
              cover={
                <Image
                  src={buildImageUrl(img.imageUrl)}
                  alt={`房源图片 ${img.id}`}
                  style={{ width: '100%', height: 120, objectFit: 'cover' }}
                  preview={{ mask: '预览' }}
                />
              }
              actions={
                disabled
                  ? []
                  : [
                      <Popconfirm
                        key="delete"
                        title="确定删除此图片？"
                        onConfirm={() => handleDelete(img.id)}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small">
                          删除
                        </Button>
                      </Popconfirm>,
                    ]
              }
              size="small"
            >
              <Card.Meta title={`图片 ${img.sortOrder}`} />
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && !disabled && (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          暂无图片，请上传房源图片
        </div>
      )}
    </div>
  )
}
