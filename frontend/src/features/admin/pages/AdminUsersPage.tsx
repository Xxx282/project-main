import { Card, Space, Switch, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listUsers, setUserEnabled, type AdminUser } from '../api/adminApi'
import { useTranslation } from 'react-i18next'

export function AdminUsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const q = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: listUsers,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      await setUserEnabled(String(id), enabled)
    },
    onSuccess: () => {
      message.success(t('pages.operationSuccess'))
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => {
      message.error(t('pages.operationFailed'))
    },
  })

  const columns: ColumnsType<AdminUser> = [
    { title: t('common.id'), dataIndex: 'id', width: 70 },
    { title: t('common.username'), dataIndex: 'username', width: 120 },
    { title: t('common.email'), dataIndex: 'email', width: 200 },
    { title: t('common.phone'), dataIndex: 'phone', width: 130 },
    { title: t('common.realName'), dataIndex: 'realName', width: 100 },
    {
      title: t('common.role'),
      dataIndex: 'role',
      width: 100,
      render: (v: AdminUser['role']) => {
        const map: Record<AdminUser['role'], { color: string; text: string }> = {
          tenant: { color: 'blue', text: t('common.tenant') },
          landlord: { color: 'purple', text: t('common.landlord') },
          admin: { color: 'red', text: t('common.admin') },
        }
        return <Tag color={map[v].color}>{map[v].text}</Tag>
      },
    },
    {
      title: t('pages.status'),
      dataIndex: 'isActive',
      width: 100,
      render: (v: boolean, record) => (
        <Switch
          checked={v}
          loading={updateMutation.isPending}
          onChange={(checked) => {
            updateMutation.mutate({ id: record.id, enabled: checked })
          }}
        />
      ),
    },
    {
      title: t('common.registeredAt'),
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
  ]

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title={t('nav.userManagement')} />
      <Card style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)' }}>
        <Table<AdminUser>
          rowKey="id"
          loading={q.isLoading}
          columns={columns}
          dataSource={q.data ?? []}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </Space>
      </div>
    </div>
  )
}

