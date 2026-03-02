/*
 * @Author: Mendax
 * @Date: 2026-02-17 21:23:56
 * @LastEditors: Mendax
 * @LastEditTime: 2026-03-01
 * @Description:
 * @FilePath: \project-main\frontend\src\features\tenant\pages\TenantPreferencesPage.tsx
 */
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getPreferences, savePreferences } from '../api/tenantApi'
import type { TenantPreferences } from '../../../shared/api/types'

// 城市选项 - 已废弃，改用输入框
// const CITY_OPTIONS = [
//   { label: '上海', value: '上海' },
//   { label: '北京', value: '北京' },
//   { label: '深圳', value: '深圳' },
//   { label: '杭州', value: '杭州' },
//   { label: '成都', value: '成都' },
// ]

// 朝向选项
const ORIENTATION_OPTIONS = [
  { label: '东', value: 'east' },
  { label: '南', value: 'south' },
  { label: '西', value: 'west' },
  { label: '北', value: 'north' },
]

// 装修选项
const DECORATION_OPTIONS = [
  { label: '毛坯', value: 'rough' },
  { label: '简装', value: 'simple' },
  { label: '精装', value: 'fine' },
  { label: '豪华', value: 'luxury' },
]

// 户型选项
const BEDROOM_OPTIONS = [
  { label: '1室', value: 1 },
  { label: '2室', value: 2 },
  { label: '3室', value: 3 },
  { label: '4室', value: 4 },
  { label: '5室及以上', value: 5 },
]

export function TenantPreferencesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const prefsQ = useQuery({
    queryKey: ['tenant', 'preferences'],
    queryFn: () => getPreferences(),
  })

  const [form] = Form.useForm<TenantPreferences>()

  // 当异步数据回来后回填表单
  useEffect(() => {
    if (prefsQ.data) form.setFieldsValue(prefsQ.data)
  }, [prefsQ.data, form])

  const handleSave = async (v: TenantPreferences) => {
    try {
      // 确保所有字段都被发送，将 undefined 转换为 null，以便后端能够清空字段
      const preferencesToSave: TenantPreferences = {
        budget: v.budget ?? null,
        city: v.city ?? null,
        region: v.region ?? null,
        bedrooms: v.bedrooms ?? null,
        bathrooms: v.bathrooms ?? null,
        minArea: v.minArea ?? null,
        maxArea: v.maxArea ?? null,
        minFloors: v.minFloors ?? null,
        maxFloors: v.maxFloors ?? null,
        orientation: v.orientation ?? null,
        decoration: v.decoration ?? null,
      }
      await savePreferences(preferencesToSave)
      // 刷新偏好设置查询，确保缓存更新
      await queryClient.invalidateQueries({ queryKey: ['tenant', 'preferences'] })
      void message.success('保存成功，正在刷新推荐...')
      // 直接清除推荐缓存，强制重新获取
      queryClient.removeQueries({ queryKey: ['tenant', 'recommendations'] })
      // 等待一小段时间确保缓存被清除
      await new Promise(resolve => setTimeout(resolve, 100))
      navigate('/tenant/recommendations')
    } catch {
      void message.error('保存失败')
    }
  }

  const handleReset = async () => {
    try {
      // 将所有字段设置为 null
      const emptyPreferences: TenantPreferences = {
        budget: null,
        city: null,
        region: null,
        bedrooms: null,
        bathrooms: null,
        minArea: null,
        maxArea: null,
        minFloors: null,
        maxFloors: null,
        orientation: null,
        decoration: null,
      }
      await savePreferences(emptyPreferences)
      // 立即设置表单字段值为空值，确保表单状态同步
      form.setFieldsValue(emptyPreferences)
      // 重置表单的初始值，防止后续保存时使用旧值
      form.resetFields()
      void message.success('已重置所有偏好设置')
      // 清除推荐缓存
      queryClient.removeQueries({ queryKey: ['tenant', 'recommendations'] })
      // 刷新偏好设置查询，确保缓存更新
      await queryClient.invalidateQueries({ queryKey: ['tenant', 'preferences'] })
      // 等待查询刷新完成后再更新表单，确保使用最新的空值
      await queryClient.refetchQueries({ queryKey: ['tenant', 'preferences'] })
    } catch {
      void message.error('重置失败')
    }
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="租客-偏好设置" />
      <Card style={{ maxWidth: 900, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={() => void 0}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label="预算（每月）" name="budget">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="例如 3000"
                  addonAfter="元/月"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="城市" name="city">
                <Input placeholder="例如 上海、北京、深圳" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label="区域" name="region">
                <Input placeholder="例如 朝阳区、浦东新区" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="户型（卧室数）" name="bedrooms">
                <Select
                  allowClear
                  options={BEDROOM_OPTIONS}
                  placeholder="请选择"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label="卫生间数" name="bathrooms">
                <Select
                  allowClear
                  options={[
                    { label: '1个', value: 1 },
                    { label: '2个', value: 2 },
                    { label: '3个及以上', value: 3 },
                  ]}
                  placeholder="请选择"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="面积范围" >
                <Input.Group compact>
                  <Form.Item name="minArea" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={0}
                      placeholder="最小"
                      addonAfter="m²"
                    />
                  </Form.Item>
                  <span style={{ display: 'inline-block', width: '10%', textAlign: 'center' }}>~</span>
                  <Form.Item name="maxArea" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={0}
                      placeholder="最大"
                      addonAfter="m²"
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label="楼层范围" >
                <Input.Group compact>
                  <Form.Item name="minFloors" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={1}
                      placeholder="最低"
                      addonAfter="层"
                    />
                  </Form.Item>
                  <span style={{ display: 'inline-block', width: '10%', textAlign: 'center' }}>~</span>
                  <Form.Item name="maxFloors" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={1}
                      placeholder="最高"
                      addonAfter="层"
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="朝向" name="orientation">
                <Select
                  allowClear
                  options={ORIENTATION_OPTIONS}
                  placeholder="请选择"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label="装修" name="decoration">
                <Select
                  allowClear
                  options={DECORATION_OPTIONS}
                  placeholder="请选择"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={prefsQ.isLoading}>
                保存偏好设置
              </Button>
              <Button onClick={handleReset} loading={prefsQ.isLoading}>
                重置所有偏好
              </Button>
              <Button onClick={() => navigate('/tenant/recommendations')}>
                返回推荐页面
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  )
}

