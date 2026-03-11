import { Button, Card, Form, InputNumber, Select, Space, Typography, Row, Col, Spin, Statistic, Alert } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  HomeOutlined, 
  CalculatorOutlined, 
  DollarOutlined, 
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { pricePredict } from '../api/landlordApi'

const CITY_OPTIONS = [
  { label: 'Kolkata', value: 'Kolkata' },
  { label: 'Mumbai', value: 'Mumbai' },
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Chennai', value: 'Chennai' },
  { label: 'Hyderabad', value: 'Hyderabad' },
  { label: 'Bangalore', value: 'Bangalore' },
]

const FURNISHING_OPTIONS = [
  { label: 'Furnished', value: 'Furnished' },
  { label: 'Semi-Furnished', value: 'Semi-Furnished' },
  { label: 'Unfurnished', value: 'Unfurnished' },
]

const AREA_TYPE_OPTIONS = [
  { label: 'Super Area', value: 'Super Area' },
  { label: 'Carpet Area', value: 'Carpet Area' },
  { label: 'Built Area', value: 'Built Area' },
]

export function LandlordPricePredictPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    predictedPrice: number
    currency?: string
    confidence?: number
    lowerBound?: number
    upperBound?: number
  } | null>(null)

  const handlePredict = async (v: any) => {
    setLoading(true)
    try {
      // 转换字段名以匹配 ML API
      const params = {
        bedrooms: v.bedrooms,
        area: v.area,
        city: v.city,
        region: v.region || '',
        bathrooms: v.bathrooms,
        propertyType: v.propertyType || 'Super Area',
        decoration: v.decoration || 'Unfurnished',
        floor: v.floor || 1,
        totalFloors: v.totalFloors || 5,
      }
      const r = await pricePredict(params)
      setResult(r)
    } catch (error) {
      console.error('预测失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* 页面标题 */}
          <Card 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <CalculatorOutlined style={{ fontSize: 32, color: '#667eea', marginBottom: 8 }} />
              <Typography.Title level={2} style={{ margin: '8px 0', color: '#1a1a1a' }}>
                {t('pages.landlordPricePredict')}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                {t('pages.pricePredictSubtitle')}
              </Typography.Text>
            </div>
          </Card>

          <Row gutter={[24, 24]}>
            {/* 左侧表单 */}
            <Col xs={24} lg={14}>
              <Card 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  height: '100%',
                }}
              >
                <Form
                  layout="vertical"
                  initialValues={{
                    bedrooms: 2,
                    bathrooms: 1,
                    area: 60,
                    city: 'Kolkata',
                    region: 'Bandel',
                    propertyType: 'Super Area',
                    decoration: 'Unfurnished',
                    floor: 1,
                    totalFloors: 5
                  }}
                  onFinish={handlePredict}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="bedrooms" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.bedroomsBHK')}
                          </span>
                        }
                      >
                        <InputNumber 
                          style={{ width: '100%' }} 
                          min={0} 
                          size="large"
                          placeholder="2"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="bathrooms" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.bathrooms')}
                          </span>
                        }
                      >
                        <InputNumber 
                          style={{ width: '100%' }} 
                          min={0} 
                          size="large"
                          placeholder="1"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item 
                    name="area" 
                    label={
                      <span>
                        <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                        {t('pages.area')}
                      </span>
                    }
                  >
                    <InputNumber 
                      style={{ width: '100%' }} 
                      min={0} 
                      size="large"
                      placeholder="60"
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="city" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.city')}
                          </span>
                        }
                      >
                        <Select 
                          options={CITY_OPTIONS} 
                          placeholder={t('pages.selectCity')}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="region" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.region')}
                          </span>
                        }
                      >
                        <Select
                          showSearch
                          allowClear
                          placeholder={t('pages.enterRegionName')}
                          size="large"
                          options={[
                            { label: 'Bandel', value: 'Bandel' },
                            { label: 'Phool Bagan', value: 'Phool Bagan' },
                            { label: 'Salt Lake City', value: 'Salt Lake City' },
                            { label: 'Dumdum Park', value: 'Dumdum Park' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="propertyType" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.areaType')}
                          </span>
                        }
                      >
                        <Select 
                          options={AREA_TYPE_OPTIONS} 
                          placeholder={t('pages.select')}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="decoration" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.decoration')}
                          </span>
                        }
                      >
                        <Select 
                          options={FURNISHING_OPTIONS} 
                          placeholder={t('pages.select')}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="floor" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.currentFloor')}
                          </span>
                        }
                      >
                        <InputNumber 
                          style={{ width: '100%' }} 
                          min={0} 
                          placeholder={t('pages.example')}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="totalFloors" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#667eea' }} />
                            {t('pages.totalFloors')}
                          </span>
                        }
                      >
                        <InputNumber 
                          style={{ width: '100%' }} 
                          min={1} 
                          placeholder={t('pages.example2')}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      size="large"
                      block
                      icon={<CalculatorOutlined />}
                      loading={loading}
                      style={{
                        height: 48,
                        fontSize: 16,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      {t('pages.predictRent')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* 右侧结果展示 */}
            <Col xs={24} lg={10}>
              <Card 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  height: '100%',
                  minHeight: 400,
                }}
              >
                {loading ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: 300,
                  }}>
                    <Spin 
                      indicator={<LoadingOutlined style={{ fontSize: 48, color: '#667eea' }} spin />} 
                      size="large"
                    />
                    <Typography.Text 
                      type="secondary" 
                      style={{ marginTop: 16, fontSize: 16 }}
                    >
                      {t('pages.calculating')}
                    </Typography.Text>
                  </div>
                ) : result ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <CheckCircleOutlined 
                        style={{ 
                          fontSize: 48, 
                          color: '#52c41a',
                          marginBottom: 16,
                        }} 
                      />
                      <Typography.Title level={3} style={{ color: '#1a1a1a', margin: 0 }}>
                        {t('pages.predictionResult')}
                      </Typography.Title>
                    </div>

                    <div style={{ 
                      background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: 24,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    }}>
                      <Statistic
                        title={
                          <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 16 }}>
                            {t('pages.predictedRent')}
                          </span>
                        }
                        value={result.predictedPrice}
                        precision={0}
                        prefix={<DollarOutlined style={{ color: '#fff' }} />}
                        suffix={<span style={{ color: '#fff', fontSize: 18 }}>{result.currency ?? 'INR'}</span>}
                        valueStyle={{ 
                          color: '#fff', 
                          fontSize: 36, 
                          fontWeight: 'bold',
                        }}
                      />
                    </div>

                    {result.lowerBound && result.upperBound && (
                      <Card 
                        size="small" 
                        style={{ 
                          marginBottom: 16,
                          background: '#f0f5ff',
                          border: '1px solid #d6e4ff',
                        }}
                      >
                        <Statistic
                          title={t('pages.range')}
                          value={`${result.lowerBound} - ${result.upperBound}`}
                          suffix={result.currency ?? 'INR'}
                          valueStyle={{ color: '#1890ff', fontSize: 20 }}
                        />
                      </Card>
                    )}

                    {result.confidence && (
                      <Card 
                        size="small" 
                        style={{ 
                          marginBottom: 16,
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                        }}
                      >
                        <Statistic
                          title={t('pages.confidence')}
                          value={(result.confidence * 100).toFixed(1)}
                          suffix="%"
                          valueStyle={{ color: '#52c41a', fontSize: 20 }}
                        />
                      </Card>
                    )}

                    <Alert
                      message={t('pages.predictionDescription')}
                      description={t('pages.predictionDescriptionText')}
                      type="info"
                      icon={<InfoCircleOutlined />}
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: 300,
                    textAlign: 'center',
                  }}>
                    <CalculatorOutlined 
                      style={{ 
                        fontSize: 64, 
                        color: '#d9d9d9',
                        marginBottom: 16,
                      }} 
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                      {t('pages.fillFormToPredict')}
                    </Typography.Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </div>
  )
}
