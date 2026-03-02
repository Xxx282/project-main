import { useEffect, useState } from 'react'
import { Button, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getCityStatistics, type CityStats } from '../../tenant/api/tenantApi'
import { useAuthModal } from '../../auth/context/AuthModalContext'

const { Title, Text } = Typography

// 词云颜色配置 - 白色系带透明度
const cloudColors = [
  'rgba(255, 255, 255, 0.9)',
  'rgba(255, 255, 255, 0.8)',
  'rgba(255, 255, 255, 0.7)',
  'rgba(240, 248, 255, 0.85)',
  'rgba(245, 255, 250, 0.8)',
  'rgba(255, 250, 240, 0.75)',
  'rgba(255, 245, 238, 0.8)',
  'rgba(240, 255, 240, 0.75)',
  'rgba(230, 240, 255, 0.8)',
  'rgba(255, 240, 245, 0.7)',
]

// 获取随机颜色
const getRandomColor = () => {
  return cloudColors[Math.floor(Math.random() * cloudColors.length)]
}

// 扩展城市列表：如果数据不够，重复填充以达到目标数量
const expandCityList = (cityStats: CityStats, minCount: number = 30): CityStats => {
  if (cityStats.length === 0) return []
  const result: CityStats = []
  let index = 0
  while (result.length < minCount) {
    result.push(cityStats[index % cityStats.length])
    index++
  }
  return result
}

// 判断是否应该竖排（随机约30%概率）
const shouldBeVertical = () => Math.random() < 0.3

// 生成随机位置（围绕中心分布）
interface WordPosition {
  x: number  // 距离中心的水平偏移 (-1 到 1)
  y: number  // 距离中心的垂直偏移 (-1 到 1)
  rotation: number  // 旋转角度
}

const generateRandomPosition = (index: number, total: number): WordPosition => {
  // 使用环形分布，确保词语围绕中心均匀分布
  const angle = (index / total) * Math.PI * 2 + Math.random() * 0.5
  const radius = 0.2 + Math.random() * 0.6  // 距离中心 20%-80% 的范围

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    rotation: -30 + Math.random() * 60,  // -30 到 30 度之间
  }
}

export function HomePage() {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const [scrollY, setScrollY] = useState(0)
  const [cityStats, setCityStats] = useState<CityStats>([])
  const [expandedCityStats, setExpandedCityStats] = useState<CityStats>([])
  const [verticalFlags, setVerticalFlags] = useState<boolean[]>([])
  const [wordPositions, setWordPositions] = useState<WordPosition[]>([])
  const [visibleTags, setVisibleTags] = useState(0) // 可见的标签数量

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 获取城市统计数据
  useEffect(() => {
    getCityStatistics()
      .then((data) => {
        setCityStats(data)
        // 扩展城市列表并生成竖排标记
        const expanded = expandCityList(data, 30)
        setExpandedCityStats(expanded)
        setVerticalFlags(expanded.map(() => shouldBeVertical()))
        // 生成每个词的位置
        setWordPositions(expanded.map((_, i) => generateRandomPosition(i, expanded.length)))
      })
      .catch(console.error)
  }, [])

  // 词云图动画：在标题遮罩层动画完成后（约scrollY=300）开始逐个显示
  // 词云图只在 scrollY 在 300-1500px 范围内显示
  const cloudInRange = scrollY >= 300 && scrollY <= 900

  useEffect(() => {
    if (cloudInRange && visibleTags < expandedCityStats.length) {
      const delay = 400 // 每个词之间的延迟（毫秒），加快显示速度
      const timer = setTimeout(() => {
        setVisibleTags(prev => Math.min(prev + 1, expandedCityStats.length))
      }, delay)
      return () => clearTimeout(timer)
    }
    // 当滚出范围时，重置可见标签
    if (!cloudInRange && visibleTags > 0) {
      setVisibleTags(0)
    }
  }, [scrollY, visibleTags, expandedCityStats.length, cloudInRange])

  // 窗户层：初始最大，滚动时缩小并淡出
  const windowOpacity = Math.max(0, 1 - scrollY / 300)
  const windowScale = 1 + scrollY * 0.002

  // 天空层：初始放大，滚动时缩小
  const skyScale = Math.max(1, 1.3 - scrollY * 0.001)
  const skyOpacity = scrollY < 400 ? 1 : Math.max(0.5, 1 - (scrollY - 400) / 200)

  // 标题遮罩层：滚动到一定位置后出现（延迟到500px后）
  const titleOpacity = Math.min(1, Math.max(0, (scrollY - 800) / 200))
  const titleTranslateY = (1 - titleOpacity) * 100

  // 城市层：滚动到最后才显示
  const cityOpacity = Math.min(1, Math.max(0, (scrollY - 1000) / 300))

  // 两侧文字块：滚动时向下移动并淡出
  const sideTextOpacity = Math.max(0, 1 - scrollY / 200)
  const sideTextTranslateY = scrollY * 0.5

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

      {/* 词云图层 - 显示在天空上面 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          opacity: cloudInRange ? skyOpacity : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        {/* 词云图标题 */}
        <div style={styles.cloudTitle}>
          探索 · 发现 · 咨询
        </div>
        {/* 词云词语文本容器 - 词语围绕中心随机分布 */}
        <div style={styles.wordCloudWrapper}>
          {expandedCityStats.slice(0, visibleTags).map(([city, count], index) => {
            // 根据原始房源数量计算字体大小
            const originalCounts = cityStats.map(([, c]) => c)
            const maxCount = Math.max(...originalCounts)
            const minCount = Math.min(...originalCounts)
            const fontSize = count === maxCount
              ? 42
              : count === minCount
                ? 18
                : 18 + (count - minCount) / (maxCount - minCount) * 24

            // 获取该位置的竖排标记和位置
            const isVertical = verticalFlags[index] || false
            const pos = wordPositions[index] || { x: 0, y: 0, rotation: 0 }

            return (
              <span
                key={`${city}-${index}`}
                style={{
                  ...styles.cloudWord,
                  fontSize: `${fontSize}px`,
                  color: getRandomColor(),
                  animationDelay: `${index * 0.05}s`,
                  writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                  textOrientation: isVertical ? 'upright' : 'mixed',
                  // 使用绝对定位围绕中心分布
                  position: 'absolute',
                  left: `calc(50% + ${pos.x * 35}vw)`,
                  top: `calc(50% + ${pos.y * 15}vh)`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
                  whiteSpace: 'nowrap',
                }}
              >
                {city}
              </span>
            )
          })}
        </div>
      </div>

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

      {/* 窗户装饰文字 - 放在窗户上面 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '5vw',
          paddingRight: '5vw',
          paddingBottom: '12vh',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      >
        {/* 左侧窗户文字 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '1.5vh',
            marginTop: '40vh', // 调整上下位置
            marginLeft: '-2vw', // 调整左右位置
            marginRight: '0vw', // 调整左右位置
            opacity: sideTextOpacity,
            transform: `translateY(${sideTextTranslateY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.15em',
              textAlign: 'left',
              textShadow: '0 2px 12px rgba(0,0,0,0.9)',
            }}
          >
            租房？
          </span>
          <span
            style={{
              fontFamily: '"Noto Sans SC", sans-serif',
              fontSize: 'clamp(0.7rem, 1.1vw, 0.9rem)',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: '0.1em',
              textShadow: '0 1px 10px rgba(0,0,0,0.8)',
              whiteSpace: 'pre-line',
              textAlign: 'left',
              lineHeight: 1.6,
            }}
          >
            {'个性化推荐\n找房不再是烦恼'}
          </span>
        </div>
        {/* 中间大窗标题 */}
        <span
          style={{
            fontFamily: '"Noto Serif SC", serif',
            fontSize: 'clamp(4rem, 7vw, 6rem)',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.25em',
            textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 60px rgba(255,255,255,0.2)',
            marginTop: '-10vh', // 调整上下位置
            marginLeft: '9vw', // 调整左右位置
            marginRight: '10vw', // 调整左右位置
            opacity: sideTextOpacity,
            transform: `translateY(${sideTextTranslateY}px)`,
          }}
        >
          智能租房
        </span>
        {/* 右侧窗户文字 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.5vh',
            marginTop: '-50vh', // 调整上下位置
            marginLeft: '0vw', // 调整左右位置
            marginRight: '16vw', // 调整左右位置
            opacity: sideTextOpacity,
            transform: `translateY(${sideTextTranslateY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.15em',
              textAlign: 'right',
              textShadow: '0 2px 12px rgba(0,0,0,0.9)',
            }}
          >
            发布？
          </span>
          <span
            style={{
              fontFamily: '"Noto Sans SC", sans-serif',
              fontSize: 'clamp(0.7rem, 1.1vw, 0.9rem)',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: '0.1em',
              textShadow: '0 1px 10px rgba(0,0,0,0.8)',
              whiteSpace: 'pre-line',
              textAlign: 'right',
              lineHeight: 1.6,
            }}
          >
            {'实时咨询对比\n快人一步'}
          </span>
        </div>
      </div>

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
            onClick={() => openAuthModal('register')}
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
    height: '350vh',
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
  // 词云图容器样式
  wordCloudContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5vw',
    maxWidth: '85vw',
    minHeight: '40vh',
    padding: '1.5rem',
  },
  // 词云词语容器 - 使用绝对定位
  wordCloudWrapper: {
    position: 'relative',
    width: '100%',
    height: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 词云图标题样式
  cloudTitle: {
    fontFamily: '"Noto Serif SC", serif',
    fontSize: 'clamp(1.8rem, 4vw, 3rem)',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: '0.3em',
    textShadow: '0 2px 20px rgba(0,0,0,0.7), 0 0 40px rgba(255,255,255,0.3)',
    marginBottom: '1vh',
    animation: 'fadeInWord 0.8s ease-out forwards',
    position: 'absolute',
    top: '18%',
    zIndex: 10,
  },
  // 词云文字样式
  cloudWord: {
    fontFamily: '"Noto Sans SC", sans-serif',
    fontWeight: 600,
    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
    animation: 'fadeInWord 0.5s ease-out forwards',
    opacity: 0,
    lineHeight: 1.4,
  },
}
