import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Space, Avatar, Spin, Typography, Dropdown, App } from 'antd'
import { UserOutlined, ArrowLeftOutlined, SendOutlined, MessageOutlined, HomeOutlined, PictureOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getListing, getLandlordInfo, getTenantInfo } from '../../features/tenant/api/tenantApi'
import { useAuth } from '../../features/auth/context/AuthContext'
import { http, env } from '../api/http'
import { useTranslation } from 'react-i18next'

const { TextArea } = Input

export type Message = {
  id: number
  conversationId: number
  senderId: number
  senderRole: 'tenant' | 'landlord'
  content: string
  imageUrl?: string
  /** {t('pages.image')} base64（存库后与消息共用接口返回） */
  imageData?: string
  /** {t('pages.image')} MIME 类型 */
  imageContentType?: string
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

// 发送消息（文字与{t('pages.image')}共用此接口，{t('pages.image')}存库）
async function sendMessageApi(conversationId: number, content: string, imageFile?: File): Promise<Message> {
  const formData = new FormData()
  formData.append('content', content)
  if (imageFile) {
    formData.append('image', imageFile)
  }
  const { data } = await http.post<{ code: number; data: Message }>(
    `/conversations/${conversationId}/messages`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return data.data
}

// 撤回消息
async function recallMessageApi(messageId: number): Promise<Message> {
  const { data } = await http.post<{ code: number; data: Message }>(`/conversations/messages/${messageId}/recall`)
  return data.data
}

// AI 智能回复建议（租客咨询房东场景）
async function getAiReplySuggestion(params: {
  listingTitle: string
  listingPrice: string
  listingDescription?: string
  recentMessages: string
}): Promise<string> {
  const { data } = await http.post<{ code: number; data: string }>('/ai/chat/suggest', params)
  return data.data
}

// 兼容旧数据：{t('pages.image')} URL 转成可访问地址
function getFullImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  const base = env?.apiBaseUrl ?? ''
  const origin = base ? base.replace(/\/api\/?$/, '') : ''
  return origin ? `${origin}${imageUrl}` : imageUrl
}

// 取消息中{t('pages.image')}的展示 src（优先 base64 存库，其次 imageUrl）
function getMessageImageSrc(msg: Message): string {
  if (msg.imageData) {
    const type = msg.imageContentType || 'image/jpeg'
    return `data:${type};base64,${msg.imageData}`
  }
  if (msg.imageUrl) return getFullImageUrl(msg.imageUrl)
  return ''
}

export type InquiryChatProps = {
  conversationId: number
  userRole: 'tenant' | 'landlord'
  listPath: string // 返回列表的路径
}

export function InquiryChat({ conversationId, userRole, listPath }: InquiryChatProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const { message } = App.useApp()
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

  // 发送消息 mutation（文字与{t('pages.image')}共用接口）
  const sendMessageMutation = useMutation({
    mutationFn: ({ content, image }: { content: string; image?: File }) =>
      sendMessageApi(conversationId, content, image),
    onSuccess: () => {
      message.success(t('pages.messageSent'))
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      setInputMessage('')
      setSelectedImage(null)
      setImagePreview(null)
    },
    onError: () => {
      message.error(t('pages.sendFailed'))
    },
  })

  // 撤回消息 mutation
  const recallMutation = useMutation({
    mutationFn: (messageId: number) => recallMessageApi(messageId),
    onSuccess: () => {
      message.success(t('pages.messageRecalled') || '消息已撤回')
      messagesQ.refetch()
    },
    onError: (err: Error) => {
      message.error(err.message || t('pages.recallFailed'))
    },
  })

  const [inputMessage, setInputMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!inputMessage.trim() && !selectedImage) {
      message.warning(t('pages.pleaseEnterMessage'))
      return
    }
    if (!auth.user) {
      message.warning(t('pages.pleaseLoginFirst'))
      return
    }
    sendMessageMutation.mutate({ content: inputMessage, image: selectedImage || undefined })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        message.warning(t('pages.imageSizeLimit'))
        return
      }
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 租客：获取 AI 智能回复建议
  const handleAiSuggest = async () => {
    if (!listingQ.data) return
    setAiSuggestLoading(true)
    try {
      const recentMessages = (messagesQ.data ?? [])
        .slice(-10)
        .map((m) => `${m.senderRole === 'tenant' ? t('pages.tenant') : t('pages.landlord')}: ${m.content}`)
        .join('\n')
      const suggestion = await getAiReplySuggestion({
        listingTitle: listingQ.data.title || '',
        listingPrice: String(listingQ.data.price ?? ''),
        listingDescription: listingQ.data.description || '',
        recentMessages,
      })
      setInputMessage((prev) => (prev ? `${prev}\n${suggestion}` : suggestion))
      message.success(t('pages.aiSuggestionFilled'))
    } catch {
      message.error(t('pages.aiSuggestionFailed'))
    } finally {
      setAiSuggestLoading(false)
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
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(listPath)}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: 'none',
              }}
            >
              {t('pages.backToInquiries')}
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
                {t('pages.consultInfoLoadFailed')}
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
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
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
            {t('pages.backToInquiries')}
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
                    {isTenant ? t('pages.landlord') : t('pages.tenant')}: {otherPartyQ.data?.username || '-'}
                    {otherPartyQ.data?.realName && ` (${otherPartyQ.data.realName})`}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HomeOutlined />
                    <span>{listingQ.data?.title}</span>
                    <span style={{ marginLeft: 8, color: '#667eea', fontWeight: 600 }}>
                      {t('common.yuanPerMonth').replace('/月', '')}{listingQ.data?.price}
                    </span>
                  </div>
                </div>
              </div>
            }
            styles={{ body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 } }}
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
                    {t('pages.noChatRecords')}
                  </Typography.Text>
                </div>
              ) : (
                <div>
                  {messages.map((msg) => {
                    const isMe = (isTenant && msg.senderRole === 'tenant') || (!isTenant && msg.senderRole === 'landlord')
                    const isRecalled = msg.content === '[已撤回]'

                    // 右击菜单项（仅自己发送的未撤回消息可撤回）
                    const menuItems = isMe && !isRecalled ? [
                      {
                        key: 'recall',
                        label: t('pages.recallMessage'),
                        icon: <DeleteOutlined />,
                        onClick: () => recallMutation.mutate(msg.id),
                      },
                    ] : []

                    const messageContent = (
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                            : isRecalled ? '#f5f5f5' : '#fff',
                          color: isMe ? '#fff' : '#000',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          fontStyle: isRecalled ? 'italic' : 'normal',
                          opacity: isRecalled ? 0.6 : 1,
                        }}
                      >
                        <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.8 }}>
                          {msg.senderRole === 'tenant' ? t('pages.tenant') : t('pages.landlord')}
                        </div>
                        {getMessageImageSrc(msg) && (
                          <img
                            src={getMessageImageSrc(msg)}
                            alt={t('pages.image')}
                            style={{
                              maxWidth: '100%',
                              borderRadius: '8px',
                              marginBottom: msg.content ? '8px' : 0,
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              const src = getMessageImageSrc(msg)
                              if (msg.imageData) {
                                const w = window.open('', '_blank')
                                if (w) w.document.write(`<img src="${src}" alt="${t('pages.image')}" style="max-width:100%" />`)
                              } else window.open(src, '_blank')
                            }}
                          />
                        )}
                        {msg.content && <div style={{ fontSize: 15, lineHeight: 1.5 }}>{msg.content}</div>}
                        <div style={{ fontSize: 11, textAlign: 'right', marginTop: 6, opacity: 0.7 }}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    )

                    // 右键菜单
                    if (isMe && !isRecalled) {
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                            marginBottom: 16,
                            position: 'relative',
                          }}
                        >
                          <Dropdown
                            menu={{ items: menuItems }}
                            trigger={['contextMenu']}
                          >
                            {messageContent}
                          </Dropdown>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          marginBottom: 16,
                        }}
                      >
                        {messageContent}
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
              background: '#fff',
            }}>
              {/* {t('pages.image')}预览区域 */}
              {imagePreview && (
                <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
                  <img
                    src={imagePreview}
                    alt={t('pages.image')}
                    style={{ maxHeight: '100px', borderRadius: '8px', border: '1px solid #d9d9d9' }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={handleRemoveImage}
                    style={{ position: 'absolute', top: -8, right: -8 }}
                  >
                    ×
                  </Button>
                </div>
              )}
              {isTenant && (
                <div style={{ marginBottom: 8 }}>
                  <Button
                    type="link"
                    icon={<RobotOutlined />}
                    loading={aiSuggestLoading}
                    onClick={handleAiSuggest}
                    style={{ padding: 0, color: '#667eea', fontSize: 13 }}
                  >
                    {t('pages.aiReplySuggestion')}
                  </Button>
                  <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    {t('pages.aiSuggestionDescription')}
                  </Typography.Text>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  id="chat-image-upload"
                />
                <label htmlFor="chat-image-upload">
                  <Button
                    type="text"
                    icon={<PictureOutlined />}
                    size="large"
                    style={{ color: '#667eea' }}
                    onClick={(e) => {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }}
                  >
                    {t('pages.image')}
                  </Button>
                </label>
                <TextArea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('pages.placeholder')}
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
                  {t('pages.send')}
                </Button>
              </div>
            </div>
          </Card>
        </Space>
      </div>
    </div>
  )
}
