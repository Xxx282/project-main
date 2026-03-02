import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Space, Avatar, List, message, Spin } from 'antd'
import { UserOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getListing, getLandlordInfo, createInquiry, listMyInquiries } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'

const { TextArea } = Input

type Message = {
  id: string
  content: string
  isOwn: boolean
  createdAt: string
}

export function TenantInquiryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // id 是咨询记录的 id，需要从中获取 listingId
  const inquiryId = id

  // 获取我的咨询列表来找到对应的房源
  const inquiriesQ = useQuery({
    queryKey: ['tenant', 'inquiries'],
    queryFn: () => listMyInquiries(),
    enabled: Boolean(auth.user),
  })

  // 从咨询列表中找到当前咨询的房源 ID
  const currentInquiry = (inquiriesQ.data ?? []).find((inq) => inq.id === inquiryId)
  const propertyId = currentInquiry?.listingId || 0

  // 获取房源详情
  const listingQ = useQuery({
    queryKey: ['tenant', 'listing', propertyId],
    queryFn: () => getListing(propertyId),
    enabled: Boolean(propertyId),
  })

  // 获取房东信息
  const landlordQ = useQuery({
    queryKey: ['tenant', 'landlord', propertyId],
    queryFn: () => getLandlordInfo(propertyId),
    enabled: Boolean(propertyId),
  })

  // 发送消息 mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageContent: string) => createInquiry({ listingId: propertyId, message: messageContent }),
    onSuccess: () => {
      message.success('消息已发送')
      queryClient.invalidateQueries({ queryKey: ['tenant', 'inquiries'] })
      setInputMessage('')
    },
    onError: () => {
      message.error('发送失败')
    },
  })

  const [inputMessage, setInputMessage] = useState('')

  // 过滤出当前房源的咨询消息
  const currentInquiryMessages: Message[] = (inquiriesQ.data ?? [])
    .filter((inquiry) => inquiry.listingId === propertyId)
    .map((inquiry) => ({
      id: inquiry.id,
      content: inquiry.message,
      isOwn: true,
      createdAt: inquiry.createdAt || new Date().toISOString(),
    }))

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentInquiryMessages])

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

  if (listingQ.isLoading || landlordQ.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!listingQ.data) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tenant/inquiries')}>
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

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {/* 返回按钮 */}
      <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/tenant/inquiries')}>
        返回咨询列表
      </Button>

      {/* 聊天区域 - 包含房东信息头部 */}
      <Card
        title={
          <Space>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <span>
              房东: {landlordQ.data?.username || '-'}
              {landlordQ.data?.realName && ` (${landlordQ.data.realName})`}
            </span>
            <span style={{ color: '#999', fontSize: 12 }}>
              房源: {listingQ.data.title}
            </span>
          </Space>
        }
        extra={
          <span style={{ fontSize: 12, color: '#999' }}>
            ¥{listingQ.data.price}/月
          </span>
        }
        style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* 聊天记录区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {currentInquiryMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              暂无聊天记录，请发送消息开始咨询
            </div>
          ) : (
            <List
              dataSource={currentInquiryMessages}
              renderItem={(item) => (
                <List.Item style={{ justifyContent: item.isOwn ? 'flex-end' : 'flex-start', border: 'none' }}>
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: item.isOwn ? '#1890ff' : '#f0f0f0',
                      color: item.isOwn ? '#fff' : '#333',
                    }}
                  >
                    <div>{item.content}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 消息输入区域 */}
        <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入咨询内容..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={sendMessageMutation.isPending}
              style={{ height: 'auto' }}
            >
              发送
            </Button>
          </Space.Compact>
        </div>
      </Card>
    </Space>
  )
}
