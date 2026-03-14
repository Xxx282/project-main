import { Card, Col, Row, Space, Statistic } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getDashboard } from '../api/adminApi'
import { useTranslation } from 'react-i18next'

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const q = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getDashboard,
  })

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title={t('nav.dashboard')} />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title={t('admin.userCount')} value={q.data?.users ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title={t('admin.listingCount')} value={q.data?.listings ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title={t('admin.inquiriesToday')} value={q.data?.inquiriesToday ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title={t('admin.pendingListings')} value={q.data?.pendingListings ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title={t('admin.pendingOrders')} value={q.data?.pendingOrders ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

