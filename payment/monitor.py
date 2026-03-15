"""
Payment Monitor Module - Alipay Transaction Monitor

This module provides functionality to monitor Alipay transactions by:
1. Opening the Alipay merchant transaction page
2. Allowing manual login
3. Periodically refreshing to detect new transactions

Usage:
    python -m payment.monitor
    or
    from payment.monitor import AlipayMonitor
    
    monitor = AlipayMonitor()
    monitor.open_page()
    # Login manually, then:
    transactions = monitor.get_transactions()
"""

import time
import threading
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Alipay transaction page URL
ALIPAY_TRANSACTION_URL = "https://b.alipay.com/page/mbillexprod/trade/order/sold"


class AlipayMonitor:
    """Monitor Alipay transactions using browser automation"""
    
    def __init__(self, headless: bool = False, refresh_interval: int = 30):
        """
        Initialize the Alipay monitor
        
        Args:
            headless: Whether to run browser in headless mode (not recommended for login)
            refresh_interval: Interval in seconds between page refreshes
        """
        self.headless = headless
        self.refresh_interval = refresh_interval
        self.driver: Optional[webdriver.Chrome] = None
        self._stop_event = threading.Event()
        self._monitor_thread: Optional[threading.Thread] = None
        self.last_transactions: List[Dict] = []
        
    def _find_chrome(self) -> Optional[str]:
        """Try to find Chrome installation"""
        import subprocess
        
        # Common Chrome installation paths on Windows
        possible_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe",
        ]
        
        import os
        for path in possible_paths:
            expanded = os.path.expandvars(path)
            if os.path.exists(expanded):
                return expanded
        
        # Try to find via where command
        try:
            result = subprocess.run(["where", "chrome"], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip().split('\n')[0]
        except Exception:
            pass
        
        # Try to find via registry
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe")
            path = winreg.QueryValue(key, "")
            winreg.CloseKey(key)
            if os.path.exists(path):
                return path
        except Exception:
            pass
        
        return None
    
    def _create_driver(self) -> webdriver.Chrome:
        """Create and configure Chrome driver"""
        from selenium.webdriver.chrome.service import Service
        
        # Find Chrome
        chrome_path = self._find_chrome()
        if chrome_path:
            print(f"Found Chrome at: {chrome_path}")
        else:
            print("WARNING: Chrome not found in standard locations")
            print("Please make sure Chrome is installed")
        
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option("useAutomationExtension", False)
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-popup-blocking")
        
        # Set Chrome binary if found
        if chrome_path:
            chrome_options.binary_location = chrome_path
        
        try:
            # Try with webdriver-manager first
            print("Installing/using chromedriver...")
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as e:
            print(f"webdriver-manager failed: {e}")
            print("Trying direct chromedriver...")
            
            # Try to find chromedriver in PATH
            try:
                import shutil
                chromedriver = shutil.which("chromedriver")
                if chromedriver:
                    service = Service(executable_path=chromedriver)
                    driver = webdriver.Chrome(service=service, options=chrome_options)
                else:
                    raise Exception("chromedriver not found")
            except Exception as e2:
                print(f"Failed to create driver: {e2}")
                raise
        
        # Remove webdriver detection
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            """
        })
        
        return driver
    
    def open_page(self) -> bool:
        """
        Open the Alipay transaction page
        
        Returns:
            True if page opened successfully
        """
        print("[INFO] Starting Chrome browser...")
        try:
            self.driver = self._create_driver()
            print("[INFO] Chrome started, opening Alipay...")
            self.driver.get(ALIPAY_TRANSACTION_URL)
            print(f"[INFO] Opened: {ALIPAY_TRANSACTION_URL}")
            print("[INFO] Please log in manually in the browser...")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to open page: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def wait_for_login(self, timeout: int = 300) -> bool:
        """
        Wait for user to complete manual login
        
        Args:
            timeout: Maximum time to wait in seconds
            
        Returns:
            True if login detected, False if timeout
        """
        if not self.driver:
            print("Driver not initialized. Call open_page() first.")
            return False
        
        print(f"Waiting for login (timeout: {timeout}s)...")
        start_time = time.time()
        
        # Wait for the page to load and user to log in
        # The page will change after login - we look for transaction-related elements
        while time.time() - start_time < timeout:
            try:
                current_url = self.driver.current_url
                # Check if still on login page or redirected to transaction page
                if "order/sold" in current_url or "trade" in current_url:
                    # Try to find some element that indicates logged in state
                    # This is a simple check - might need adjustment
                    if self._is_logged_in():
                        print("Login detected!")
                        return True
            except Exception:
                pass
            time.sleep(2)
        
        print("Login timeout")
        return False
    
    def _is_logged_in(self) -> bool:
        """Check if user is logged in by looking for specific elements"""
        try:
            # Look for common elements that appear after login
            # This is a heuristic - actual elements may vary
            body = self.driver.find_element(By.TAG_NAME, "body")
            page_text = body.text.lower()
            
            # Check for transaction-related keywords
            login_keywords = ["交易", "订单", "收款", "收入", "trade", "order", "sale"]
            return any(keyword in page_text for keyword in login_keywords)
        except Exception:
            return False
    
    def refresh(self) -> bool:
        """
        Refresh the transaction page
        
        Returns:
            True if refresh successful
        """
        if not self.driver:
            print("Driver not initialized")
            return False
        
        try:
            self.driver.refresh()
            time.sleep(2)  # Wait for page to reload
            return True
        except Exception as e:
            print(f"Failed to refresh: {e}")
            return False
    
    def get_transactions(self) -> List[Dict]:
        """
        Get current transactions from the page
        
        Returns:
            List of transaction dictionaries
        """
        if not self.driver:
            print("Driver not initialized")
            return []
        
        transactions = []
        
        try:
            # Wait for table to load
            time.sleep(2)
            
            # Find transaction rows - based on Alipay's actual HTML structure
            rows = self.driver.find_elements(By.CSS_SELECTOR, "tr.ant-table-row[data-row-key]")
            
            for row in rows:
                try:
                    cells = row.find_elements(By.CSS_SELECTOR, "td.ant-table-cell")
                    
                    if len(cells) >= 10:
                        # Extract text from each cell
                        create_time = cells[0].text.strip()  # 创建时间
                        pay_time = cells[1].text.strip()     # 支付时间
                        name = cells[2].text.strip()          # 名称
                        merchant_order_no = cells[3].text.strip()  # 商户订单号
                        alipay_trade_no = cells[4].text.strip()   # 支付宝交易号
                        buyer_info = cells[5].text.strip()    # 买家信息
                        amount = cells[6].text.strip()        # 订单金额
                        refund_amount = cells[7].text.strip()  # 退款金额
                        trade_status = cells[8].text.strip()  # 交易状态
                        
                        transaction = {
                            "create_time": create_time,
                            "pay_time": pay_time,
                            "name": name,
                            "merchant_order_no": merchant_order_no,
                            "alipay_trade_no": alipay_trade_no,
                            "buyer_info": buyer_info,
                            "amount": amount,
                            "refund_amount": refund_amount,
                            "trade_status": trade_status,
                        }
                        transactions.append(transaction)
                except Exception as e:
                    print(f"Error parsing row: {e}")
                    continue
            
            self.last_transactions = transactions
            
            # Print summary
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Found {len(transactions)} transactions:")
            for t in transactions:
                print(f"  - {t['create_time'][:19] if t['create_time'] else 'N/A'} | {t['name']} | {t['amount']} | {t['trade_status']}")
            
        except Exception as e:
            print(f"Error parsing transactions: {e}")
        
        return transactions
    
    def check_new_transactions(self, last_count: int = 0) -> List[Dict]:
        """
        Check for new transactions after refresh
        
        Args:
            last_count: Previous transaction count
            
        Returns:
            List of new transactions
        """
        self.refresh()
        current_transactions = self.get_transactions()
        
        if last_count == 0:
            return current_transactions
        
        # Compare to find new transactions
        # In a real implementation, you'd compare by trade_no
        return current_transactions
    
    def start_monitoring(self, callback=None):
        """
        Start automatic monitoring in background thread
        
        Args:
            callback: Function to call when new transactions detected
        """
        self._stop_event.clear()
        
        def monitor_loop():
            last_count = 0
            while not self._stop_event.is_set():
                try:
                    new_transactions = self.check_new_transactions(last_count)
                    
                    if new_transactions and callback:
                        callback(new_transactions)
                    
                    last_count = len(new_transactions)
                    
                except Exception as e:
                    print(f"Monitor error: {e}")
                
                # Wait for next interval or stop event
                self._stop_event.wait(self.refresh_interval)
        
        self._monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        self._monitor_thread.start()
        print(f"Started monitoring (interval: {self.refresh_interval}s)")
    
    def stop_monitoring(self):
        """Stop automatic monitoring"""
        self._stop_event.set()
        if self._monitor_thread:
            self._monitor_thread.join(timeout=5)
        print("Stopped monitoring")
    
    def close(self):
        """Close the browser"""
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                print(f"Browser already closed or error: {e}")
            finally:
                self.driver = None
                print("Browser closed")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def main():
    """Main entry point for running the monitor directly"""
    print("=" * 50)
    print("Alipay Transaction Monitor")
    print("=" * 50)
    print()
    
    monitor = AlipayMonitor(headless=False)
    
    try:
        # Open the page
        if not monitor.open_page():
            print("Failed to open Alipay page")
            return
        
        # Wait for manual login
        if not monitor.wait_for_login(timeout=600):  # 10 minutes
            print("Please log in and press Enter to continue...")
            input()
        
        print("\n--- Transaction Monitoring Started ---")
        print("Press Ctrl+C to stop")
        print()
        
        # Start monitoring with callback
        def on_new_transactions(transactions):
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] New transactions detected!")
            for t in transactions:
                print(f"  - {t}")
        
        monitor.start_monitoring(callback=on_new_transactions)
        
        # Keep running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\nStopping monitor...")
    finally:
        monitor.stop_monitoring()
        monitor.close()


if __name__ == "__main__":
    main()
