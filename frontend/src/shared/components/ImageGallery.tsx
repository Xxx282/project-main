import { Image, Row } from 'antd'
import type { PropertyImage } from '../api/types'

interface ImageGalleryProps {
  images: PropertyImage[]
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

export function ImageGallery({ images }: ImageGalleryProps) {
  if (!images || images.length === 0) {
    return null
  }

  // 第一张图片作为封面（大图展示）
  const coverImage = images[0]
  // 其余图片作为缩略图
  const thumbnailImages = images.slice(1)

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 封面大图 */}
      <div style={{ marginBottom: 8 }}>
        <Image
          src={buildImageUrl(coverImage.imageUrl)}
          alt="房源封面"
          style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
          preview={{ mask: '点击预览' }}
        />
      </div>

      {/* 缩略图列表 */}
      {thumbnailImages.length > 0 && (
        <Row gutter={8}>
          {thumbnailImages.map((img) => (
            <div key={img.id} style={{ padding: '0 4px' }}>
              <Image
                src={buildImageUrl(img.imageUrl)}
                alt={`房源图片 ${img.sortOrder}`}
                style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                preview={{ mask: '预览', maskClassName: 'image-preview-mask' }}
              />
            </div>
          ))}
        </Row>
      )}

      {/* 图片数量提示 */}
      {images.length > 0 && (
        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
          共 {images.length} 张图片
        </div>
      )}
    </div>
  )
}
