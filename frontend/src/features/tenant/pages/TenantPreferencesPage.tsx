import { Button, Card, Form, InputNumber, Select, Space, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getPreferences, savePreferences } from '../api/tenantApi'
import type { TenantPreferences } from '../../../shared/api/types'

export function TenantPreferencesPage() {
  const prefsQ = useQuery({
    queryKey: ['tenant', 'preferences'],
    queryFn: () => getPreferences(),
  })

  const [form] = Form.useForm<TenantPreferences>()

  // 当异步数据回来后回填表单
  useEffect(() => {
    if (prefsQ.data) form.setFieldsValue(prefsQ.data)
  }, [prefsQ.data, form])

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="租客-偏好设置" subtitle="可保存（无后端时仅本地返回）" />
      <Card style={{ maxWidth: 720 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            try {
              await savePreferences(v)
              void message.success('已保存')
            } catch {
              void message.error('保存失败')
            }
          }}
          onValuesChange={() => void 0}
        >
          <Form.Item label="预算（每月）">
            <Form.Item name="budget" noStyle>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="例如 3000" />
            </Form.Item>
          </Form.Item>
          <Form.Item label="区域">
            <Form.Item name="region" noStyle>
              <Select
                allowClear
                options={[
                  { label: '示例区域 A', value: '示例区域 A' },
                  { label: '示例区域 B', value: '示例区域 B' },
                ]}
                placeholder="请选择"
              />
            </Form.Item>
          </Form.Item>
          <Form.Item label="户型">
            <Form.Item name="bedrooms" noStyle>
              <Select
                allowClear
                options={[
                  { label: '1室', value: 1 },
                  { label: '2室', value: 2 },
                  { label: '3室', value: 3 },
                ]}
                placeholder="请选择"
              />
            </Form.Item>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={prefsQ.isLoading}>
            保存
          </Button>
        </Form>
      </Card>
    </Space>
  )
}

