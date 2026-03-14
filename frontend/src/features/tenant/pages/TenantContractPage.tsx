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
// 装修枚举翻译
function getDecorationLabel(decoration: string | undefined, t: (k: string) => string): string {
  if (!decoration) return '-'
  const map: Record<string, string> = {
    rough: t('common.rough'),
    simple: t('common.simple'),
    fine: t('common.fine'),
    luxury: t('common.luxury'),
  }
  return map[decoration] ?? decoration
}

export function TenantContractPage() {
  const { t, i18n } = useTranslation()
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

      {/* ── 顶部（含语言切换）── */}
      <div style={{ maxWidth: 820, margin: '0 auto 40px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <button
            onClick={() => {
              const next = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN'
              i18n.changeLanguage(next)
              localStorage.setItem('language', next)
            }}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.muted,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >{i18n.language === 'zh-CN' ? 'EN' : '中文'}</button>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: C.accentGlow, border: `1px solid ${C.accent}`,
          borderRadius: 20, padding: '4px 18px', fontSize: 12,
          letterSpacing: 3, color: C.accent, marginBottom: 16,
        }}>⚖ {t('pages.electronicContractBadge')}</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: 3, color: '#fff' }}>
          {t('pages.contractTitle')}
        </h1>
        <div style={{ color: C.muted, fontSize: 13 }}>{t('pages.rentalAgreement')} · {new Date().toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US')}</div>
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
          <Section title={t('pages.section1Title')}>
            <InfoRow label={t('pages.partyALabel')} value={landlordName} />
            <InfoRow label={t('pages.contactPhone')} value={landlordPhone} />
            <InfoRow label={t('pages.partyBLabel')} value={t('pages.tenantSignerHint')} />
          </Section>

          {/* ── 第二条 房屋 ── */}
          <Section title={t('pages.section2Title')}>
            <InfoRow label={t('pages.propertyTitle')} value={listing?.title || '-'} />
            <InfoRow label={t('pages.areaLabel')} value={listing?.area ? `${listing.area} ㎡` : '-'} />
            <InfoRow label={t('pages.layout')} value={listing?.bedrooms ? `${listing.bedrooms} ${t('pages.bedrooms')}` : '-'} />
            <InfoRow label={t('pages.decorationLabel')} value={listing?.decoration || '-'} />
          </Section>

          {/* ── 第三条 租期 ── */}
          <Section title={t('pages.section3Title')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '10px 0' }}>
              <span style={{ color: C.muted, fontSize: 13 }}>{t('pages.leaseStartLabel')}</span>
              <input type="date" value={leaseStart} disabled={agreed}
                onChange={e => setLeaseStart(e.target.value)} style={dateInputStyle} />
              <span style={{ color: C.muted }}>—</span>
              <span style={{ color: C.muted, fontSize: 13 }}>{t('pages.leaseEndLabel')}</span>
              <input type="date" value={leaseEnd} disabled={agreed}
                onChange={e => setLeaseEnd(e.target.value)} style={dateInputStyle} />
            </div>
            <p style={{ color: C.muted, fontSize: 13, margin: '8px 0 0' }}>
              {t('pages.renewalNotice')}
            </p>
          </Section>

          {/* ── 第四条 租金 ── */}
          <Section title={t('pages.section4Title')}>
            <InfoRow label={t('pages.monthlyRentLabel')} value={`¥ ${price.toLocaleString()} ${t('pages.yuanPerMonth')}`} />
            <InfoRow label={t('pages.deposit')} value={`¥ ${deposit.toLocaleString()} ${t('pages.depositMonthlyRentHint')}`} />
            <InfoRow label={t('pages.paymentMethod')} value={t('pages.paymentMethodMonthly')} />
            <InfoRow label={t('pages.paymentChannel')} value={t('pages.paymentChannelOnline')} />
          </Section>

          {/* ── 第五条 使用 ── */}
          <Section title={t('pages.section5Title')}>
            <ol style={{ paddingLeft: 20, color: C.muted, fontSize: 14, lineHeight: 2.2, margin: 0 }}>
              <li>{t('pages.section5Item1')}</li>
              <li>{t('pages.section5Item2')}</li>
              <li>{t('pages.section5Item3')}</li>
              <li>{t('pages.section5Item4')}</li>
              <li>{t('pages.section5Item5')}</li>
            </ol>
          </Section>

          {/* ── 第六条 维修 ── */}
          <Section title={t('pages.section6Title')}>
            <ol style={{ paddingLeft: 20, color: C.muted, fontSize: 14, lineHeight: 2.2, margin: 0 }}>
              <li>{t('pages.section6Item1')}</li>
              <li>{t('pages.section6Item2')}</li>
              <li>{t('pages.section6Item3')}</li>
            </ol>
          </Section>

          {/* ── 第七条 解除 ── */}
          <Section title={t('pages.section7Title')}>
            <ol style={{ paddingLeft: 20, color: C.muted, fontSize: 14, lineHeight: 2.2, margin: 0 }}>
              <li>{t('pages.section7Item1')}</li>
              <li>{t('pages.section7Item2')}</li>
              <li>{t('pages.section7Item3')}</li>
              <li>{t('pages.section7Item4')}</li>
            </ol>
          </Section>

          {/* ── 第八条 争议 ── */}
          <Section title={t('pages.section8Title')}>
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
              {t('pages.section8Content')}
            </p>
          </Section>

          {/* ── 第九条 其他 ── */}
          <Section title={t('pages.section9Title')}>
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
              {t('pages.section9Content')}
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
              >{t('pages.readContractPrompt')}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
                {t('pages.readContractHint')}
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
                >{t('pages.back')}</button>
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
                >{createMutation.isPending ? t('pages.processing') : t('pages.agreeAndSign')}</button>
              </div>
            </div>
          ) : signed ? (
            /* 签署成功 - 全屏居中大字展示 */
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(13, 15, 26, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              animation: 'fadeIn 0.5s ease',
            }}>
              <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
              `}</style>
              <div style={{
                background: 'linear-gradient(135deg, #1a1e2e 0%, #141720 100%)',
                border: '2px solid #34d399',
                borderRadius: 24,
                padding: '60px 80px',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(52, 211, 153, 0.3), 0 0 80px rgba(52, 211, 153, 0.1)',
                animation: 'fadeIn 0.6s ease both',
              }}>
                <div style={{
                  fontSize: 80,
                  marginBottom: 24,
                  animation: 'bounce 1.5s ease infinite',
                }}>🎉</div>
                <div style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#34d399',
                  marginBottom: 16,
                  letterSpacing: 2,
                  textShadow: '0 0 20px rgba(52, 211, 153, 0.5)',
                }}>
                  {t('pages.contractSignedComplete')}
                </div>
                <div style={{
                  fontSize: 16,
                  color: '#7a7f9a',
                  marginBottom: 40,
                  maxWidth: 400,
                  lineHeight: 1.8,
                }}>
                  {t('pages.contractSignedDesc')}
                </div>
                <button
                  onClick={() => navigate(`/tenant/payments/create?propertyId=${propertyId}&payeeId=${payeeId}`)}
                  style={{
                    background: 'linear-gradient(135deg, #5b8af0 0%, #9b6fd4 100%)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    padding: '16px 48px',
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: 1,
                    boxShadow: '0 8px 24px rgba(91, 138, 240, 0.4)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(91, 138, 240, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(91, 138, 240, 0.4)'
                  }}
                >
                  {t('pages.goToPayment')}
                </button>
              </div>
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
              }}>{t('pages.electronicSignatureTitle')}</div>

              <div style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '24px',
              }}>
                <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
                  {t('pages.signAreaHint')}
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
                  >{t('pages.clearResign')}</button>

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
                  >{signMutation.isPending ? t('pages.processing') : t('pages.confirmSignBtn')}</button>
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
                  {t('pages.signDeclaration')}
                </div>
              </div>
            </div>
          )}

        </div>{/* padding div */}
      </div>{/* contract card */}
    </div>
  )
}
