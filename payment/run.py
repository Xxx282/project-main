"""
Quick launcher for Alipay payment monitor

Usage:
    python payment/run.py
    python payment/run.py --headless
    python payment/run.py --interval 60
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from payment.monitor import AlipayMonitor


def main():
    parser = argparse.ArgumentParser(description="Alipay Transaction Monitor")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode (not recommended)")
    parser.add_argument("--interval", type=int, default=30, help="Refresh interval in seconds")
    args = parser.parse_args()
    
    print("=" * 60)
    print("  Alipay Transaction Monitor")
    print("=" * 60)
    print(f"  Refresh interval: {args.interval}s")
    print()
    
    monitor = AlipayMonitor(headless=args.headless, refresh_interval=args.interval)
    
    try:
        # Open the page
        if not monitor.open_page():
            print("Failed to open Alipay page")
            return
        
        # Wait for manual login
        print("\n  Please log in manually in the browser...")
        print("  (扫码登录成功后程序会自动继续)")
        print()
        
        if not monitor.wait_for_login(timeout=600):
            input("  Press Enter after login is complete...")
        
        print("\n" + "=" * 60)
        print("  Transaction Monitoring Started")
        print("  Press Ctrl+C to stop")
        print("=" * 60 + "\n")
        
        # Get initial transactions
        print("Initial transactions:")
        transactions = monitor.get_transactions()
        
        if not transactions:
            print("  No transactions found")
        
        print("\nWaiting for new transactions...")
        
        # Start monitoring
        import time
        while True:
            time.sleep(args.interval)
            transactions = monitor.get_transactions()
            
    except KeyboardInterrupt:
        print("\n\nStopping monitor...")
    finally:
        monitor.stop_monitoring()
        monitor.close()
        print("Done")


if __name__ == "__main__":
    main()
