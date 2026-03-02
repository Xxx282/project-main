import { useQuery } from '@tanstack/react-query'
import { Avatar, Card, Space, Tag } from 'antd'
import { MessageOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../ui/PageHeader'
import { listMyInquiries } from '../../features/tenant/api/tenantApi'
import { listLandlordInquiries } from '../../features/landlord/api/landlordApi'
import { useAuth } from '../../features/auth/context/AuthContext'

type Conversation = {
  id: number
  propertyId: number
  propertyTitle?: string
  landlordId: number
  landlordUsername?: string
  landlordRealName?: string
  tenantId: number
  tenantUsername?: string
  tenantRealName?: string
  lastMessage?: string
  status: string
  lastMessageAt?: string
  unreadCount?: number
  createdAt: string
}

type InquiriesListProps = {
  role: 'tenant' | 'landlord'
  title: string
  subtitle?: string
  chatPath: string
  queryKey: string[]
}

export function InquiriesList({ role, title, subtitle, chatPath, queryKey }: InquiriesListProps) {
  const navigate = useNavigate()
  const auth = useAuth()

  const inquiriesQ = useQuery({
    queryKey,
    queryFn: () => (role === 'tenant' ? listMyInquiries() : listLandlordInquiries()),
    enabled: Boolean(auth.user),
  })

  const conversations: Conversation[] = (inquiriesQ.data ?? []).map((item: any) => ({
    id: item.id,
    propertyId: item.propertyId,
    propertyTitle: item.propertyTitle || `房源 #${item.propertyId}`,
    landlordId: item.landlordId,
    landlordUsername: item.landlordUsername,
    landlordRealName: item.landlordRealName,
    tenantId: item.tenantId,
    tenantUsername: item.tenantUsername,
    tenantRealName: item.tenantRealName,
    lastMessage: item.lastMessage,
    status: item.status,
    lastMessageAt: item.lastMessageAt,
    unreadCount: role === 'tenant' ? item.unreadTenantCount : item.unreadLandlordCount,
    createdAt: item.createdAt || item.lastMessageAt || '',
  }))

  const handleClick = (id: number) => {
    navigate(`${chatPath}/${id}`)
  }

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '进行中' },
      closed: { color: 'default', text: '已关闭' },
    }
    return map[status] || { color: 'default', text: status }
  }

  const getOtherPartyName = (item: Conversation) => {
    if (role === 'tenant') {
      return item.landlordRealName || item.landlordUsername || `房东 #${item.landlordId}`
    } else {
      return item.tenantRealName || item.tenantUsername || `租客 #${item.tenantId}`
    }
  }

  const getOtherPartyLabel = () => {
    return role === 'tenant' ? '房东' : '租客'
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader title={title} subtitle={subtitle} />

      <Card>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <MessageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无咨询记录</p>
          </div>
        ) : (
          <div>
            {conversations.map((item) => (
              <div
                key={item.id}
                onClick={() => handleClick(item.id)}
                style={{
                  cursor: 'pointer',
                  padding: '12px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Avatar
                  size={48}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: role === 'tenant' ? '#1890ff' : '#52c41a' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <HomeOutlined />
                    <span>{item.propertyTitle}</span>
                    <Tag color="blue">{getOtherPartyLabel()}</Tag>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {getOtherPartyName(item)}
                    </span>
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 'auto' }}>
                      {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString('zh-CN') : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#666' }}>{item.lastMessage || '暂无消息'}</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: getStatusTag(item.status).color,
                        marginLeft: 'auto',
                      }}
                    >
                      {getStatusTag(item.status).text}
                      {item.unreadCount && item.unreadCount > 0 && ` · ${item.unreadCount} 条未读`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Space>
  )
}
