import { useQuery } from '@tanstack/react-query'
import { Avatar, Card, Space, Tag, Typography } from 'antd'
import { MessageOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
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
    propertyTitle: item.propertyTitle || `${t('pages.property')} #${item.propertyId}`,
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
      active: { color: 'green', text: t('pages.inProgress') },
      closed: { color: 'default', text: t('pages.closed') },
    }
    return map[status] || { color: 'default', text: status }
  }

  const getOtherPartyName = (item: Conversation) => {
    if (role === 'tenant') {
      return item.landlordRealName || item.landlordUsername || `${t('common.landlord')} #${item.landlordId}`
    } else {
      return item.tenantRealName || item.tenantUsername || `${t('common.tenant')} #${item.tenantId}`
    }
  }

  const getOtherPartyLabel = () => {
    return role === 'tenant' ? t('common.landlord') : t('common.tenant')
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a5d8ff 0%, #b4a5e8 50%, #c4b5fd 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* 页面标题 */}
          <Card 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <MessageOutlined style={{ fontSize: 32, color: '#b4a5e8', marginBottom: 8 }} />
              <Typography.Title level={2} style={{ margin: '8px 0', color: '#1a1a1a' }}>
                {title}
              </Typography.Title>
              {subtitle && (
                <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                  {subtitle}
                </Typography.Text>
              )}
            </div>
          </Card>

          {/* 咨询列表卡片 */}
          <Card 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', color: '#999' }}>
                <MessageOutlined style={{ fontSize: 64, marginBottom: 16, color: '#d9d9d9' }} />
                <p style={{ fontSize: 16 }}>{t('pages.noInquiries')}</p>
              </div>
            ) : (
              <div>
                {conversations.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => handleClick(item.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '16px',
                      borderBottom: index < conversations.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'background-color 0.2s',
                      borderRadius: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Avatar
                      size={56}
                      icon={<UserOutlined />}
                      style={{ 
                        backgroundColor: role === 'tenant' ? '#b4a5e8' : '#52c41a',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <HomeOutlined style={{ color: '#b4a5e8' }} />
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{item.propertyTitle}</span>
                        <Tag color="blue">{getOtherPartyLabel()}</Tag>
                        <span style={{ color: '#999', fontSize: 14 }}>
                          {getOtherPartyName(item)}
                        </span>
                        <span style={{ color: '#999', fontSize: 12, marginLeft: 'auto' }}>
                          {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US') : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ color: '#666', fontSize: 14 }}>
                          {item.lastMessage || t('pages.noMessages')}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: getStatusTag(item.status).color,
                            marginLeft: 'auto',
                            padding: '2px 8px',
                            background: getStatusTag(item.status).color === 'green' ? '#f6ffed' : '#f5f5f5',
                            borderRadius: '4px',
                          }}
                        >
                          {getStatusTag(item.status).text}
                          {item.unreadCount && item.unreadCount > 0 && (
                            <span style={{ 
                              marginLeft: 8, 
                              color: '#ff4d4f',
                              fontWeight: 600,
                            }}>
                              {item.unreadCount} {t('pages.unreadCount')}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Space>
      </div>
    </div>
  )
}
