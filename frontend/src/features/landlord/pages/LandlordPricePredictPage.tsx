import { Button, Card, Form, InputNumber, Select, Space, Typography, Row, Col, Spin, Alert, Table, message, Divider } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  HomeOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  TableOutlined
} from '@ant-design/icons'
import { pricePredict, getSimilarProperties, getClosestProperty, type SimilarProperty, type ClosestProperty } from '../api/landlordApi'

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
  const [similarProperties, setSimilarProperties] = useState<SimilarProperty[]>([])
  const [closestProperty, setClosestProperty] = useState<ClosestProperty | null>(null)

  const handlePredict = async (v: any) => {
    setLoading(true)
    setResult(null)
    setSimilarProperties([])
    setClosestProperty(null)
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

      // 分别请求预测、相似房源和最接近房源，单独处理错误
      let predictResult = null
      let similarData: SimilarProperty[] = []
      let closestData: ClosestProperty | null = null

      try {
        predictResult = await pricePredict(params)
      } catch (e) {
        console.error('预测失败:', e)
      }

      try {
        similarData = await getSimilarProperties(v.city, v.region, v.bedrooms, 10)
      } catch (e) {
        console.error('获取相似房源失败:', e)
      }

      try {
        closestData = await getClosestProperty(v.city, v.bedrooms, v.area)
      } catch (e) {
        console.error('获取最接近房源失败:', e)
      }
      
      // 如果两个都失败了，给个提示
      if (!predictResult) {
        message.error(t('pages.predictFailed') || '预测服务暂不可用，请稍后再试')
        return
      }
      
      // 确保前端一定有一个价格区间，即使后端/ML 只返回了单点价格
      const normalized = {
        ...predictResult,
        currency: predictResult.currency ?? 'CNY',
        lowerBound:
          predictResult.lowerBound ??
          (predictResult.predictedPrice ? predictResult.predictedPrice * 0.9 : undefined),
        upperBound:
          predictResult.upperBound ??
          (predictResult.predictedPrice ? predictResult.predictedPrice * 1.1 : undefined),
      }
      setResult(normalized)
      setSimilarProperties(similarData)
      setClosestProperty(closestData)
    } catch (error) {
      console.error('预测失败:', error)
      message.error(t('pages.predictFailed') || '预测失败，请检查输入信息')
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
                        dependencies={['totalFloors']}
                        rules={[
                          {
                            type: 'number',
                            min: 0,
                            message: t('pages.floorNonNegative') || '当前楼层不能为负数',
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const total = getFieldValue('totalFloors')
                              // 只在两个值都填了时进行比较
                              if (value == null || total == null) {
                                return Promise.resolve()
                              }
                              if (value <= total) {
                                return Promise.resolve()
                              }
                              return Promise.reject(
                                new Error(t('pages.floorExceedsTotal') || '当前楼层不能大于总楼层数')
                              )
                            },
                          }),
                        ]}
                      >
                        <InputNumber 
                          style={{ width: '100%' }} 
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
                        dependencies={['floor']}
                        rules={[
                          {
                            type: 'number',
                            min: 1,
                            message: t('pages.totalFloorsMin') || '总楼层数至少为 1 层',
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const floor = getFieldValue('floor')
                              if (value == null || floor == null) {
                                return Promise.resolve()
                              }
                              if (value >= floor) {
                                return Promise.resolve()
                              }
                              return Promise.reject(
                                new Error(t('pages.totalLessThanFloor') || '总楼层数不能小于当前楼层')
                              )
                            },
                          }),
                        ]}
                      >
                        <InputNumber 
                          style={{ width: '100%' }} 
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

                    {/* 综合价格参考表格 */}
                    <Card
                      style={{
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ marginBottom: 16 }}>
                        <TableOutlined style={{ marginRight: 8, color: '#667eea' }} />
                        <Typography.Title level={4} style={{ color: '#1a1a1a', margin: 0, display: 'inline' }}>
                          {t('pages.priceReference') || '价格参考'}
                        </Typography.Title>
                      </div>

                      {/* ML预测价格区间 */}
                      {result.lowerBound && result.upperBound && (
                        <>
                          <Typography.Text strong style={{ color: '#1890ff', fontSize: 14 }}>
                            {t('pages.mlPrediction') || 'ML智能预测'}
                          </Typography.Text>
                          <Table
                            dataSource={[
                              {
                                key: '1',
                                type: t('pages.minPrice') || '最低价',
                                price: result.lowerBound,
                                source: 'ML模型预测',
                                note: t('pages.minPriceNote') || '保守定价，容易出租'
                              },
                              {
                                key: '2',
                                type: t('pages.reasonablePrice') || '合理价',
                                price: result.predictedPrice,
                                source: 'ML模型推荐',
                                note: t('pages.reasonableNote') || '市场竞争力强，建议定价'
                              },
                              {
                                key: '3',
                                type: t('pages.maxPrice') || '最高价',
                                price: result.upperBound,
                                source: 'ML模型预测',
                                note: t('pages.maxPriceNote') || '高价策略，可适当调整'
                              },
                            ]}
                            size="small"
                            pagination={false}
                            rowKey="key"
                            columns={[
                              {
                                title: t('pages.priceType') || '价格类型',
                                dataIndex: 'type',
                                key: 'type',
                                width: '25%',
                                render: (text, record) => (
                                  <Space>
                                    {record.key === '1' && <span style={{ color: '#52c41a', fontWeight: 'bold' }}>●</span>}
                                    {record.key === '2' && <span style={{ color: '#667eea', fontWeight: 'bold' }}>●</span>}
                                    {record.key === '3' && <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>●</span>}
                                    <span style={{ fontWeight: 500 }}>{text}</span>
                                  </Space>
                                )
                              },
                              {
                                title: t('pages.rentPrice') || '租金',
                                dataIndex: 'price',
                                key: 'price',
                                width: '25%',
                                render: (price: number) => (
                                  <Typography.Text strong style={{ fontSize: 16 }}>
                                    {result.currency === 'CNY' ? '¥' : '₹'}{Math.round(price).toLocaleString()}
                                  </Typography.Text>
                                )
                              },
                              {
                                title: t('pages.source') || '来源',
                                dataIndex: 'source',
                                key: 'source',
                                width: '25%',
                              },
                              {
                                title: t('pages.suggestion') || '建议',
                                dataIndex: 'note',
                                key: 'note',
                                width: '25%',
                                render: (text: string) => (
                                  <Typography.Text type="secondary">{text}</Typography.Text>
                                )
                              },
                            ]}
                          />
                        </>
                      )}

                      {/* 相似房源参考 */}
                      {similarProperties.length > 0 && (
                        <>
                          <div style={{ marginTop: 24, marginBottom: 16 }}>
                            <Typography.Text strong style={{ color: '#1890ff', fontSize: 14 }}>
                              {t('pages.similarReference') || '相似房源参考'} ({t('pages.fromDatabase') || '来自数据库真实房源'})
                            </Typography.Text>
                          </div>
                          <Table
                            dataSource={similarProperties.map((p, i) => ({ ...p, key: `similar-${i}` }))}
                            size="small"
                            pagination={false}
                            rowKey="key"
                            columns={[
                              {
                                title: t('pages.title') || '房源标题',
                                dataIndex: 'title',
                                key: 'title',
                                ellipsis: true,
                              },
                              {
                                title: t('pages.city') || '城市',
                                dataIndex: 'city',
                                key: 'city',
                                width: 80,
                              },
                              {
                                title: t('pages.region') || '区域',
                                dataIndex: 'region',
                                key: 'region',
                                width: 100,
                              },
                              {
                                title: t('pages.bedroomsBHK') || '户型',
                                dataIndex: 'bedrooms',
                                key: 'bedrooms',
                                width: 60,
                                render: (val: number) => `${val}${t('pages.bhk') || '室'}`,
                              },
                              {
                                title: t('pages.area') || '面积',
                                dataIndex: 'area',
                                key: 'area',
                                width: 70,
                                render: (val: number) => `${val}m²`,
                              },
                              {
                                title: t('pages.rentPrice') || '租金',
                                dataIndex: 'price',
                                key: 'price',
                                width: 100,
                                render: (val: number) => (
                                  <Typography.Text strong style={{ color: '#52c41a' }}>
                                    {result.currency === 'CNY' ? '¥' : '₹'}{val?.toLocaleString()}
                                  </Typography.Text>
                                ),
                              },
                              {
                                title: t('pages.decoration') || '装修',
                                dataIndex: 'decoration',
                                key: 'decoration',
                                width: 90,
                              },
                            ]}
                          />
                          <div style={{ marginTop: 12, textAlign: 'right' }}>
                            <Typography.Text strong style={{ color: '#667eea', fontSize: 14 }}>
                              {t('pages.avgPrice') || '平均租金'}：
                              {result.currency === 'CNY' ? '¥' : '₹'}{
                                Math.round(similarProperties.reduce((sum, p) => sum + (p.price || 0), 0) / similarProperties.length)
                              }
                            </Typography.Text>
                          </div>
                        </>
                      )}

                      {/* 如果没有相似房源，显示提示 */}
                      {similarProperties.length === 0 && (
                        <div style={{ marginTop: 16, padding: '12px', background: '#fffbe6', borderRadius: '8px', border: '1px solid #ffe58f' }}>
                          <Typography.Text>
                            <InfoCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
                            {t('pages.noSimilar') || '数据库中暂无相似房源数据，建议参考ML预测价格进行定价'}
                          </Typography.Text>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                            {t('pages.noSimilarHint') || '若需展示相似房源：请先在项目根目录运行 import_properties.py 导入示例房源数据（需 MySQL 已启动且存在用户 id=2 的房东）。'}
                          </div>
                        </div>
                      )}

                      {/* 最接近的房源完整信息 */}
                      {closestProperty && (
                        <Card
                          style={{
                            marginTop: 24,
                            background: '#f6ffed',
                            borderRadius: '12px',
                            border: '1px solid #b7eb8f',
                          }}
                        >
                          <div style={{ marginBottom: 16 }}>
                            <Typography.Title level={5} style={{ color: '#52c41a', margin: 0, display: 'inline' }}>
                              {t('pages.closestProperty') || '数据库中最接近的房源'}
                            </Typography.Title>
                          </div>

                          <Row gutter={[16, 12]}>
                            <Col xs={24}>
                              <Typography.Text type="secondary">{t('pages.title') || '标题'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.title}</Typography.Text>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Typography.Text type="secondary">{t('pages.city') || '城市'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.city}</Typography.Text>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Typography.Text type="secondary">{t('pages.region') || '区域'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.region}</Typography.Text>
                            </Col>
                            <Col xs={24}>
                              <Typography.Text type="secondary">{t('pages.address') || '地址'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.address}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Typography.Text type="secondary">{t('pages.bedroomsBHK') || '户型'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.bedrooms}{t('pages.bhk') || '室'}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Typography.Text type="secondary">{t('pages.bathrooms') || '卫生间'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.bathrooms}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Typography.Text type="secondary">{t('pages.area') || '面积'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.area} m²</Typography.Text>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Typography.Text type="secondary">{t('pages.totalFloors') || '总楼层'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.totalFloors}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Typography.Text type="secondary">{t('pages.decoration') || '装修'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.decoration}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Typography.Text type="secondary">{t('pages.status') || '状态'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.status}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Typography.Text type="secondary">{t('pages.views') || '浏览量'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8 }}>{closestProperty.viewCount}</Typography.Text>
                            </Col>
                            <Col xs={24}>
                              <Divider style={{ margin: '12px 0' }} />
                              <Typography.Text type="secondary">{t('pages.rentPrice') || '租金'}：</Typography.Text>
                              <Typography.Text strong style={{ marginLeft: 8, fontSize: 20, color: '#52c41a' }}>
                                {result.currency === 'CNY' ? '¥' : '₹'}{closestProperty.price?.toLocaleString()}
                              </Typography.Text>
                            </Col>
                            {closestProperty.description && (
                              <Col xs={24}>
                                <Typography.Text type="secondary">{t('pages.description') || '描述'}：</Typography.Text>
                                <Typography.Text style={{ marginLeft: 8 }}>{closestProperty.description}</Typography.Text>
                              </Col>
                            )}
                          </Row>
                        </Card>
                      )}
                    </Card>

                    {/* 置信度提示 */}
                    {result.confidence && (
                      <Alert
                        message={`${t('pages.confidence') || '预测置信度'}: ${(result.confidence * 100).toFixed(0)}%`}
                        description={t('pages.confidenceDesc') || '置信度越高，表示预测结果越可靠。建议结合相似房源实际价格综合考虑定价。'}
                        type="info"
                        icon={<InfoCircleOutlined />}
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    )}
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
