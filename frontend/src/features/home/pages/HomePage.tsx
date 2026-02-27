import { useEffect, useState } from 'react'
import { Button, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export function HomePage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 窗户层：初始最大，滚动时缩小并淡出
  const windowOpacity = Math.max(0, 1 - scrollY / 300)
  const windowScale = 1 + scrollY * 0.002

  // 天空层：初始放大，滚动时缩小
  const skyScale = Math.max(1, 1.3 - scrollY * 0.001)
  const skyOpacity = scrollY < 400 ? 1 : Math.max(0.5, 1 - (scrollY - 400) / 200)

  // 标题遮罩层：滚动到一定位置后出现
  const titleOpacity = Math.min(1, Math.max(0, (scrollY - 300) / 200))
  const titleTranslateY = (1 - titleOpacity) * 100

  // 城市层：滚动到最后才显示
  const cityOpacity = Math.min(1, Math.max(0, (scrollY - 500) / 300))

  return (
    <div style={styles.container}>
      {/* 最底层：天空层 - 初始放大 */}
      <div
        style={{
          ...styles.layer,
          backgroundImage: 'url(/sky.png)',
          transform: `scale(${skyScale})`,
          opacity: skyOpacity,
          zIndex: 1,
        }}
      />

      {/* 中间层：窗户层 - 初始显示在天空前面 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/window.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `scale(${windowScale})`,
          opacity: windowOpacity,
          zIndex: 10,
        }}
      />

      {/* 城市层 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/city.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          opacity: cityOpacity,
          zIndex: 20,
        }}
      />

      {/* 标题遮罩层 - 自下而上移动 */}
      <div
        style={{
          ...styles.titleOverlay,
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
          zIndex: 30,
        }}
      >
        <Title
          level={1}
          style={styles.title}
        >
          寻找理想之家
        </Title>
        <Text style={styles.subtitle}>
          智能匹配 · 轻松租房 · 开启品质生活
        </Text>

        <div style={styles.buttons}>
          <Button
            type="primary"
            size="large"
            style={styles.primaryBtn}
            onClick={() => navigate('/tenant/listings')}
          >
            浏览房源
          </Button>
          <Button
            size="large"
            style={styles.secondaryBtn}
            onClick={() => navigate('/register')}
          >
            立即注册
          </Button>
        </div>
      </div>

      {/* 滚动提示 */}
      <div style={{
        ...styles.scrollHint,
        opacity: Math.max(0, 1 - scrollY / 200),
      }}>
        <div style={styles.scrollMouse}>
          <div style={styles.scrollWheel} />
        </div>
        <Text style={styles.scrollText}>
          向下滚动探索
        </Text>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '250vh',
    overflow: 'hidden',
    background: '#0a1628',
  },
  layer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'transform 0.1s ease-out',
  },
  titleOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.5) 100%)',
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
  },
  title: {
    color: '#fff',
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    fontWeight: 700,
    textShadow: '0 4px 30px rgba(0,0,0,0.5)',
    marginBottom: 16,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 'clamp(1rem, 2vw, 1.35rem)',
    textShadow: '0 2px 20px rgba(0,0,0,0.5)',
  },
  buttons: {
    marginTop: 40,
    display: 'flex',
    gap: 16,
  },
  primaryBtn: {
    height: 48,
    paddingInline: 36,
    fontSize: 16,
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    border: 'none',
    borderRadius: 24,
    boxShadow: '0 4px 20px rgba(24,144,255,0.4)',
  },
  secondaryBtn: {
    height: 48,
    paddingInline: 36,
    fontSize: 16,
    background: 'rgba(255,255,255,0.15)',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: 24,
    color: '#fff',
    backdropFilter: 'blur(10px)',
  },
  scrollHint: {
    position: 'fixed',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 40,
    transition: 'opacity 0.3s ease-out',
  },
  scrollMouse: {
    width: 24,
    height: 40,
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: 12,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 6,
  },
  scrollWheel: {
    width: 4,
    height: 8,
    background: 'rgba(255,255,255,0.7)',
    borderRadius: 2,
  },
  scrollText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 8,
  },
}
