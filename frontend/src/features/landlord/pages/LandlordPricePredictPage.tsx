import { Button, Card, Form, InputNumber, Select, Space, Typography } from 'antd'
import { useState } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { pricePredict } from '../api/landlordApi'

export function LandlordPricePredictPage() {
  const [result, setResult] = useState<{
    predictedRent: number
    currency?: string
    confidence?: number
  } | null>(null)

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="房东-租金预测"
        subtitle="（占位页）后续接入 /pricing/predict 或 /ml/price-predict"
      />
      <Card style={{ maxWidth: 720 }}>
        <Form
          layout="vertical"
          initialValues={{ bedrooms: 2, bathrooms: 1, area: 60, region: '示例区域 A' }}
          onFinish={async (v) => {
            const r = await pricePredict(v)
            setResult(r)
          }}
        >
          <Form.Item name="bedrooms" label="卧室数">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="bathrooms" label="卫生间数">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="area" label="面积（平方英尺/平方米）">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="region" label="区域/城市">
            <Select
              options={[
                { label: '示例区域 A', value: '示例区域 A' },
                { label: '示例区域 B', value: '示例区域 B' },
              ]}
              placeholder="请选择"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            预测
          </Button>
          {result ? (
            <Typography.Paragraph style={{ marginTop: 12 }}>
              预测租金：<b>{result.predictedRent}</b> {result.currency ?? 'CNY'}（置信度：
              {result.confidence ?? '-'}）
            </Typography.Paragraph>
          ) : null}
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            后续会展示：预测租金、误差范围/置信度（如后端提供）、特征贡献（如有 SHAP/重要性）。
          </Typography.Paragraph>
        </Form>
      </Card>
    </Space>
  )
}

