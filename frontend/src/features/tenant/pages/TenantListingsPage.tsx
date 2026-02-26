import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listListings } from '../api/tenantApi'
import type { Listing } from '../../../shared/api/types'

export function TenantListingsPage() {
  const [params, setParams] = useSearchParams()

  const query = useMemo(() => {
    const q = params.get('q') ?? undefined
    const region = params.get('region') ?? undefined
    const bedrooms = params.get('bedrooms')
    const minRent = params.get('minRent')
    const maxRent = params.get('maxRent')
    return {
      q,
      region,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      minRent: minRent ? Number(minRent) : undefined,
      maxRent: maxRent ? Number(maxRent) : undefined,
    }
  }, [params])

  const listingsQ = useQuery({
    queryKey: ['tenant', 'listings', query],
    queryFn: () => listListings(query),
  })

  const columns: ColumnsType<Listing> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title' },
    {
      title: '城市/区域',
      render: (_, row) => (
        <span>
          {row.city ?? '-'} {row.region ? `/ ${row.region}` : ''}
        </span>
      ),
    },
    { title: '租金', dataIndex: 'price', render: (v) => `¥ ${v}` },
    {
      title: '户型',
      render: (_, row) => (
        <Tag>
          {(row.bedrooms ?? '-') + '室'} / {(row.bathrooms ?? '-') + '卫'}
        </Tag>
      ),
    },
    {
      title: '装修/朝向',
      render: (_, row) => (
        <Tag>
          {row.decoration === 'rough' && '毛坯'}
          {row.decoration === 'simple' && '简装'}
          {row.decoration === 'fine' && '精装'}
          {row.decoration === 'luxury' && '豪华'}
          {row.decoration ? ' / ' : ''}
          {row.orientation === 'east' && '东'}
          {row.orientation === 'south' && '南'}
          {row.orientation === 'west' && '西'}
          {row.orientation === 'north' && '北'}
          {!row.decoration && !row.orientation && '-'}
        </Tag>
      ),
    },
    {
      title: '操作',
      render: (_, row) => <Link to={`/tenant/listings/${row.id}`}>详情</Link>,
    },
  ]

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="租客-房源列表" subtitle="支持搜索/筛选（无后端时自动使用 mock 数据）" />

      <Card title="筛选" style={{ maxWidth: 980 }}>
        <Form
          layout="inline"
          initialValues={query}
          onFinish={(v) => {
            const next = new URLSearchParams()
            if (v.q) next.set('q', v.q)
            if (v.region) next.set('region', v.region)
            if (v.bedrooms) next.set('bedrooms', String(v.bedrooms))
            if (v.minRent != null) next.set('minRent', String(v.minRent))
            if (v.maxRent != null) next.set('maxRent', String(v.maxRent))
            setParams(next)
          }}
        >
          <Form.Item name="q" label="关键词">
            <Input placeholder="如：地铁/两室" allowClear style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="region" label="区域">
            <Select
              allowClear
              style={{ width: 160 }}
              options={[
                { label: '示例区域 A', value: '示例区域 A' },
                { label: '示例区域 B', value: '示例区域 B' },
              ]}
              placeholder="全部"
            />
          </Form.Item>
          <Form.Item name="bedrooms" label="卧室数">
            <Select
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
              ]}
              placeholder="全部"
            />
          </Form.Item>
          <Form.Item name="minRent" label="最低租金">
            <InputNumber min={0} placeholder="0" />
          </Form.Item>
          <Form.Item name="maxRent" label="最高租金">
            <InputNumber min={0} placeholder="不限" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              应用
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              onClick={() => {
                setParams(new URLSearchParams())
              }}
            >
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="房源">
        <Table<Listing>
          rowKey="id"
          loading={listingsQ.isLoading}
          columns={columns}
          dataSource={listingsQ.data ?? []}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </Space>
  )
}

