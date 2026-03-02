import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Space, Avatar, message, Spin } from 'antd'
import { UserOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!conversationQ.data) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(listPath)}>
          返回咨询列表
        </Button>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            咨询信息加载失败
          </div>
        </Card>
      </Space>
    )
  }

  const messages: Message[] = messagesQ.data ?? []
  const isTenant = userRole === 'tenant'

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {/* 返回按钮 */}
      <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate(listPath)}>
        返回咨询列表
      </Button>

      {/* 聊天区域 - 包含对方信息头部 */}
      <Card
        title={
          <Space>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <span>
              {isTenant ? '房东' : '租客'}: {otherPartyQ.data?.username || '-'}
              {otherPartyQ.data?.realName && ` (${otherPartyQ.data.realName})`}
            </span>
            <span style={{ color: '#999', fontSize: 12 }}>
              房源: {listingQ.data?.title}
            </span>
          </Space>
        }
        extra={
          <span style={{ fontSize: 12, color: '#999' }}>
            ¥{listingQ.data?.price}/月
          </span>
        }
        style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* 聊天记录区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              暂无聊天记录，请发送消息开始咨询
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
                      border: 'none',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: isMe ? '#1890ff' : '#f0f0f0',
                        color: isMe ? '#fff' : '#000',
                      }}
                    >
                      <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.7 }}>
                        {msg.senderRole === 'tenant' ? '租客' : '房东'}
                      </div>
                      <div>{msg.content}</div>
                      <div style={{ fontSize: 10, textAlign: 'right', marginTop: 4, opacity: 0.6 }}>
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
        <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
          <TextArea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="输入消息内容..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={sendMessageMutation.isPending}
          >
            发送
          </Button>
        </div>
      </Card>
    </Space>
  )
}
