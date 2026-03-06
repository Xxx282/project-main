import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Space, Avatar, message, Spin, Typography } from 'antd'
import { UserOutlined, ArrowLeftOutlined, SendOutlined, MessageOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getListing, getLandlordInfo, getTenantInfo } from '../../features/tenant/api/tenantApi'
import { useAuth } from '../../features/auth/context/AuthContext'
import { http } from '../api/http'

const { TextArea } = Input

export type Message = {
  id: number
  conversationId: number
  senderId: number
  senderRole: 'tenant' | 'landlord'
  content: string
  isRead: boolean
  createdAt: string
}

export type ConversationDetail = {
  id: number
  propertyId: number
  landlordId: number
  tenantId: number
  status: string
  lastMessage?: string
  unreadTenantCount?: number
  unreadLandlordCount?: number
  createdAt: string
}

// API返回的响应类型（嵌套结构）
type ConversationDetailResponse = {
  conversation: ConversationDetail
  messages: Message[]
}

// 获取对话详情
async function getConversationDetail(conversationId: number): Promise<ConversationDetail> {
  const { data } = await http.get<{ code: number; data: ConversationDetailResponse }>(`/conversations/${conversationId}`)
  return data.data.conversation
}

// 获取对话消息列表
async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const { data } = await http.get<{ code: number; data: { conversation: ConversationDetail; messages: Message[] } }>(`/conversations/${conversationId}`)
  return data.data.messages
}

// 发送消息
async function sendMessage(conversationId: number, content: string): Promise<Message> {
  const { data } = await http.post<{ code: number; data: Message }>(`/conversations/${conversationId}/messages`, { content })
  return data.data
}

export type InquiryChatProps = {
  conversationId: number
  userRole: 'tenant' | 'landlord'
  listPath: string // 返回列表的路径
}

export function InquiryChat({ conversationId, userRole, listPath }: InquiryChatProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 获取对话详情
  const conversationQ = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversationDetail(conversationId),
    enabled: Boolean(conversationId),
  })

  // 获取消息列表
  const messagesQ = useQuery({
    queryKey: ['conversation', conversationId, 'messages'],
    queryFn: () => getConversationMessages(conversationId),
    enabled: Boolean(conversationId),
  })

  // 获取房源详情
  const propertyId = conversationQ.data?.propertyId
  const listingQ = useQuery({
    queryKey: ['listing', propertyId],
    queryFn: () => getListing(propertyId!),
    enabled: Boolean(propertyId),
  })

  // 根据角色获取对方信息
  const otherPartyQ = useQuery({
    queryKey: ['user', userRole === 'tenant' ? 'landlord' : 'tenant', propertyId],
    queryFn: () => {
      if (userRole === 'tenant') {
        return getLandlordInfo(propertyId!)
      } else {
        // 房东获取租客信息
        return getTenantInfo(conversationQ.data?.tenantId!)
      }
    },
    enabled: Boolean(propertyId) && Boolean(userRole === 'landlord' ? conversationQ.data?.tenantId : propertyId),
  })

  // 发送消息 mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(conversationId, content),
    onSuccess: () => {
      message.success('消息已发送')
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      setInputMessage('')
    },
    onError: () => {
      message.error('发送失败')
    },
  })

  const [inputMessage, setInputMessage] = useState('')

  // 标记已读
  useEffect(() => {
    if (conversationId && auth.user) {
      http.put(`/conversations/${conversationId}/read`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      })
    }
  }, [conversationId, auth.user, queryClient])

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesQ.data])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      message.warning('请输入消息内容')
      return
    }
    if (!auth.user) {
      message.warning('请先登录')
      return
    }
    sendMessageMutation.mutate(inputMessage)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 加载状态：对于房东需要等otherPartyQ加载完成，租客不需要
  const isOtherPartyLoading = userRole === 'landlord' ? otherPartyQ.isLoading : false
  if (conversationQ.isLoading || listingQ.isLoading || isOtherPartyLoading) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!conversationQ.data) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
        padding: '24px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(listPath)}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
              }}
            >
              返回咨询列表
            </Button>
            <Card
              style={{ 
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                咨询信息加载失败
              </div>
            </Card>
          </Space>
        </div>
      </div>
    )
  }

  const messages: Message[] = messagesQ.data ?? []
  const isTenant = userRole === 'tenant'

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          {/* 返回按钮 */}
          <Button 
            type="primary"
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(listPath)}
            size="large"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              color: '#667eea',
              fontWeight: 600,
            }}
          >
            返回咨询列表
          </Button>

          {/* 聊天区域 */}
          <Card
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              height: '600px', 
              display: 'flex', 
              flexDirection: 'column' 
            }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Avatar 
                  size="default" 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: isTenant ? '#667eea' : '#52c41a',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }} 
                />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {isTenant ? '房东' : '租客'}: {otherPartyQ.data?.username || '-'}
                    {otherPartyQ.data?.realName && ` (${otherPartyQ.data.realName})`}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HomeOutlined />
                    <span>{listingQ.data?.title}</span>
                    <span style={{ marginLeft: 8, color: '#667eea', fontWeight: 600 }}>
                      ₹{listingQ.data?.price}/月
                    </span>
                  </div>
                </div>
              </div>
            }
            bodyStyle={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            {/* 聊天记录区域 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#fafafa' }}>
              {messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  padding: '60px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}>
                  <MessageOutlined style={{ fontSize: 64, marginBottom: 16, color: '#d9d9d9' }} />
                  <Typography.Text style={{ fontSize: 16 }}>
                    暂无聊天记录，请发送消息开始咨询
                  </Typography.Text>
                </div>
              ) : (
                <div>
                  {messages.map((msg) => {
                    const isMe = (isTenant && msg.senderRole === 'tenant') || (!isTenant && msg.senderRole === 'landlord')
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '12px 16px',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMe 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                              : '#fff',
                            color: isMe ? '#fff' : '#000',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.8 }}>
                            {msg.senderRole === 'tenant' ? '租客' : '房东'}
                          </div>
                          <div style={{ fontSize: 15, lineHeight: 1.5 }}>{msg.content}</div>
                          <div style={{ fontSize: 11, textAlign: 'right', marginTop: 6, opacity: 0.7 }}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div style={{ 
              padding: '16px', 
              borderTop: '1px solid #f0f0f0', 
              display: 'flex', 
              gap: 12,
              background: '#fff',
            }}>
              <TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入消息内容..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
                size="large"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={sendMessageMutation.isPending}
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #667eea 50%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  height: 'auto',
                  padding: '0 24px',
                }}
              >
                发送
              </Button>
            </div>
          </Card>
        </Space>
      </div>
    </div>
  )
}
