import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { message, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import { getListing, getLandlordInfo } from '../../tenant/api/tenantApi'
import { createContract, signContract } from '../../contract/api/contractApi'

const C = {
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

const today = new Date()
const todayStr = today.toISOString().split('T')[0]
const yearLater = new Date(today)
yearLater.setFullYear(yearLater.getFullYear() + 1)
const yearLaterStr = yearLater.toISOString().split('T')[0]

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        color: C.accent,
        letterSpacing: 1,
        borderLeft: `3px solid ${C.accent}`,
        paddingLeft: 10,
        marginBottom: 14,
      }}>{title}</div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: `1px solid ${C.border}`,
      padding: '10px 0',
      gap: 16,
    }}>
      <span style={{ color: C.muted, fontSize: 13, minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function HR() {
  return <div style={{ height: 1, background: C.border, margin: '28px 0' }} />
}

const dateInputStyle: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.text,
  padding: '6px 12px',
  fontSize: 14,
  outline: 'none',
  cursor: 'pointer',
}

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────
export function TenantContractPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const propertyId = Number(searchParams.get('propertyId'))
  const payeeId = Number(searchParams.get('payeeId'))

  const [leaseStart, setLeaseStart] = useState(todayStr)
  const [leaseEnd, setLeaseEnd] = useState(yearLaterStr)
  const [agreed, setAgreed] = useState(false)
  const [signed, setSigned] = useState(false)
  const [contractId, setContractId] = useState<number | null>(null)
  const [hasStroke, setHasStroke] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // ── Queries ──────────────────────────────────────────────
  const listingQ = useQuery({
    queryKey: ['tenant', 'listing', propertyId],
    queryFn: () => getListing(propertyId),
    enabled: Boolean(propertyId),
  })
  const landlordQ = useQuery({
    queryKey: ['tenant', 'landlord', propertyId],
    queryFn: () => getLandlordInfo(propertyId),
    enabled: Boolean(propertyId),
  })

  const listing = listingQ.data
  const landlord = landlordQ.data
  const price = listing?.price ?? 0
  const deposit = price * 2
  const landlordName = landlord?.realName || landlord?.username || '-'
  const landlordPhone = landlord?.phone || '-'

  // ── Mutations ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: (data) => setContractId(data.id),
    onError: (e: any) => message.error(e?.response?.data?.message || t('pages.contractCreateFailed')),
  })

  const signMutation = useMutation({
    mutationFn: signContract,
    onSuccess: () => {
      setSigned(true)
      message.success(t('pages.contractSignedSuccess'))
    },
    onError: (e: any) => message.error(e?.response?.data?.message || t('pages.signFailed')),
  })

  // ── Canvas init ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = C.signBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1a1a3e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [agreed])

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
    ctx.fillStyle = C.signBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  // ── Actions ──────────────────────────────────────────────
  const handleAgree = () => {
    if (!listing) return
    setAgreed(true)
    createMutation.mutate({
      landlordId: payeeId,
      propertyId,
      monthlyRent: price,
      deposit,
      leaseStart,
      leaseEnd,
    })
  }

  const handleSign = () => {
    if (!hasStroke) { message.warning(t('pages.pleaseSignFirst')); return }
    if (!contractId) { message.error(t('pages.contractCreating')); return }
    const sig = canvasRef.current!.toDataURL('image/png')
    signMutation.mutate({ contractId, signature: sig })
  }

  // ── Loading ──────────────────────────────────────────────
  if (listingQ.isLoading || landlordQ.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: C.bg }}>
        <Spin size="large" />
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
      padding: '40px 16px 80px',
    }}>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .contract-card { animation: fadeIn .45s ease both; }
        .sign-btn:hover { background: #3a6fe0 !important; transform: translateY(-1px); }
        .sign-btn:active { transform: translateY(0); }
        .clear-btn:hover { border-color: ${C.warn} !important; color: ${C.warn} !important; }
      `}</style>

      {/* ── 顶部 ── */}
      <div style={{ maxWidth: 820, margin: '0 auto 40px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: C.accentGlow, border: `1px solid ${C.accent}`,
          borderRadius: 20, padding: '4px 18px', fontSize: 12,
          letterSpacing: 3, color: C.accent, marginBottom: 16,
        }}>⚖ 电子合同</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: 3, color: '#fff' }}>
          房屋租赁合同
        </h1>
        <div style={{ color: C.muted, fontSize: 13 }}>RENTAL AGREEMENT · {new Date().toLocaleDateString('zh-CN')}</div>
      </div>

      {/* ── 合同卡片 ── */}
      <div className="contract-card" style={{
        maxWidth: 820, margin: '0 auto',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>

        {/* 顶部色带 */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #5b8af0, #9b6fd4, #5b8af0)' }} />

        <div style={{ padding: '40px 44px' }}>

          {/* ── 第一条 当事人 ── */}
          <Section title="第一条  当事人信息">
            <InfoRow label="甲方（出租方）" value={landlordName} />
            <InfoRow label="联系电话" value={landlordPhone} />
            <InfoRow label="乙方（承租方）" value="（签署人，详见平台账号）" />
          </Section>

          {/* ── 第二条 房屋 ── */}
          <Section title="第二条  租赁房屋">
            <InfoRow label="房源名称" value={listing?.title || '-'} />
            <InfoRow label="房屋面积" value={listing?.area ? `${listing.area} ㎡` : '-'} />
            <InfoRow label="房间格局" value={listing?.bedrooms ? `${listing.bedrooms} 室` : '-'} />
            <InfoRow label="装修情况" value={listing?.decoration || '-'} />
          </Section>

          {/* ── 第三条 租期 ── */}
          <Section title="第三条  租赁期限">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '10px 0' }}>
              <span style={{ color: C.muted, fontSize: 13 }}>租期开始</span>
              <input type="date" value={leaseStart} disabled={agreed}
                onChange={e => setLeaseStart(e.target.value)} style={dateInputStyle} />
              <span style={{ color: C.muted }}>—</span>
              <span style={{ color: C.muted, fontSize: 13 }}>租期结束</span>
              <input type="date" value={leaseEnd} disabled={agreed}
                onChange={e => setLeaseEnd(e.target.value)} style={dateInputStyle} />
            </div>
            <p style={{ color: C.muted, fontSize: 13, margin: '8px 0 0' }}>
              租赁期满如需续租，乙方须提前 30 日书面通知甲方。
            </p>
          </Section>

          {/* ── 第四条 租金 ── */}
          <Section title="第四条  租金与押金">
            <InfoRow label="月租金" value={`¥ ${price.toLocaleString()} 元 / 月`} />
            <InfoRow label="押金" value={`¥ ${deposit.toLocaleString()} 元（月租金 × 2）`} />
            <InfoRow label="付款方式" value="按月支付，每月 1 日前缴纳当月租金" />
            <InfoRow label="付款渠道" value="通过平台线上支付" />
          </Section>

          {/* ── 第五条 使用 ── */}
          <Section title="第五条  房屋使用规定">
            <ol style={{ paddingLeft: 20, color: C.muted, fontSize: 14, lineHeight: 2.2, margin: 0 }}>
              <li>乙方应按约定用途合理使用房屋，不得擅自改变房屋结构或用途。</li>
              <li>乙方须遵守所在楼宇及小区管理规定，不得扰民或从事违法活动。</li>
              <li>未经甲方书面同意，乙方不得将房屋转租或转借他人。</li>
              <li>乙方应爱护房内设施，人为损坏须照价赔偿。</li>
              <li>水、电、燃气、宽带等日常费用由乙方自行承担。</li>
            </ol>
          </Section>

          {/* ── 第六条 维修 ── */}
          <Section title="第六条  维修与保养">
            <ol style={{ paddingLeft: 20, color: C.muted, fontSize: 14, lineHeight: 2.2, margin: 0 }}>
              <li>房屋主体结构及固定附属设施的正常维修由甲方负责。</li>
              <li>因乙方使用不当造成的损坏，维修费用由乙方承担。</li>
              <li>乙方发现设施损坏，应及时通知甲方；紧急情况可先行处理并凭票据报销。</li>
            </ol>
          </Section>

          {/* ── 第七条 解除 ── */}
          <Section title="第七条  合同解除与违约">
            <ol style={{ paddingLeft: 20, color: C.muted, fontSize: 14, lineHeight: 2.2, margin: 0 }}>
              <li>甲乙双方协商一致可提前解除本合同。</li>
              <li>乙方提前解约须提前 30 日书面通知甲方，押金按实际情况处理。</li>
              <li>甲方提前收回房屋须提前 30 日通知乙方，并退还剩余租金及全额押金。</li>
              <li>任一方违约，违约方须向守约方支付一个月租金作为违约金。</li>
            </ol>
          </Section>

          {/* ── 第八条 争议 ── */}
          <Section title="第八条  争议解决">
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
              本合同发生争议，双方应先行友好协商；协商不成，可向房屋所在地人民法院提起诉讼，
              以中华人民共和国现行法律法规作为裁决依据。
            </p>
          </Section>

          {/* ── 第九条 其他 ── */}
          <Section title="第九条  其他约定">
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
              本合同经甲乙双方签署后正式生效，具有法律效力。合同通过平台电子方式存档，
              甲乙双方均可在平台查阅。未尽事宜双方可签订书面补充协议，补充协议与本合同具有同等效力。
            </p>
          </Section>

          <HR />

          {/* ── 签署区 ── */}
          {!agreed ? (
            /* 阅读确认区 */
            <div style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '28px 32px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, color: C.text, marginBottom: 8 }}
              >请仔细阅读上述合同条款</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
                确认后将进入电子签名环节，签署即表示您同意并受本合同约束
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.muted,
                    padding: '10px 28px',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >返回</button>
                <button
                  onClick={handleAgree}
                  disabled={createMutation.isPending}
                  style={{
                    background: C.accent,
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '10px 36px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: createMutation.isPending ? 0.6 : 1,
                    transition: 'all .2s',
                  }}
                >{createMutation.isPending ? '处理中…' : '✓ 我已阅读，同意签署'}</button>
              </div>
            </div>
          ) : signed ? (
            /* 签署成功 */
            <div style={{
              background: 'rgba(52,211,153,0.08)',
              border: `1px solid ${C.success}`,
              borderRadius: 12,
              padding: '36px 32px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.success, marginBottom: 8 }}>
                合同签署成功
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
                您的电子签名已记录，合同副本已发送至管理员和房东邮箱
              </div>
              <button
                onClick={() => navigate(`/tenant/payments/create?propertyId=${propertyId}&payeeId=${payeeId}`)}
                style={{
                  background: C.accent,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  padding: '12px 40px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >前往支付页面 →</button>
            </div>
          ) : (
            /* 电子签名区 */
            <div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.accent,
                letterSpacing: 1,
                borderLeft: `3px solid ${C.accent}`,
                paddingLeft: 10,
                marginBottom: 20,
              }}>电子签名</div>

              <div style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '24px',
              }}>
                <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
                  请在下方白色区域内手写签名（鼠标拖拽或触屏书写）
                </div>

                {/* 画布 */}
                <div style={{
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: `2px dashed ${hasStroke ? C.accent : C.border}`,
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
                    style={{ display: 'block', width: '100%', touchAction: 'none', cursor: 'crosshair', background: C.signBg }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
                  <button
                    onClick={clearCanvas}
                    className="clear-btn"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      color: C.muted,
                      padding: '8px 20px',
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all .2s',
                    }}
                  >清除重签</button>

                  <button
                    onClick={handleSign}
                    className="sign-btn"
                    disabled={signMutation.isPending || !hasStroke}
                    style={{
                      background: hasStroke ? C.accent : C.border,
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '8px 28px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: hasStroke ? 'pointer' : 'not-allowed',
                      transition: 'all .2s',
                      opacity: signMutation.isPending ? 0.6 : 1,
                    }}
                  >{signMutation.isPending ? '提交中…' : '✍ 确认签署'}</button>
                </div>

                <div style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  background: 'rgba(251,191,36,0.08)',
                  border: `1px solid rgba(251,191,36,0.3)`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: C.warn,
                  lineHeight: 1.8,
                }}>
                  ⚠ 签署声明：本人已仔细阅读以上全部条款，确认内容真实无误，自愿签署本租房合同，
                  本次电子签名具有与手写签名同等的法律效力，签署时间及IP地址将被记录存档。
                </div>
              </div>
            </div>
          )}

        </div>{/* padding div */}
      </div>{/* contract card */}
    </div>
  )
}
