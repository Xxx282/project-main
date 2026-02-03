import { Card, Col, Row, Space, Statistic } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getDashboard } from '../api/adminApi'

export function AdminDashboardPage() {
  const q = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      try {
        return await getDashboard()
      } catch {
        return { users: 1234, listings: 567, inquiriesToday: 42, pendingListings: 9 }
      }
    },
  })

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="管理员-数据看板" subtitle="（占位页）后续接入 /admin/dashboard" />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="用户数" value={q.data?.users ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="房源数" value={q.data?.listings ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="今日咨询" value={q.data?.inquiriesToday ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="待审核房源" value={q.data?.pendingListings ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

