import { Card, Space, Switch, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listUsers, setUserEnabled } from '../api/adminApi'

type UserRow = {
  id: string
  email: string
  role: 'tenant' | 'landlord' | 'admin'
  enabled: boolean
}

export function AdminUsersPage() {
  const q = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      try {
        return await listUsers()
      } catch {
        return [
          { id: 'u1', email: 'tenant@example.com', role: 'tenant', enabled: true },
          { id: 'u2', email: 'landlord@example.com', role: 'landlord', enabled: true },
          { id: 'u3', email: 'admin@example.com', role: 'admin', enabled: true },
        ]
      }
    },
  })

  const columns: ColumnsType<UserRow> = [
    { title: 'ID', dataIndex: 'id' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (v: UserRow['role']) => {
        const map: Record<UserRow['role'], { color: string; text: string }> = {
          tenant: { color: 'blue', text: '租客' },
          landlord: { color: 'purple', text: '房东' },
          admin: { color: 'red', text: '管理员' },
        }
        return <Tag color={map[v].color}>{map[v].text}</Tag>
      },
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      render: (v: boolean, row) => (
        <Switch
          checked={v}
          onChange={async (checked) => {
            try {
              await setUserEnabled(row.id, checked)
              void message.success('已更新')
              void q.refetch()
            } catch {
              void message.error('更新失败（无后端时为 mock 行为）')
            }
          }}
        />
      ),
    },
  ]

  const data: UserRow[] = (q.data ?? []).map((u) => ({
    id: String(u.id),
    email: u.email ?? '-',
    role: u.role as UserRow['role'],
    enabled: u.enabled ?? true,
  }))

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="管理员-用户管理" subtitle="（占位页）后续接入 /admin/users" />
      <Card>
        <Table<UserRow> rowKey="id" loading={q.isLoading} columns={columns} dataSource={data} pagination={false} />
      </Card>
    </Space>
  )
}

