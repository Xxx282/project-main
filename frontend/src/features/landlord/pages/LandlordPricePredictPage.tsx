import { Button, Card, Form, Input, InputNumber, Select, Space, Typography, Row, Col, Spin, Alert, Table, message, Divider, Tag } from 'antd'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts'
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

// 装修选项：value 传 API，label 用 i18n
const FURNISHING_OPTIONS_I18N: { value: string; i18nKey: string }[] = [
  { value: 'Furnished', i18nKey: 'pages.furnished' },
  { value: 'Semi-Furnished', i18nKey: 'pages.semiFurnished' },
  { value: 'Unfurnished', i18nKey: 'pages.unfurnished' },
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
        console.log('[页面] 预测结果:', predictResult)
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
      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* 页面标题 */}
          <Card 
            style={{ 
              borderRadius: 12,
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
              border: 'none',
            }}
          >
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <CalculatorOutlined style={{ fontSize: 32, color: '#b4a5e8', marginBottom: 8 }} />
              <Typography.Title level={2} style={{ margin: '8px 0', color: '#1a1a1a' }}>
                {t('pages.landlordPricePredict')}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                {t('pages.pricePredictSubtitle')}
              </Typography.Text>
            </div>
          </Card>

          <Row gutter={[24, 24]}>
            {/* 左侧表单 - 更窄，留更多空间给右侧结果 */}
            <Col xs={24} lg={9}>
              <Card 
                style={{ 
                  borderRadius: 12,
                  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
                  border: 'none',
                  height: '100%',
                }}
              >
                <Form
                  layout="vertical"
                  initialValues={{
                    bedrooms: 2,
                    bathrooms: 1,
                    area: 60,
                    city: '',
                    region: '',
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
                            <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
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
                            <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
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
                        <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
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
                            <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                            {t('pages.city')}
                          </span>
                        }
                        rules={[{ required: true, message: t('pages.enterCity') || '请输入城市' }]}
                      >
                        <Input 
                          placeholder={t('pages.enterCity')}
                          size="large"
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="region" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                            {t('pages.region')}
                          </span>
                        }
                      >
                        <Input 
                          placeholder={t('pages.enterRegionName')}
                          size="large"
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item 
                    name="decoration" 
                    label={
                      <span>
                        <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
                        {t('pages.decoration')}
                      </span>
                    }
                  >
                    <Select 
                      options={FURNISHING_OPTIONS_I18N.map(({ value, i18nKey }) => ({
                        label: t(i18nKey),
                        value,
                      }))}
                      placeholder={t('pages.select')}
                      size="large"
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="floor" 
                        label={
                          <span>
                            <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
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
                            <HomeOutlined style={{ marginRight: 8, color: '#b4a5e8' }} />
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
                        background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(180, 165, 232, 0.4)',
                      }}
                    >
                      {t('pages.predictRent')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* 右侧结果展示 - 更宽，表格和房源详情有足够空间 */}
            <Col xs={24} lg={15}>
              <Card 
                style={{ 
                  borderRadius: 12,
                  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
                  border: 'none',
                  height: '100%',
                  minHeight: 400,
                  overflow: 'hidden',
                }}
                styles={{ body: { overflow: 'hidden' } }}
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
                      indicator={<LoadingOutlined style={{ fontSize: 48, color: '#b4a5e8' }} spin />} 
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
                    {/* 主预测结果 - 大字居中展示 */}
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '24px 16px',
                      background: 'linear-gradient(135deg, #b4a5e8 0%, #c4b5fd 100%)',
                      borderRadius: 16,
                      marginBottom: 20,
                    }}>
                      <CheckCircleOutlined
                        style={{
                          fontSize: 40,
                          color: '#fff',
                          marginBottom: 8,
                        }}
                      />
                      <Typography.Title level={4} style={{ color: '#fff', margin: '0 0 8px', opacity: 0.9 }}>
                        {t('pages.predictionResult')}
                      </Typography.Title>
                      <div style={{ 
                        fontSize: 42, 
                        fontWeight: 700, 
                        color: '#fff',
                        lineHeight: 1.2,
                      }}>
                        {'￥'}{Math.round(result.predictedPrice).toLocaleString()}
                        <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.8 }}>/{t('common.yuanPerMonth') || '月'}</span>
                      </div>
                      <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                        {t('pages.reasonablePrice') || '建议定价'}
                      </Typography.Text>
                    </div>

                    {/* ML 智能预测 - 柱状图 */}
                    {result.lowerBound && result.upperBound && (() => {
                      const currencySym = '￥'
                      const chartData = [
                        { name: t('pages.minPrice') || '最低', value: Math.round(result.lowerBound!), color: '#52c41a' },
                        { name: t('pages.reasonablePrice') || '建议', value: Math.round(result.predictedPrice), color: '#b4a5e8' },
                        { name: t('pages.maxPrice') || '最高', value: Math.round(result.upperBound!), color: '#ff4d4f' },
                      ]
                      return (
                        <Card
                          style={{
                            background: '#fff',
                            borderRadius: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            marginBottom: 16,
                          }}
                          styles={{ body: { padding: 16 } }}
                        >
                          <Typography.Text strong style={{ fontSize: 15, color: '#1a1a1a' }}>
                            {t('pages.mlPrediction') || 'ML智能预测'}
                          </Typography.Text>
                          <div style={{ marginTop: 12, width: '100%', height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={chartData}
                                margin={{ top: 16, right: 24, left: 8, bottom: 24 }}
                              >
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `${currencySym}${v.toLocaleString()}`} fontSize={12} width={52} />
                                <Tooltip
                                  formatter={(value: number) => [`${currencySym}${value.toLocaleString()}`, t('common.yuanPerMonth') || '元/月']}
                                  contentStyle={{ borderRadius: 8 }}
                                  labelStyle={{ fontWeight: 600 }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48} maxBarSize={64}>
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      )
                    })()}

                    {/* 相似房源参考 - 卡片式展示 */}
                      {similarProperties.length > 0 && (
                        <Card
                          size="small"
                          style={{
                            background: '#fafafa',
                            borderRadius: 12,
                            marginBottom: 16,
                          }}
                          styles={{ body: { padding: 12 } }}
                        >
                          <div style={{ marginBottom: 12 }}>
                            <Typography.Text strong style={{ color: '#b4a5e8', fontSize: 14 }}>
                              {t('pages.similarReference') || '相似房源参考'}
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                              ({t('pages.fromDatabase') || '来自数据库'})
                            </Typography.Text>
                          </div>
                          <div style={{ overflowX: 'auto', marginRight: -12 }}>
                          <Table
                            dataSource={similarProperties.slice(0, 5).map((p, i) => ({ ...p, key: `similar-${i}` }))}
                            size="small"
                            pagination={false}
                            rowKey="key"
                            scroll={{ x: 380 }}
                            columns={[
                              {
                                title: t('pages.city') || '城市',
                                dataIndex: 'city',
                                key: 'city',
                                width: 72,
                                ellipsis: true,
                              },
                              {
                                title: t('pages.region') || '区域',
                                dataIndex: 'region',
                                key: 'region',
                                width: 72,
                                ellipsis: true,
                              },
                              {
                                title: t('pages.bedroomsBHK') || '户型',
                                dataIndex: 'bedrooms',
                                key: 'bedrooms',
                                width: 56,
                                render: (val: number) => `${val}${t('pages.bhk') || '室'}`,
                              },
                              {
                                title: t('pages.area') || '面积',
                                dataIndex: 'area',
                                key: 'area',
                                width: 56,
                                render: (val: number) => `${val}m²`,
                              },
                              {
                                title: t('pages.rentPrice') || '租金',
                                dataIndex: 'price',
                                key: 'price',
                                width: 88,
                                render: (val: number) => (
                                  <Typography.Text strong style={{ color: '#f97316', fontSize: 14 }}>
                                    {'￥'}{val?.toLocaleString()}
                                  </Typography.Text>
                                ),
                              },
                              {
                                title: t('pages.decorationLabel') || '装修',
                                dataIndex: 'decoration',
                                key: 'decoration',
                                width: 68,
                                render: (val: string) => {
                                  const colorMap: Record<string, string> = {
                                    'fine': 'green', 'luxury': 'purple', 'simple': 'blue', 'rough': 'default'
                                  }
                                  const labelMap: Record<string, string> = {
                                    rough: t('common.rough'),
                                    simple: t('common.simple'),
                                    fine: t('common.fine'),
                                    luxury: t('common.luxury'),
                                  }
                                  return <Tag color={colorMap[val] || 'default'} style={{ fontSize: 11 }}>{labelMap[val] || val}</Tag>
                                },
                              },
                            ]}
                          />
                          </div>
                          <div style={{ marginTop: 10, textAlign: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                              {t('pages.avgRent') || '平均租金'}：
                            </Typography.Text>
                            <Typography.Text strong style={{ color: '#f97316', fontSize: 16 }}>
                              {'￥'}{
                                Math.round(similarProperties.reduce((sum, p) => sum + (p.price || 0), 0) / similarProperties.length).toLocaleString()
                              }
                            </Typography.Text>
                          </div>
                        </Card>
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
                          styles={{ body: { padding: '24px 28px' } }}
                        >
                          <div style={{ marginBottom: 20 }}>
                            <Typography.Title level={5} style={{ color: '#52c41a', margin: 0, display: 'inline' }}>
                              {t('pages.closestProperty') || '数据库中最接近的房源'}
                            </Typography.Title>
                          </div>

                          <Row gutter={[24, 18]} style={{ lineHeight: 1.6 }}>
                            {/* 标题、地址、描述：label 上、value 下，避免文字挤 */}
                            <Col xs={24}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.title') || '标题'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong style={{ display: 'block', fontSize: 15 }}>{closestProperty.title}</Typography.Text>
                            </Col>
                            <Col xs={24} sm={12}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.city') || '城市'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>{closestProperty.city}</Typography.Text>
                            </Col>
                            <Col xs={24} sm={12}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.region') || '区域'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>{closestProperty.region}</Typography.Text>
                            </Col>
                            <Col xs={24}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.address') || '地址'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong style={{ display: 'block', wordBreak: 'break-word' }}>{closestProperty.address}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={8}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.bedroomsBHK') || '户型'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>{closestProperty.bedrooms}{t('pages.bhk') || '室'}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={8}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.bathrooms') || '卫生间'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>{closestProperty.bathrooms}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={8}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.area') || '面积'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>{closestProperty.area} m²</Typography.Text>
                            </Col>
                            <Col xs={12} sm={8}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.totalFloors') || '总楼层'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>{closestProperty.totalFloors}</Typography.Text>
                            </Col>
                            <Col xs={12} sm={8}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.decoration') || '装修'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>
                                {closestProperty.decoration === 'rough' ? t('common.rough') :
                                 closestProperty.decoration === 'simple' ? t('common.simple') :
                                 closestProperty.decoration === 'fine' ? t('common.fine') :
                                 closestProperty.decoration === 'luxury' ? t('common.luxury') : closestProperty.decoration}
                              </Typography.Text>
                            </Col>
                            <Col xs={12} sm={8}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.status') || '状态'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>
                                {closestProperty.status === 'available' ? t('pages.available') :
                                 closestProperty.status === 'rented' ? t('pages.rented') :
                                 closestProperty.status === 'offline' ? t('pages.offline') : closestProperty.status}
                              </Typography.Text>
                            </Col>
                            <Col xs={12} sm={8}>
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.views') || '浏览量'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong>{closestProperty.viewCount}</Typography.Text>
                            </Col>
                            <Col xs={24}>
                              <Divider style={{ margin: '16px 0' }} />
                              <div style={{ marginBottom: 4 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                  {t('pages.rentPrice') || '租金'}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong style={{ fontSize: 22, color: '#52c41a' }}>
                                {'￥'}{closestProperty.price?.toLocaleString()}
                              </Typography.Text>
                            </Col>
                            {closestProperty.description && (
                              <Col xs={24}>
                                <div style={{ marginBottom: 4 }}>
                                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                    {t('pages.description') || '描述'}
                                  </Typography.Text>
                                </div>
                                <Typography.Text style={{ display: 'block', wordBreak: 'break-word', lineHeight: 1.65 }}>
                                  {closestProperty.description}
                                </Typography.Text>
                              </Col>
                            )}
                          </Row>
                        </Card>
                      )}

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
