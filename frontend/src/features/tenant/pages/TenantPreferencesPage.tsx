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
import { useTranslation } from 'react-i18next'
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

// 朝向选项 - will be translated in component
const getOrientationOptions = (t: any) => [
  { label: t('common.east'), value: 'east' },
  { label: t('common.south'), value: 'south' },
  { label: t('common.west'), value: 'west' },
  { label: t('common.north'), value: 'north' },
]

// 装修选项 - will be translated in component
const getDecorationOptions = (t: any) => [
  { label: t('common.rough'), value: 'rough' },
  { label: t('common.simple'), value: 'simple' },
  { label: t('common.fine'), value: 'fine' },
  { label: t('common.luxury'), value: 'luxury' },
]

// 户型选项 - will be translated in component
const getBedroomOptions = (t: any) => [
  { label: t('pages.oneBedroom'), value: 1 },
  { label: t('pages.twoBedrooms'), value: 2 },
  { label: t('pages.threeBedrooms'), value: 3 },
  { label: t('pages.fourBedrooms'), value: 4 },
  { label: t('pages.fiveOrMoreBedrooms'), value: 5 },
]

export function TenantPreferencesPage() {
  const { t } = useTranslation()
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
      void message.success(t('pages.saveSuccess'))
      // 直接清除推荐缓存，强制重新获取
      queryClient.removeQueries({ queryKey: ['tenant', 'recommendations'] })
      // 等待一小段时间确保缓存被清除
      await new Promise(resolve => setTimeout(resolve, 100))
      navigate('/tenant/recommendations')
    } catch {
      void message.error(t('pages.saveFailed'))
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
      void message.success(t('pages.resetSuccess'))
      // 清除推荐缓存
      queryClient.removeQueries({ queryKey: ['tenant', 'recommendations'] })
      // 刷新偏好设置查询，确保缓存更新
      await queryClient.invalidateQueries({ queryKey: ['tenant', 'preferences'] })
      // 等待查询刷新完成后再更新表单，确保使用最新的空值
      await queryClient.refetchQueries({ queryKey: ['tenant', 'preferences'] })
    } catch {
      void message.error(t('pages.resetFailed'))
    }
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title={t('pages.tenantPreferences')} />
      <Card style={{ maxWidth: 900, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={() => void 0}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.budgetPerMonth')} name="budget">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('pages.budgetExample')}
                  addonAfter={t('common.yuanPerMonth')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.city')} name="city">
                <Input placeholder={t('pages.cityExample')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.region')} name="region">
                <Input placeholder={t('pages.regionExample')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.bedroomCount')} name="bedrooms">
                <Select
                  allowClear
                  options={getBedroomOptions(t)}
                  placeholder={t('pages.select')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.bathroomCount')} name="bathrooms">
                <Select
                  allowClear
                  options={[
                    { label: t('pages.one'), value: 1 },
                    { label: t('pages.two'), value: 2 },
                    { label: t('pages.threeOrMore'), value: 3 },
                  ]}
                  placeholder={t('pages.select')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.areaRange')} >
                <Input.Group compact>
                  <Form.Item name="minArea" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={0}
                      placeholder={t('pages.min')}
                      addonAfter="m²"
                    />
                  </Form.Item>
                  <span style={{ display: 'inline-block', width: '10%', textAlign: 'center' }}>~</span>
                  <Form.Item name="maxArea" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={0}
                      placeholder={t('pages.max')}
                      addonAfter="m²"
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.floorRange')} >
                <Input.Group compact>
                  <Form.Item name="minFloors" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={1}
                      placeholder={t('pages.lowest')}
                      addonAfter={t('pages.floor')}
                    />
                  </Form.Item>
                  <span style={{ display: 'inline-block', width: '10%', textAlign: 'center' }}>~</span>
                  <Form.Item name="maxFloors" noStyle>
                    <InputNumber
                      style={{ width: '45%' }}
                      min={1}
                      placeholder={t('pages.highest')}
                      addonAfter={t('pages.floor')}
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.orientation')} name="orientation">
                <Select
                  allowClear
                  options={getOrientationOptions(t)}
                  placeholder={t('pages.select')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label={t('pages.decorationLabel')} name="decoration">
                <Select
                  allowClear
                  options={getDecorationOptions(t)}
                  placeholder={t('pages.select')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={prefsQ.isLoading}>
                {t('pages.savePreferences')}
              </Button>
              <Button onClick={handleReset} loading={prefsQ.isLoading}>
                {t('pages.resetAllPreferences')}
              </Button>
              <Button onClick={() => navigate('/tenant/recommendations')}>
                {t('pages.backToRecommendations')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  )
}

