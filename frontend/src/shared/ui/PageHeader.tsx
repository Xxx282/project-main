import { Button, Breadcrumb, Space, Typography } from 'antd'
import type { BreadcrumbProps } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import React from 'react'

export function PageHeader(props: {
  title: string
  subtitle?: string
  breadcrumbItems?: BreadcrumbProps['items']
  extra?: React.ReactNode
  align?: 'left' | 'center'
  back?: {
    label?: string
    onClick: () => void
  }
}) {
  // 默认居中，保证所有页面标题区域统一居中展示
  const align = props.align ?? 'center'

  return (
    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
      {props.breadcrumbItems?.length ? (
        <Breadcrumb items={props.breadcrumbItems} />
      ) : null}
      <Space
        align="baseline"
        style={{
          width: '100%',
          justifyContent: align === 'center' ? 'center' : 'space-between',
          position: 'relative',
        }}
      >
        {props.back ? (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={props.back.onClick}
            style={align === 'center' ? { position: 'absolute', left: 0, top: 0 } : undefined}
          >
            {props.back.label}
          </Button>
        ) : null}
        <Space
          orientation="vertical"
          size={0}
          style={align === 'center' ? { textAlign: 'center' } : undefined}
        >
          <Typography.Title level={3} style={{ margin: 0 }}>
            {props.title}
          </Typography.Title>
          {props.subtitle ? (
            <Typography.Text type="secondary">{props.subtitle}</Typography.Text>
          ) : null}
        </Space>
        {align === 'left' ? props.extra : null}
      </Space>
      {align === 'center' && props.extra ? (
        <div style={{ width: '100%', textAlign: 'center' }}>{props.extra}</div>
      ) : null}
    </Space>
  )
}

