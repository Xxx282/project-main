#!/usr/bin/env python
"""
Payment Monitor Script - 监控支付宝交易是否成功

Usage:
    python payment/monitor_payment.py --order-no ORDER_NO --amount 100.00 --timeout 300
"""

import sys
import time
import json
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from payment.monitor import AlipayMonitor


def find_matching_transaction(monitor, order_no, expected_amount):
    """查找匹配的支付交易"""
    try:
        transactions = monitor.get_transactions()
        
        for t in transactions:
            # 检查是否匹配订单号和金额
            merchant_order = t.get("merchant_order_no", "")
            alipay_order = t.get("alipay_trade_no", "")
            amount_str = t.get("amount", "0").replace(",", "").strip()
            status = t.get("trade_status", "")
            
            # 尝试解析金额
            try:
                amount = float(amount_str)
            except:
                amount = 0.0
            
            # 检查是否匹配
            # 订单号可能是完整号或部分号
            if order_no and (order_no in merchant_order or order_no in alipay_order):
                if abs(amount - expected_amount) < 0.01:  # 允许0.01误差
                    if "成功" in status or "SUCCESS" in status.upper():
                        return t
            
            # 也检查金额匹配的情况（用于没有订单号的情况）
            if abs(amount - expected_amount) < 0.01:
                if "成功" in status or "SUCCESS" in status.upper():
                    return t
        
        return None
        
    except Exception as e:
        print(f"Error finding transaction: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Monitor Alipay payment")
    parser.add_argument("--order-no", required=True, help="Order number to match")
    parser.add_argument("--amount", type=float, required=True, help="Expected payment amount")
    parser.add_argument("--timeout", type=int, default=300, help="Timeout in seconds")
    parser.add_argument("--interval", type=int, default=5, help="Check interval in seconds")
    args = parser.parse_args()
    
    print(f"PAYMENT_START|order_no={args.order_no}|amount={args.amount}")
    sys.stdout.flush()
    
    # Create monitor
    monitor = AlipayMonitor(refresh_interval=args.interval)
    
    try:
        # Open the page
        if not monitor.open_page():
            print("PAYMENT_ERROR|Failed to open Alipay page")
            sys.stdout.flush()
            return
        
        # Wait for login (with timeout)
        if not monitor.wait_for_login(timeout=min(60, args.timeout)):
            print("PAYMENT_TIMEOUT|Login timeout")
            sys.stdout.flush()
            return
        
        print("PAYMENT_LOGIN_OK")
        sys.stdout.flush()
        
        # Start monitoring
        start_time = time.time()
        check_count = 0
        
        while time.time() - start_time < args.timeout:
            check_count += 1
            print(f"PAYMENT_CHECK|check={check_count}|time={int(time.time() - start_time)}")
            sys.stdout.flush()
            
            # Find matching transaction
            transaction = find_matching_transaction(monitor, args.order_no, args.amount)
            
            if transaction:
                # Found payment!
                result = {
                    "status": "SUCCESS",
                    "order_no": args.order_no,
                    "amount": args.amount,
                    "transaction": transaction,
                    "check_count": check_count,
                    "time_elapsed": int(time.time() - start_time)
                }
                print(f"PAYMENT_SUCCESS|{json.dumps(result, ensure_ascii=False)}")
                sys.stdout.flush()
                break
            
            # Wait before next check
            time.sleep(args.interval)
        
        else:
            # Timeout
            print(f"PAYMENT_TIMEOUT|No matching payment found after {args.timeout}s")
            sys.stdout.flush()
            
    except KeyboardInterrupt:
        print("PAYMENT_STOPPED|User interrupted")
        sys.stdout.flush()
    except Exception as e:
        print(f"PAYMENT_ERROR|{str(e)}")
        sys.stdout.flush()
    finally:
        try:
            monitor.close()
        except:
            pass


if __name__ == "__main__":
    main()
