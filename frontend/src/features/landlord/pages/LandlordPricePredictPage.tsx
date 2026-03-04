import { Button, Card, Form, InputNumber, Select, Space, Typography } from 'antd'
import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
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
  const [result, setResult] = useState<{
    predictedPrice: number
    currency?: string
    confidence?: number
    lowerBound?: number
    upperBound?: number
  } | null>(null)

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="房东-租金预测"
      />
      <Card style={{ maxWidth: 720, margin: '0 auto' }}>
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
          onFinish={async (v) => {
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
          }}
        >
          <Form.Item name="bedrooms" label="卧室数 (BHK)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="bathrooms" label="卫生间数">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="area" label="面积 (平方英尺)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Select options={CITY_OPTIONS} placeholder="请选择城市" />
          </Form.Item>
          <Form.Item name="region" label="小区/区域">
            <Select
              showSearch
              allowClear
              placeholder="请输入小区名称"
              options={[
                { label: 'Bandel', value: 'Bandel' },
                { label: 'Phool Bagan', value: 'Phool Bagan' },
                { label: 'Salt Lake City', value: 'Salt Lake City' },
                { label: 'Dumdum Park', value: 'Dumdum Park' },
              ]}
            />
          </Form.Item>
          <Form.Item name="propertyType" label="面积类型">
            <Select options={AREA_TYPE_OPTIONS} placeholder="请选择" />
          </Form.Item>
          <Form.Item name="decoration" label="装修状态">
            <Select options={FURNISHING_OPTIONS} placeholder="请选择" />
          </Form.Item>
          <Form.Item name="floor" label="当前楼层">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="例如: 1" />
          </Form.Item>
          <Form.Item name="totalFloors" label="总楼层数">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="例如: 5" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            预测租金
          </Button>
          {result ? (
            <Typography.Paragraph style={{ marginTop: 16 }}>
              预测租金：<b>{result.predictedPrice}</b> {result.currency ?? 'INR'}
              {result.lowerBound && result.upperBound && (
                <>（区间: {result.lowerBound} - {result.upperBound}）</>
              )}
              {result.confidence && <><br />置信度: {(result.confidence * 100).toFixed(0)}%</>}
            </Typography.Paragraph>
          ) : null}
        </Form>
      </Card>
    </Space>
  )
}
