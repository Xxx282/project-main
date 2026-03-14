import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Tag, Button, Modal, Input, message, Card, Space, Drawer } from 'antd'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getLandlordContracts, signContractAsLandlord, type RentalContract } from '../../contract/api/contractApi'
import { getLandlordPayments, confirmPayment, type PaymentOrder } from '../../payment/api/paymentApi'

// 合并订单项类型
interface OrderItem {
  type: 'contract' | 'payment'
  id: number
  title: string
  counterparty: string
  amount: number
  status: string
  createdAt: string
  data: RentalContract | PaymentOrder
}

export function LandlordOrdersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 获取合同数据
  const contractsQ = useQuery({
    queryKey: ['landlord', 'contracts'],
    queryFn: getLandlordContracts,
  })

  // 获取支付数据
  const paymentsQ = useQuery({
    queryKey: ['landlord', 'payments'],
    queryFn: () => getLandlordPayments(0, 100),
  })

  const contracts = contractsQ.data || []
  const payments = paymentsQ.data?.content || []

  // 转换合同为统一格式
  const contractItems: OrderItem[] = contracts.map((c: RentalContract) => ({
    type: 'contract',
    id: c.id,
    title: c.propertyTitle || `房源 #${c.propertyId}`,
    counterparty: c.tenantRealName || c.tenantUsername || '-',
    amount: c.monthlyRent,
    status: c.status,
    createdAt: c.createdAt,
    data: c,
  }))

  // 转换支付为统一格式
  const paymentItems: OrderItem[] = payments.map((p: PaymentOrder) => ({
    type: 'payment',
    id: p.id,
    title: p.propertyTitle || `房源 #${p.propertyId}`,
    counterparty: p.payerRealName || p.payerUsername || '-',
    amount: p.amount,
    status: p.status,
    createdAt: p.createdAt,
    data: p,
  }))

  // 合并所有订单
  const allItems = [...contractItems, ...paymentItems]

  // 待完成订单：合同(PENDING_SIGN, SIGNED) + 支付(PENDING)
  const pendingItems = allItems.filter((item) => {
    if (item.type === 'contract') {
      return item.status === 'pending_sign' || item.status === 'signed'
    }
    return item.status === 'PENDING'
  })

  // 待审核订单：支付(LANDLORD_CONFIRMED) - 房东已确认，待管理员审核
  const awaitingAdminItems = allItems.filter((item) => {
    return item.type === 'payment' && item.status === 'LANDLORD_CONFIRMED'
  })

  // 已完成订单：合同(COMPLETED, CANCELLED) + 支付(SUCCESS, REJECTED, REFUNDED)
  const completedItems = allItems.filter((item) => {
    if (item.type === 'contract') {
      return item.status === 'completed' || item.status === 'cancelled'
    }
    return item.status === 'SUCCESS' || item.status === 'REJECTED' || item.status === 'REFUNDED'
  })

  // 合同签署 mutation
  const signMutation = useMutation({
    mutationFn: signContractAsLandlord,
    onSuccess: () => {
      message.success('合同签署成功！')
      queryClient.invalidateQueries({ queryKey: ['landlord', 'contracts'] })
    },
    onError: (e: any) => message.error(e?.response?.data?.message || '签署失败'),
  })

  // 支付确认 mutation
  const confirmMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      message.success('确认收款成功！')
      queryClient.invalidateQueries({ queryKey: ['landlord', 'payments'] })
    },
    onError: (e: any) => message.error(e?.response?.data?.message || '操作失败'),
  })

  const getStatusTag = (item: OrderItem) => {
    if (item.type === 'contract') {
      const map: Record<string, { color: string; text: string }> = {
        pending_sign: { color: 'orange', text: '待租客签署' },
        signed: { color: 'blue', text: '待房东签署' },
        completed: { color: 'green', text: '已完成' },
        cancelled: { color: 'red', text: '已取消' },
      }
      const s = map[item.status] || { color: 'default', text: item.status }
      return <Tag color={s.color}>{s.text}</Tag>
    } else {
      const map: Record<string, { color: string; text: string }> = {
        PENDING: { color: 'orange', text: '待确认' },
        LANDLORD_CONFIRMED: { color: 'blue', text: '待管理员审核' },
        SUCCESS: { color: 'green', text: '已完成' },
        REJECTED: { color: 'red', text: '已拒绝' },
        REFUNDED: { color: 'default', text: '已退款' },
      }
      const s = map[item.status] || { color: 'default', text: item.status }
      return <Tag color={s.color}>{s.text}</Tag>
    }
  }

  const getTypeTag = (item: OrderItem) => {
    if (item.type === 'contract') {
      return <Tag color="purple">合同</Tag>
    } else {
      const payment = item.data as PaymentOrder
      return <Tag color="blue">{payment.paymentType === 'DEPOSIT' ? '押金' : '月租'}</Tag>
    }
  }

  const getActionButton = (item: OrderItem) => {
    if (item.type === 'contract' && item.status === 'signed') {
      return <SignContractButton contract={item.data as RentalContract} onSign={(sig) => signMutation.mutate({ contractId: item.id, signature: sig })} />
    }
    if (item.type === 'payment' && item.status === 'PENDING') {
      // 找到对应的待签署合同（宽松匹配：同一房源）
      const relatedContract = contracts.find((c: RentalContract) =>
        c.propertyId === (item.data as PaymentOrder).propertyId &&
        c.status === 'signed'
      )
      return <ConfirmPaymentButton
        order={item.data as PaymentOrder}
        contracts={contracts}
        pendingContractId={relatedContract?.id}
        onSignContract={(contractId) => {
          navigate(`/landlord/contract/sign?contractId=${contractId}&fromPayment=true`)
        }}
        onConfirm={(note) => confirmMutation.mutate({ orderId: item.id, action: 'CONFIRM', note })}
      />
    }
    return null
  }

  const columns = [
    { title: '类型', key: 'type', render: (_: any, r: OrderItem) => getTypeTag(r), width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '对方', dataIndex: 'counterparty', key: 'counterparty', width: 120 },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥ ${v?.toLocaleString()}`, width: 120 },
    { title: '状态', key: 'status', render: (_: any, r: OrderItem) => getStatusTag(r), width: 100 },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleString(), width: 170 },
    { title: '操作', key: 'action', render: (_: any, r: OrderItem) => getActionButton(r), width: 120 },
  ]

  const isLoading = contractsQ.isLoading || paymentsQ.isLoading

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="订单管理"
        subtitle="管理合同签署和支付确认"
      />

      <Card title="待完成订单" extra={<Tag color="orange">{pendingItems.length} 条</Tag>}>
        <Table
          columns={columns}
          dataSource={pendingItems}
          loading={isLoading}
          rowKey={(r) => `${r.type}-${r.id}`}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {awaitingAdminItems.length > 0 && (
        <Card title="待管理员审核" extra={<Tag color="blue">{awaitingAdminItems.length} 条</Tag>}>
          <Table
            columns={columns.slice(0, -1)}
            dataSource={awaitingAdminItems}
            loading={isLoading}
            rowKey={(r) => `${r.type}-${r.id}`}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      <Card title="已完成订单" extra={<Tag color="green">{completedItems.length} 条</Tag>}>
        <Table
          columns={columns.slice(0, -1)}
          dataSource={completedItems}
          loading={isLoading}
          rowKey={(r) => `${r.type}-${r.id}`}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
  )
}

// ===== 签名组件 =====
function SignContractButton({ contract, onSign }: { contract: RentalContract; onSign: (sig: string) => void }) {
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasStroke, setHasStroke] = useState(false)

  useEffect(() => {
    if (!open || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.strokeStyle = '#1a1a3e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [open])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy }
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current = getPos(e)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setHasStroke(true)
  }

  const endDraw = () => { isDrawing.current = false }

  const clearCanvas = () => {
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    setHasStroke(false)
  }

  const handleSign = () => {
    if (!hasStroke) { message.warning('请先完成手写签名'); return }
    const sig = canvasRef.current!.toDataURL('image/png')
    setOpen(false)
    onSign(sig)
  }

  return (
    <>
      <Button type="primary" data-contract-id={contract.id} onClick={() => setOpen(true)}>签署合同</Button>
      <Drawer
        title="房东签署合同"
        placement="bottom"
        height={350}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button onClick={clearCanvas}>清除</Button>
            <Button type="primary" onClick={handleSign} disabled={!hasStroke}>确认签署</Button>
          </Space>
        }
      >
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
            请在下方签名：合同编号 {contract.contractNo}，房源 {contract.propertyTitle}
          </div>
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            style={{ display: 'block', width: '100%', touchAction: 'none', cursor: 'crosshair', background: '#ffffff', borderRadius: 8, border: '1px solid #d9d9d9' }}
          />
        </div>
      </Drawer>
    </>
  )
}

// ===== 确认收款组件 =====
function ConfirmPaymentButton({
  order,
  contracts,
  pendingContractId,
  onSignContract,
  onConfirm
}: {
  order: PaymentOrder
  contracts: RentalContract[]
  pendingContractId?: number
  onSignContract: (contractId: number) => void
  onConfirm: (note: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContractPrompt, setShowContractPrompt] = useState(false)

  // 找到该房源下租客已签署的合同（等待房东签署）
  // 匹配逻辑：同一房源 + 租客ID匹配
  const tenantSignedContract = contracts.find(
    (c) =>
      c.propertyId === order.propertyId &&
      c.tenantId === order.payerId &&
      c.status === 'signed'
  )

  // 也尝试通过房源ID匹配（更宽松的匹配）
  const contractByProperty = contracts.find(
    (c) =>
      c.propertyId === order.propertyId &&
      c.status === 'signed'
  )

  // 合同已完成（房东也签完了）
  const contractCompleted = contracts.some(
    (c) =>
      c.propertyId === order.propertyId &&
      c.tenantId === order.payerId &&
      c.status === 'completed'
  )

  // 使用更宽松的匹配：有待签署的合同（租客已签，等房东签）
  const hasPendingContract = !!tenantSignedContract || !!contractByProperty

  // 显示用的合同信息
  const displayContract = tenantSignedContract || contractByProperty

  const handleClick = () => {
    if (contractCompleted) {
      // 合同已完成，直接确认收款
      setShowContractPrompt(false)
      setOpen(true)
    } else if (hasPendingContract) {
      // 租客已签署，等房东签署合同
      setShowContractPrompt(true)
      setOpen(true)
    } else {
      // 没有合同，提示联系租客
      setShowContractPrompt(true)
      setOpen(true)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      onConfirm(note)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSignContract = () => {
    setOpen(false)
    const contractId = pendingContractId || displayContract?.id
    if (contractId) {
      onSignContract(contractId)
    }
  }

  return (
    <>
      <Button type="primary" onClick={handleClick}>确认收款</Button>
      <Modal
        title={showContractPrompt ? '请先签订合同' : '确认收款'}
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          showContractPrompt ? (
            <Space>
              <Button onClick={() => setOpen(false)}>取消</Button>
              {displayContract ? (
                <Button type="primary" onClick={handleSignContract}>
                  立即签署合同
                </Button>
              ) : (
                <Button type="primary" disabled>
                  无待签署合同
                </Button>
              )}
            </Space>
          ) : (
            <Space>
              <Button onClick={() => setOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleConfirm} loading={loading}>
                确认收款
              </Button>
            </Space>
          )
        }
        width={showContractPrompt ? 480 : 420}
      >
        {showContractPrompt ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {displayContract ? (
              // 租客已签署合同，等待房东签署
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#1890ff' }}>
                  租客已签署合同，等待您签署
                </div>
                <div style={{ color: '#666', marginBottom: 24 }}>
                  请先签署合同，再确认收款
                </div>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, textAlign: 'left' }}>
                  <div><strong>合同编号：</strong>{displayContract.contractNo}</div>
                  <div><strong>房源：</strong>{displayContract.propertyTitle}</div>
                  <div><strong>租金：</strong>¥ {displayContract.monthlyRent?.toLocaleString()}/月</div>
                </div>
              </>
            ) : (
              // 没有合同
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#faad14' }}>
                  该租客尚未签订租房合同
                </div>
                <div style={{ color: '#666', marginBottom: 24 }}>
                  请先完成合同签订，再确认收款
                </div>
                <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: 16, textAlign: 'left' }}>
                  <div style={{ color: '#d46b08', fontWeight: 500, marginBottom: 8 }}>
                    暂无可签署的合同
                  </div>
                  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
                    该租客尚未在平台创建租房合同，请联系租客先<br/>
                    <strong>前往房源页面发起签约</strong>，完成合同签署后<br/>
                    您才能确认收款。
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', marginBottom: 8 }}>订单信息</div>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                <div>订单号：{order.orderNo}</div>
                <div>付款人：{order.payerRealName || order.payerUsername}</div>
                <div>金额：¥ {order.amount?.toLocaleString()}</div>
                <div>类型：{order.paymentType === 'DEPOSIT' ? '押金' : '月租'}</div>
              </div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: 8 }}>备注（可选）</div>
              <Input.TextArea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="输入备注信息..."
              />
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
