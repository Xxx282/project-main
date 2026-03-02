import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Card, List, Space, Button, Modal, Form, Input, message } from 'antd'
import { MessageOutlined, UserOutlined, HomeOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { listMyInquiries, createInquiry, getListing } from '../api/tenantApi'
import { useAuth } from '../../auth/context/AuthContext'

type Conversation = {
  id: string
  listingId: number
  listingTitle: string
  lastMessage: string
  status: string
  createdAt: string
}

export function TenantInquiriesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const auth = useAuth()
  const [form] = Form.useForm()
  
  // 检查是否带入了房源 ID（从房源详情页跳转过来）
  const listingIdFromDetail = location.state?.listingId as number | undefined
  const [isModalVisible, setIsModalVisible] = useState(!!listingIdFromDetail)
  const [selectedListingId, setSelectedListingId] = useState<number | undefined>(listingIdFromDetail)

  // 获取我的咨询列表
  const inquiriesQ = useQuery({
    queryKey: ['tenant', 'inquiries'],
    queryFn: () => listMyInquiries(),
    enabled: Boolean(auth.user),
  })

  // 如果有带入的房源 ID，获取房源信息
  const listingQ = useQuery({
    queryKey: ['tenant', 'listing', selectedListingId],
    queryFn: () => getListing(selectedListingId!),
    enabled: Boolean(selectedListingId),
  })

  // 创建咨询 mutation
  const createInquiryMutation = useMutation({
    mutationFn: (data: { listingId: number; message: string }) => createInquiry(data),
    onSuccess: (data) => {
      message.success('已发起咨询')
      queryClient.invalidateQueries({ queryKey: ['tenant', 'inquiries'] })
      setIsModalVisible(false)
      form.resetFields()
      // 跳转到聊天详情页
      navigate(`/tenant/chats/${data.id}`)
    },
    onError: () => {
      message.error('发起咨询失败')
    },
  })

  // 处理对话列表数据
  const conversations: Conversation[] = (inquiriesQ.data ?? []).map((inquiry) => ({
    id: inquiry.id,
    listingId: inquiry.listingId,
    listingTitle: `房源 #${inquiry.listingId}`,
    lastMessage: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt || '',
  }))

  // 处理点击进入聊天
  const handleClick = (id: string) => {
    navigate(`/tenant/chats/${id}`)
  }

  // 处理创建咨询
  const handleCreateInquiry = () => {
    form.validateFields().then((values) => {
      createInquiryMutation.mutate({
        listingId: values.listingId,
        message: values.message,
      })
    })
  }

  // 处理弹窗关闭
  const handleModalClose = () => {
    setIsModalVisible(false)
    setSelectedListingId(undefined)
    // 清除 location state，避免刷新后又弹窗
    navigate(location.pathname, { replace: true })
  }

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'gold', text: '待回复' },
      replied: { color: 'green', text: '已回复' },
      closed: { color: 'default', text: '已关闭' },
    }
    return map[status] || { color: 'default', text: status }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="我的咨询"
        subtitle="与房东的对话列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            新建咨询
          </Button>
        }
      />

      <Card>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <MessageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无咨询记录</p>
            <p>去房源详情页向房东发起咨询吧</p>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={conversations}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '12px' }}
                onClick={() => handleClick(item.id)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  }
                  title={
                    <Space>
                      <HomeOutlined />
                      <span>{item.listingTitle}</span>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <span style={{ color: '#666' }}>{item.lastMessage}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: getStatusTag(item.status).color,
                        }}
                      >
                        {getStatusTag(item.status).text}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 新建咨询弹窗 */}
      <Modal
        title="发起咨询"
        open={isModalVisible}
        onOk={handleCreateInquiry}
        onCancel={handleModalClose}
        confirmLoading={createInquiryMutation.isPending}
        okText="发起咨询"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" initialValues={{ listingId: selectedListingId }}>
          <Form.Item
            name="listingId"
            label="房源 ID"
            rules={[{ required: true, message: '请输入房源 ID' }]}
          >
            <Input type="number" placeholder="请输入房源 ID" />
          </Form.Item>
          <Form.Item
            name="message"
            label="咨询内容"
            rules={[{ required: true, message: '请输入咨询内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入您想咨询的内容" />
          </Form.Item>
          {listingQ.data && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <strong>房源信息：</strong>
              <div>{listingQ.data.title}</div>
              <div style={{ color: '#666' }}>
                ¥{listingQ.data.price}/月 · {listingQ.data.city} {listingQ.data.region}
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </Space>
  )
}
