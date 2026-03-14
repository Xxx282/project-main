import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message, Spin, Card, Descriptions, Button, Space, Divider } from 'antd'
import { getContractById, signContractAsLandlord, type RentalContract } from '../../contract/api/contractApi'
import { useTranslation } from 'react-i18next'

const C = {
  bg: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',
  border: '#e8e8e8',
  accent: '#1890ff',
  text: '#333333',
  muted: '#999999',
  success: '#52c41a',
  warn: '#faad14',
  signBg: '#fcfcff',
}

// 颜色主题
const COLORS = {
  bg: '#0d0f1a',
  surface: '#141720',
  card: '#1a1e2e',
  border: '#252a3d',
  accent: '#5b8af0',
  accentGlow: 'rgba(91,138,240,0.15)',
  text: '#dde1f0',
  muted: '#7a7f9a',
  success: '#34d399',
  warn: '#fbbf24',
  signBg: '#fcfcff',
}

export function LandlordContractSignPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contractId = Number(searchParams.get('contractId'))
  const fromPayment = searchParams.get('fromPayment') === 'true'
  const queryClient = useQueryClient()

  const [signed, setSigned] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // 获取合同详情
  const contractQ = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => getContractById(contractId),
    enabled: Boolean(contractId),
  })

  const contract = contractQ.data

  // 签署合同 mutation
  const signMutation = useMutation({
    mutationFn: ({ signature }: { signature: string }) =>
      signContractAsLandlord({ contractId, signature }),
    onSuccess: () => {
      setSigned(true)
      message.success(t('pages.signSuccess'))
      queryClient.invalidateQueries({ queryKey: ['landlord', 'contracts'] })
    },
    onError: (e: any) => message.error(e?.response?.data?.message || t('pages.signFailed')),
  })

  // Canvas 初始化
  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = COLORS.signBg
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.strokeStyle = '#1a1a3e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [contractId])

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
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = COLORS.signBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  const handleSign = () => {
    if (!hasStroke) { message.warning(t('pages.pleaseSignFirst')); return }
    const sig = canvasRef.current!.toDataURL('image/png')
    signMutation.mutate({ signature: sig })
  }

  const handleBack = () => {
    if (fromPayment) {
      navigate('/landlord/orders')
    } else {
      navigate(-1)
    }
  }

  // Loading
  if (contractQ.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: COLORS.bg }}>
        <Spin size="large" />
      </div>
    )
  }

  // 签署成功
  if (signed) {
    return (
      <div style={{
        minHeight: '100vh',
        background: COLORS.bg,
        color: COLORS.text,
        padding: '40px 16px 80px',
        fontFamily: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        `}</style>

        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(52,211,153,0.08)',
            border: `1px solid ${COLORS.success}`,
            borderRadius: 16,
            padding: '48px 32px',
            animation: 'fadeIn .45s ease both',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.success, marginBottom: 12 }}>
              合同签署成功
            </div>
            <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 32 }}>
              您的电子签名已记录，合同已生效
            </div>
            <Space size={16}>
              <Button size="large" onClick={handleBack}>
                返回订单页面
              </Button>
            </Space>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
      padding: '40px 16px 80px',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        .sign-btn:hover { background: #3a6fe0 !important; transform: translateY(-1px); }
        .clear-btn:hover { border-color: ${COLORS.warn} !important; color: ${COLORS.warn} !important; }
      `}</style>

      {/* 顶部（含语言切换） */}
      <div style={{ maxWidth: 820, margin: '0 auto 32px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <Button
            size="small"
            onClick={() => {
              const next = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN'
              i18n.changeLanguage(next)
              localStorage.setItem('language', next)
            }}
          >{i18n.language === 'zh-CN' ? 'EN' : '中文'}</Button>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}`,
          borderRadius: 20, padding: '4px 18px', fontSize: 12,
          letterSpacing: 3, color: COLORS.accent, marginBottom: 16,
        }}>⚖ {t('pages.electronicContractBadge')}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: 3, color: '#fff' }}>
          {t('pages.landlordSignsContractTitle')}
        </h1>
        <div style={{ color: COLORS.muted, fontSize: 13 }}>{t('pages.landlordSignPrompt')} · {new Date().toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US')}</div>
      </div>

      {/* 合同卡片 */}
      <div style={{
        maxWidth: 820, margin: '0 auto',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        animation: 'fadeIn .45s ease both',
      }}>
        {/* 顶部色带 */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #5b8af0, #9b6dff, #5b8af0)' }} />

        <div style={{ padding: '32px 36px' }}>
          {/* 合同信息 */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: COLORS.accent,
              letterSpacing: 1, borderLeft: `3px solid ${COLORS.accent}`,
              paddingLeft: 10, marginBottom: 16,
            }}>{t('pages.contractInfo')}</div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 20 }}>
              <Descriptions column={2} size="small" colon>
                <Descriptions.Item label={t('pages.contractNo')}>{contract?.contractNo}</Descriptions.Item>
                <Descriptions.Item label={t('pages.property')}>{contract?.propertyTitle}</Descriptions.Item>
                <Descriptions.Item label={t('pages.tenant')}>{contract?.tenantRealName || contract?.tenantUsername}</Descriptions.Item>
                <Descriptions.Item label={t('pages.monthlyRentLabel')}>¥ {contract?.monthlyRent?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label={t('pages.deposit')}>¥ {contract?.deposit?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label={t('pages.leaseTerm')}>
                  {contract?.leaseStart} {t('pages.to')} {contract?.leaseEnd}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>

          <Divider style={{ borderColor: COLORS.border, margin: '24px 0' }} />

          {/* 签署区 */}
          <div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: COLORS.accent,
              letterSpacing: 1, borderLeft: `3px solid ${COLORS.accent}`,
              paddingLeft: 10, marginBottom: 20,
            }}>{t('pages.landlordSignature')}</div>

            <div style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: '24px',
            }}>
              <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 14 }}>
                请在下方白色区域内手写签名（鼠标拖拽或触屏书写）
              </div>

              {/* 画布 */}
              <div style={{
                borderRadius: 8,
                overflow: 'hidden',
                border: `2px dashed ${hasStroke ? COLORS.accent : COLORS.border}`,
                display: 'inline-block',
                width: '100%',
                transition: 'border-color .3s',
              }}>
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={160}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                  style={{ display: 'block', width: '100%', touchAction: 'none', cursor: 'crosshair', background: COLORS.signBg }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
                <Button onClick={clearCanvas} className="clear-btn">
                  {t('pages.clearResign')}
                </Button>

                <Space>
                  <Button onClick={handleBack}>
                    {t('pages.back')}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSign}
                    loading={signMutation.isPending}
                    disabled={!hasStroke}
                    className="sign-btn"
                  >
                    {signMutation.isPending ? t('pages.processing') : t('pages.confirmSignBtn')}
                  </Button>
                </Space>
              </div>

              <div style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'rgba(251,191,36,0.08)',
                border: `1px solid rgba(251,191,36,0.3)`,
                borderRadius: 8,
                fontSize: 12,
                color: COLORS.warn,
                lineHeight: 1.8,
              }}>
                {t('pages.signStatement')}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
