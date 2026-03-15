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
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title={t('nav.dashboard')} />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)' }}>
            <Statistic title={t('admin.userCount')} value={q.data?.users ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)' }}>
            <Statistic title={t('admin.listingCount')} value={q.data?.listings ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)' }}>
            <Statistic title={t('admin.inquiriesToday')} value={q.data?.inquiriesToday ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)' }}>
            <Statistic title={t('admin.pendingListings')} value={q.data?.pendingListings ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)' }}>
            <Statistic title={t('admin.pendingOrders')} value={q.data?.pendingOrders ?? 0} loading={q.isLoading} />
          </Card>
        </Col>
      </Row>
    </Space>
      </div>
    </div>
  )
}

