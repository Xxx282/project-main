"""
Payment Monitor FastAPI Service

启动服务:
    cd payment/app
    python main.py

或使用 uvicorn:
    uvicorn main:app --host 0.0.0.0 --port 5001
"""

import asyncio
import os
import sys
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Alipay transaction page URL
ALIPAY_TRANSACTION_URL = "https://b.alipay.com/page/mbillexprod/trade/order/sold"

# 默认超时时间 30 秒
DEFAULT_TIMEOUT = 60


# ==================== 全局浏览器管理 ====================

class BrowserManager:
    """全局浏览器管理器 - 单例模式"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.driver: Optional[webdriver.Chrome] = None
        self.last_refresh_time: float = 0
        self.is_logged_in: bool = False
        self.refresh_interval: int = 10  # 页面刷新间隔（秒）
    
    def find_chrome(self) -> Optional[str]:
        """查找 Chrome 安装路径"""
        import subprocess
        
        possible_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        try:
            result = subprocess.run(["where", "chrome"], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip().split('\n')[0]
        except Exception:
            pass
        
        return None
    
    def get_driver(self) -> Optional[webdriver.Chrome]:
        """获取或创建浏览器实例"""
        if self.driver is None:
            chrome_path = self.find_chrome()
            
            chrome_options = Options()
            # 注意：无头模式无法看到支付宝登录页面扫码
            # 如需后台运行请使用: chrome_options.add_argument("--headless=new")
            # chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option("useAutomationExtension", False)
            
            if chrome_path:
                chrome_options.binary_location = chrome_path
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # 隐藏 webdriver
            self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": "Object.defineProperty(navigator, 'webdriver', { get: () => undefined })"
            })
            
            # 打开支付宝页面
            self.driver.get(ALIPAY_TRANSACTION_URL)
            self.last_refresh_time = time.time()
            
            print("[BrowserManager] 浏览器已启动，请扫码登录支付宝")
        
        return self.driver
    
    def refresh_if_needed(self) -> bool:
        """如果需要则刷新页面"""
        current_time = time.time()

        # 距离上次刷新超过间隔时间，则刷新
        if current_time - self.last_refresh_time >= self.refresh_interval:
            try:
                self.driver.refresh()
                self.last_refresh_time = time.time()
                print(f"[BrowserManager] 页面已刷新，等待5秒让元素加载...")
                time.sleep(5)  # 刷新后等待5秒，让页面元素加载完成
                return True
            except Exception as e:
                print(f"[BrowserManager] 刷新页面失败: {e}")
                # 如果刷新失败，可能是浏览器挂了，重建
                self.close()
                self.get_driver()
                return False

        return False
    
    def check_and_refresh(self):
        """
        主动刷新页面（查询时调用）
        按固定间隔刷新页面
        """
        self.refresh_if_needed()
    
    def close(self):
        """关闭浏览器"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None
        self.is_logged_in = False
        print("[BrowserManager] 浏览器已关闭")


# 全局浏览器管理器
browser_manager = BrowserManager()


# ==================== 监控状态存储 ====================

class MonitorManager:
    """监控管理器"""
    
    def __init__(self):
        self.monitors: Dict[str, 'MonitorContext'] = {}
    
    def create_monitor(self, order_no: str, amount: float, timeout: int = DEFAULT_TIMEOUT) -> str:
        """创建监控"""
        monitor_id = f"monitor_{order_no}_{int(time.time() * 1000)}"
        
        context = MonitorContext(
            monitor_id=monitor_id,
            order_no=order_no,
            amount=amount,
            timeout=timeout,
            status="PENDING"
        )
        
        self.monitors[monitor_id] = context
        return monitor_id
    
    def get_monitor(self, monitor_id: str) -> Optional['MonitorContext']:
        """获取监控状态"""
        return self.monitors.get(monitor_id)
    
    def update_status(self, monitor_id: str, status: str, **kwargs):
        """更新监控状态"""
        if monitor_id in self.monitors:
            ctx = self.monitors[monitor_id]
            ctx.status = status
            for key, value in kwargs.items():
                setattr(ctx, key, value)
    
    def remove_monitor(self, monitor_id: str):
        """移除监控"""
        if monitor_id in self.monitors:
            del self.monitors[monitor_id]


class MonitorContext:
    """监控上下文"""
    
    def __init__(self, monitor_id: str, order_no: str, amount: float, timeout: int, status: str):
        self.monitor_id = monitor_id
        self.order_no = order_no
        self.amount = amount
        self.timeout = timeout
        self.status = status
        self.start_time = int(time.time() * 1000)
        self.end_time: Optional[int] = None
        self.check_count = 0
        self.error_message: Optional[str] = None
        self.payment_data: Optional[dict] = None
    
    def to_dict(self) -> dict:
        return {
            "monitorId": self.monitor_id,
            "orderNo": self.order_no,
            "amount": self.amount,
            "status": self.status,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "checkCount": self.check_count,
            "errorMessage": self.error_message,
            "paymentData": self.payment_data
        }


# 全局管理器
monitor_manager = MonitorManager()


# ==================== 交易查询 ====================

def get_transactions(driver: webdriver.Chrome) -> list:
    """获取交易列表"""
    try:
        # 等待页面加载
        time.sleep(1)
        
        rows = driver.find_elements(By.CSS_SELECTOR, "tr.ant-table-row[data-row-key]")
        
        transactions = []
        for row in rows:
            try:
                cells = row.find_elements(By.CSS_SELECTOR, "td.ant-table-cell")
                
                if len(cells) >= 9:
                    transactions.append({
                        "create_time": cells[0].text.strip(),
                        "pay_time": cells[1].text.strip(),
                        "name": cells[2].text.strip(),
                        "merchant_order_no": cells[3].text.strip(),
                        "alipay_trade_no": cells[4].text.strip(),
                        "buyer_info": cells[5].text.strip(),
                        "amount": cells[6].text.strip(),
                        "refund_amount": cells[7].text.strip(),
                        "trade_status": cells[8].text.strip(),
                    })
            except Exception:
                continue
        
        return transactions
        
    except Exception as e:
        print(f"Error getting transactions: {e}")
        return []


def find_matching_transaction(transactions: list, order_no: str = None, current_time_fn=None) -> Optional[dict]:
    """
    查找匹配的交易
    判断条件：支付时间误差小于5分钟（忽略订单号匹配）
    """
    import time

    if current_time_fn is None:
        current_time_fn = time.time

    current_ts = current_time_fn()

    for t in transactions:
        pay_time_str = t.get("pay_time", "").strip()
        status = t.get("trade_status", "")

        # 解析支付时间（格式如：2026-03-15 14:30:25）
        payment_timestamp = None
        if pay_time_str:
            try:
                # 尝试解析 "YYYY-MM-DD HH:MM:SS" 格式
                from datetime import datetime
                pay_dt = datetime.strptime(pay_time_str, "%Y-%m-%d %H:%M:%S")
                payment_timestamp = pay_dt.timestamp()
            except Exception:
                try:
                    # 尝试解析其他常见格式
                    pay_dt = datetime.strptime(pay_time_str, "%Y/%m/%d %H:%M:%S")
                    payment_timestamp = pay_dt.timestamp()
                except Exception:
                    pass

        # 检查时间匹配（误差小于5分钟）
        if payment_timestamp is not None:
            time_diff = abs(current_ts - payment_timestamp)
            if time_diff < 300:
                # 判断成功：时间匹配 + 状态为成功
                if "成功" in status or "SUCCESS" in status.upper():
                    return t
    
    return None


# ==================== 同步查询函数 ====================

def sync_check_payment(monitor_id: str) -> bool:
    """
    同步检查支付状态（由异步任务调用）
    只检查最新的交易记录是否在时间范围内（5分钟）
    返回是否找到支付
    """
    ctx = monitor_manager.get_monitor(monitor_id)
    if not ctx:
        return False

    driver = browser_manager.get_driver()
    if not driver:
        monitor_manager.update_status(monitor_id, "ERROR", error_message="浏览器未启动")
        return False

    try:
        # 检查是否需要刷新页面
        browser_manager.check_and_refresh()

        # 获取交易列表
        transactions = get_transactions(driver)
        ctx.check_count += 1
        print(f"[{monitor_id}] 检查第 {ctx.check_count} 次, 找到 {len(transactions)} 条交易")

        # 查找最新匹配交易（只检查时间：支付时间误差小于5分钟）
        match = find_matching_transaction(transactions, ctx.order_no)

        if match:
            print(f"[{monitor_id}] 找到匹配支付!")
            ctx.status = "SUCCESS"
            ctx.payment_data = match
            ctx.end_time = int(time.time() * 1000)
            return True

        return False

    except Exception as e:
        print(f"[{monitor_id}] 查询出错: {e}")
        ctx.status = "ERROR"
        ctx.error_message = str(e)
        ctx.end_time = int(time.time() * 1000)
        return False


# ==================== 异步监控任务 ====================

async def run_monitor_task(monitor_id: str):
    """运行监控任务（5分钟超时）"""
    ctx = monitor_manager.get_monitor(monitor_id)
    if not ctx:
        return

    try:
        print(f"[{monitor_id}] 开始监控: orderNo={ctx.order_no}, amount={ctx.amount}, timeout={ctx.timeout}s")
        monitor_manager.update_status(monitor_id, "STARTING")

        # 确保浏览器已启动
        driver = browser_manager.get_driver()
        if not driver:
            monitor_manager.update_status(monitor_id, "ERROR", error_message="无法启动浏览器")
            return

        monitor_manager.update_status(monitor_id, "MONITORING")

        # 开始轮询
        start_ts = time.time()
        check_interval = 5  # 每5秒检查一次

        while time.time() - start_ts < ctx.timeout:
            # 检查是否已被其他任务处理
            ctx = monitor_manager.get_monitor(monitor_id)
            if not ctx or ctx.status in ["SUCCESS", "TIMEOUT", "ERROR", "STOPPED"]:
                break

            # 同步查询（在线程池中执行），传入 order_no 以实现"先查看页面元素再刷新"
            loop = asyncio.get_event_loop()
            found = await loop.run_in_executor(None, sync_check_payment, monitor_id)

            if found:
                break

            # 等待下次检查
            await asyncio.sleep(check_interval)
        
        else:
            # 超时
            ctx = monitor_manager.get_monitor(monitor_id)
            if ctx and ctx.status == "MONITORING":
                print(f"[{monitor_id}] 超时未找到支付")
                ctx.status = "TIMEOUT"
                ctx.end_time = int(time.time() * 1000)
                
    except Exception as e:
        print(f"[{monitor_id}] 监控出错: {e}")
        ctx = monitor_manager.get_monitor(monitor_id)
        if ctx:
            ctx.status = "ERROR"
            ctx.error_message = str(e)
            ctx.end_time = int(time.time() * 1000)


# ==================== FastAPI 应用 ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    print("Payment Monitor API 启动")
    print("提示：请确保已配置支付宝登录，或手动扫码登录")
    
    # 预热浏览器（在后台启动）
    try:
        browser_manager.get_driver()
    except Exception as e:
        print(f"警告：浏览器启动失败: {e}")
    
    yield
    
    # 关闭浏览器
    browser_manager.close()
    print("Payment Monitor API 关闭")


app = FastAPI(
    title="Payment Monitor API",
    description="支付宝支付监控服务",
    version="2.0.0",
    lifespan=lifespan
)

# 添加 CORS 中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== 请求模型 ====================

class StartMonitorRequest(BaseModel):
    """启动监控请求"""
    orderNo: str
    amount: float
    timeoutSeconds: int = DEFAULT_TIMEOUT


# ==================== API 端点 ====================

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    """健康检查"""
    browser_status = "ready" if browser_manager.driver is not None else "not_started"
    return {
        "status": "ok", 
        "service": "payment-monitor",
        "browser": browser_status
    }


@app.post("/api/v1/monitor/start")
async def start_monitor(request: StartMonitorRequest, background_tasks: BackgroundTasks):
    """启动支付监控"""
    # 限制超时时间最大 60 秒
    timeout = min(request.timeoutSeconds, 60)
    
    # 检查是否已有该订单号的活跃监控
    for mid, ctx in monitor_manager.monitors.items():
        if ctx.order_no == request.orderNo and ctx.status in ["PENDING", "STARTING", "MONITORING"]:
            print(f"订单 {request.orderNo} 已有活跃监控: {mid}")
            return {
                "monitorId": mid,
                "orderNo": request.orderNo,
                "amount": request.amount,
                "timeoutSeconds": timeout,
                "status": ctx.status,
                "message": f"该订单已有监控进行中"
            }
    
    # 创建监控
    monitor_id = monitor_manager.create_monitor(
        order_no=request.orderNo,
        amount=request.amount,
        timeout=timeout
    )
    
    # 后台运行监控任务
    background_tasks.add_task(run_monitor_task, monitor_id)
    
    ctx = monitor_manager.get_monitor(monitor_id)
    
    return {
        "monitorId": monitor_id,
        "orderNo": request.orderNo,
        "amount": request.amount,
        "timeoutSeconds": timeout,
        "status": "PENDING",
        "message": f"监控已启动，超时时间 {timeout} 秒，请轮询状态接口获取结果"
    }


@app.get("/api/v1/monitor/status/{monitor_id}")
async def get_monitor_status(monitor_id: str):
    """获取监控状态"""
    ctx = monitor_manager.get_monitor(monitor_id)
    
    if not ctx:
        raise HTTPException(status_code=404, detail="监控不存在")
    
    return ctx.to_dict()


@app.post("/api/v1/monitor/check/{monitor_id}")
async def check_monitor_status(monitor_id: str):
    """
    立即检查支付状态（主动查询，不依赖后台任务）
    """
    ctx = monitor_manager.get_monitor(monitor_id)
    
    if not ctx:
        raise HTTPException(status_code=404, detail="监控不存在")
    
    # 如果已经在监控中，同步查询一次
    if ctx.status == "MONITORING":
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, sync_check_payment, monitor_id)
    
    return ctx.to_dict()


@app.post("/api/v1/monitor/stop/{monitor_id}")
async def stop_monitor(monitor_id: str):
    """停止监控"""
    ctx = monitor_manager.get_monitor(monitor_id)
    
    if not ctx:
        raise HTTPException(status_code=404, detail="监控不存在")
    
    ctx.status = "STOPPED"
    ctx.end_time = int(time.time() * 1000)
    
    return {"message": "监控已停止", "status": ctx.status}


# ==================== 启动服务 ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
