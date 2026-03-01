import { Card, Space, Switch, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listUsers, setUserEnabled, type AdminUser } from '../api/adminApi'

export function AdminUsersPage() {
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
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => {
      message.error('更新失败')
    },
  })

  const columns: ColumnsType<AdminUser> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '手机', dataIndex: 'phone', width: 130 },
    { title: '真实姓名', dataIndex: 'realName', width: 100 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (v: AdminUser['role']) => {
        const map: Record<AdminUser['role'], { color: string; text: string }> = {
          tenant: { color: 'blue', text: '租客' },
          landlord: { color: 'purple', text: '房东' },
          admin: { color: 'red', text: '管理员' },
        }
        return <Tag color={map[v].color}>{map[v].text}</Tag>
      },
    },
    {
      title: '状态',
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
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
  ]

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title="管理员-用户管理" />
      <Card>
        <Table<AdminUser>
          rowKey="id"
          loading={q.isLoading}
          columns={columns}
          dataSource={q.data ?? []}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </Space>
  )
}

