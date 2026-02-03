import { Breadcrumb, Space, Typography } from 'antd'
import type { BreadcrumbProps } from 'antd'
import React from 'react'

export function PageHeader(props: {
  title: string
  subtitle?: string
  breadcrumbItems?: BreadcrumbProps['items']
  extra?: React.ReactNode
}) {
  return (
    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
      {props.breadcrumbItems?.length ? (
        <Breadcrumb items={props.breadcrumbItems} />
      ) : null}
      <Space
        align="baseline"
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <Space orientation="vertical" size={0}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {props.title}
          </Typography.Title>
          {props.subtitle ? (
            <Typography.Text type="secondary">{props.subtitle}</Typography.Text>
          ) : null}
        </Space>
        {props.extra}
      </Space>
    </Space>
  )
}

