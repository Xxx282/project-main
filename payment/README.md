# Payment Monitor Module

这个模块用于监控支付宝商家版的交易记录。

## 功能

- 自动打开支付宝交易页面 (https://b.alipay.com/page/mbillexprod/trade/order/sold)
- 支持手动扫码登录
- 定时刷新页面检测新交易
- 支持回调函数处理新交易

## 安装依赖

```bash
cd payment
pip install -r requirements.txt
```

注意：你需要安装 Chrome 浏览器。

## 使用方法

### 方式1：命令行运行

```bash
python payment/run.py
```

### 方式2：在代码中使用

```python
from payment.monitor import AlipayMonitor

# 创建监控器
monitor = AlipayMonitor(refresh_interval=30)

# 打开页面（会自动启动 Chrome）
monitor.open_page()

# 等待手动登录
monitor.wait_for_login()

# 获取交易列表
transactions = monitor.get_transactions()
for t in transactions:
    print(t)

# 开始自动监控
def on_new_transactions(transactions):
    print(f"新交易: {transactions}")

monitor.start_monitoring(callback=on_new_transactions)

# ... 做其他事情 ...

# 停止监控
monitor.stop_monitoring()
monitor.close()
```

## 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| headless | 无头模式运行 | False |
| refresh_interval | 刷新间隔(秒) | 30 |

## 注意事项

1. **登录问题**：首次运行需要手动扫码登录支付宝
2. **保持登录**：如果长时间不操作，支付宝可能会自动登出
3. **反爬风险**：频繁刷新可能被检测，建议间隔设置长一些

## 配合项目使用

可以在后端添加一个 API 来调用这个模块：

```python
# 后端调用示例
from payment.monitor import AlipayMonitor

@app.get("/api/payment/check")
def check_payment():
    monitor = AlipayMonitor()
    monitor.open_page()
    # 等待登录...
    transactions = monitor.get_transactions()
    return {"transactions": transactions}
```
