import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Tag, Button, Modal, Input, message, Card, Space, Drawer } from 'antd'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { getLandlordContracts, signContractAsLandlord, type RentalContract } from '../../contract/api/contractApi'
import { getLandlordPayments, confirmPayment, type PaymentOrder } from '../../payment/api/paymentApi'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
    title: c.propertyTitle || `${t('common.property')} #${c.propertyId}`,
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
    title: p.propertyTitle || `${t('common.property')} #${p.propertyId}`,
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
      message.success(t('pages.signSuccess'))
      queryClient.invalidateQueries({ queryKey: ['landlord', 'contracts'] })
    },
    onError: (e: any) => message.error(e?.response?.data?.message || t('pages.signFailed')),
  })

  // 支付确认 mutation
  const confirmMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      message.success(t('pages.paymentConfirmed'))
      queryClient.invalidateQueries({ queryKey: ['landlord', 'payments'] })
    },
    onError: (e: any) => message.error(e?.response?.data?.message || t('pages.operationFailed')),
  })

  const getStatusTag = (item: OrderItem) => {
    if (item.type === 'contract') {
      const map: Record<string, { color: string; text: string }> = {
        pending_sign: { color: 'orange', text: t('pages.pendingTenantSign') },
        signed: { color: 'blue', text: t('pages.pendingLandlordSign') },
        completed: { color: 'green', text: t('pages.completed') },
        cancelled: { color: 'red', text: t('pages.cancelled') },
      }
      const s = map[item.status] || { color: 'default', text: item.status }
      return <Tag color={s.color}>{s.text}</Tag>
    } else {
      const map: Record<string, { color: string; text: string }> = {
        PENDING: { color: 'orange', text: t('pages.pendingConfirm') },
        LANDLORD_CONFIRMED: { color: 'blue', text: t('pages.pendingAdminReview') },
        SUCCESS: { color: 'green', text: t('pages.completed') },
        REJECTED: { color: 'red', text: t('pages.rejected') },
        REFUNDED: { color: 'default', text: t('pages.refunded') },
      }
      const s = map[item.status] || { color: 'default', text: item.status }
      return <Tag color={s.color}>{s.text}</Tag>
    }
  }

  const getTypeTag = (item: OrderItem) => {
    if (item.type === 'contract') {
      return <Tag color="purple">{t('pages.contract')}</Tag>
    } else {
      const payment = item.data as PaymentOrder
      return <Tag color="blue">{payment.paymentType === 'DEPOSIT' ? t('pages.deposit') : t('pages.monthlyRent')}</Tag>
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
    { title: t('pages.type'), key: 'type', render: (_: any, r: OrderItem) => getTypeTag(r), width: 80 },
    { title: t('pages.title'), dataIndex: 'title', key: 'title', ellipsis: true },
    { title: t('pages.counterparty'), dataIndex: 'counterparty', key: 'counterparty', width: 120 },
    { title: t('pages.amount'), dataIndex: 'amount', key: 'amount', render: (v: number) => `¥ ${v?.toLocaleString()}`, width: 120 },
    { title: t('pages.status'), key: 'status', render: (_: any, r: OrderItem) => getStatusTag(r), width: 100 },
    { title: t('pages.time'), dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleString(), width: 170 },
    { title: t('pages.operation'), key: 'action', render: (_: any, r: OrderItem) => getActionButton(r), width: 120 },
  ]

  const isLoading = contractsQ.isLoading || paymentsQ.isLoading

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={t('pages.ordersManagement')}
        subtitle={t('pages.orderDetails')}
      />

      <Card title={t('pages.pendingOrders')} extra={<Tag color="orange">{pendingItems.length} {t('pages.item')}</Tag>}>
        <Table
          columns={columns}
          dataSource={pendingItems}
          loading={isLoading}
          rowKey={(r) => `${r.type}-${r.id}`}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {awaitingAdminItems.length > 0 && (
        <Card title={t('pages.awaitingAdminOrders')} extra={<Tag color="blue">{awaitingAdminItems.length} {t('pages.item')}</Tag>}>
          <Table
            columns={columns.slice(0, -1)}
            dataSource={awaitingAdminItems}
            loading={isLoading}
            rowKey={(r) => `${r.type}-${r.id}`}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      <Card title={t('pages.completedOrders')} extra={<Tag color="green">{completedItems.length} {t('pages.item')}</Tag>}>
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
  const { t } = useTranslation()
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
    if (!hasStroke) { message.warning(t('pages.pleaseSignFirst')); return }
    const sig = canvasRef.current!.toDataURL('image/png')
    setOpen(false)
    onSign(sig)
  }

  return (
    <>
      <Button type="primary" data-contract-id={contract.id} onClick={() => setOpen(true)}>{t('pages.signContract')}</Button>
      <Drawer
        title={t('pages.landlordSignsContract')}
        placement="bottom"
        styles={{ wrapper: { height: 350 } }}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button onClick={clearCanvas}>{t('pages.clearCanvas')}</Button>
            <Button type="primary" onClick={handleSign} disabled={!hasStroke}>{t('pages.confirmSign')}</Button>
          </Space>
        }
      >
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
            {t('pages.signHerePrompt', { contractNo: contract.contractNo, title: contract.propertyTitle })}
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
  const { t } = useTranslation()
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

  // 更严格的验证：合同必须完成签署才能确认收款
  const hasSignedContract = !!tenantSignedContract || !!contractByProperty

  // 显示用的合同信息
  const displayContract = tenantSignedContract || contractByProperty

  const handleClick = () => {
    if (contractCompleted) {
      // 合同已完成，直接确认收款
      setShowContractPrompt(false)
      setOpen(true)
    } else if (hasSignedContract) {
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
      <Button type="primary" onClick={handleClick}>{t('pages.confirmPayment')}</Button>
      <Modal
        title={showContractPrompt ? t('pages.pleaseSignFirst') : t('pages.confirmPayment')}
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          showContractPrompt ? (
            <Space>
              <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
              {displayContract ? (
                <Button type="primary" onClick={handleSignContract}>
                  {t('pages.signNow')}
                </Button>
              ) : (
                <Button type="primary" disabled>
                  {t('pages.noContractToSign')}
                </Button>
              )}
            </Space>
          ) : (
            <Space>
              <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
              <Button type="primary" onClick={handleConfirm} loading={loading}>
                {t('pages.confirmPayment')}
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
                  {t('pages.tenantSignedWaitingLandlord')}
                </div>
                <div style={{ color: '#666', marginBottom: 24 }}>
                  {t('pages.pleaseSignFirst')}
                </div>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, textAlign: 'left' }}>
                  <div><strong>{t('pages.contractNo')}：</strong>{displayContract.contractNo}</div>
                  <div><strong>{t('pages.propertyTitle')}：</strong>{displayContract.propertyTitle}</div>
                  <div><strong>{t('pages.monthlyRentLabel')}：</strong>¥ {displayContract.monthlyRent?.toLocaleString()}/{t('common.yuanPerMonth').split(' ')[0]}</div>
                </div>
              </>
            ) : (
              // 没有合同
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#faad14' }}>
                  {t('pages.noContractYet')}
                </div>
                <div style={{ color: '#666', marginBottom: 24 }}>
                  {t('pages.pleaseCreateContractFirst')}
                </div>
                <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: 16, textAlign: 'left' }}>
                  <div style={{ color: '#d46b08', fontWeight: 500, marginBottom: 8 }}>
                    {t('pages.noContractAvailable')}
                  </div>
                  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
                    {t('pages.tenantNoContract')}<br/>
                    <strong>{t('pages.goToListingPage')}</strong>，{t('pages.afterSignConfirmPayment')}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', marginBottom: 8 }}>{t('pages.orderInfo')}</div>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                <div>{t('pages.orderNo')}：{order.orderNo}</div>
                <div>{t('pages.payerName')}：{order.payerRealName || order.payerUsername}</div>
                <div>{t('pages.amount')}：¥ {order.amount?.toLocaleString()}</div>
                <div>{t('pages.type')}：{order.paymentType === 'DEPOSIT' ? t('pages.deposit') : t('pages.monthlyRent')}</div>
              </div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: 8 }}>{t('pages.note')}（{t('pages.optionalNote')}）</div>
              <Input.TextArea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('pages.enterNotePlaceholder')}
              />
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
