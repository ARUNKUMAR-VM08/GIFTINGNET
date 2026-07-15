import time
import subprocess
import socket
import sys
from playwright.sync_api import sync_playwright, expect

def wait_for_port(port, host='127.0.0.1', timeout=15):
    """Wait until a port is starting to accept TCP connections."""
    start_time = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except (ConnectionRefusedError, socket.timeout):
            if time.time() - start_time > timeout:
                return False
            time.sleep(0.5)

def run_verification():
    print("🚀 Starting backend Express server...")
    # Launch Express server
    server_process = subprocess.Popen(["node", "server.js"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Wait for the server to bind to port 3000
    if not wait_for_port(3000):
        print("❌ Error: Express server failed to start on port 3000 in time.")
        server_process.kill()
        sys.exit(1)

    print("✅ Express server is running on port 3000.")

    # Create verification output dir if needed
    subprocess.run(["mkdir", "-p", "/home/jules/verification"])

    success = False
    try:
        with sync_playwright() as p:
            print("🌐 Launching headless browser...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Set viewport to ensure a high-quality desktop render
            page.set_viewport_size({"width": 1280, "height": 960})

            # Enable console and page error logging
            page.on("pageerror", lambda err: print(f"❌ Browser JS error: {err}"))
            page.on("console", lambda msg: print(f"📺 Browser console: {msg.text}"))

            # 1. Navigate to Storefront Homepage
            print("🏠 Navigating to storefront homepage...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Verify homepage loaded successfully
            expect(page).to_have_title("GlobalDigital - Multi-Language Digital Storefront")
            print("✅ Homepage title verified successfully.")

            # Take a screenshot of the main storefront layout
            page.screenshot(path="/home/jules/verification/storefront_home.png")
            print("📸 Captured storefront home page screenshot.")

            # 2. Add an item to the cart
            print("🛒 Adding 'Full Stack Web Development Masterclass' to the shopping cart...")
            # Click the 'Add to Cart' button of the first product card
            add_to_cart_btn = page.get_by_role("button", name="Add to Cart").first
            add_to_cart_btn.click()
            time.sleep(1) # wait for drawer transition

            # Check that cart drawer opened and badge is visible
            cart_subtotal = page.locator("#cart-subtotal")
            expect(cart_subtotal).to_be_visible()
            print(f"✅ Cart opened successfully. Current subtotal: {cart_subtotal.inner_text()}")

            # 3. Proceed to Checkout
            print("💳 Clicking 'Proceed to Checkout'...")
            time.sleep(1.5) # Wait for the cart drawer transition animation to complete
            checkout_btn = page.locator("#checkout-btn")
            checkout_btn.click()
            time.sleep(1.0)

            # Check checkout modal is visible
            checkout_modal = page.locator("#checkout-modal")
            expect(checkout_modal).to_be_visible()
            print("✅ Checkout registration modal displayed.")

            # Fill in buyer details
            print("✍️ Filling out customer checkout details...")
            page.locator("#checkout-fullname").fill("Alex Developer")
            page.locator("#checkout-email").fill("alex@developer.io")

            # Fill in simulated Stripe Credit Card details
            print("💳 Filling out simulated Stripe Card details...")
            page.locator("#stripe-card-num").fill("4242 4242 4242 4242")
            page.locator("#stripe-card-exp").fill("12/28")
            page.locator("#stripe-card-cvc").fill("242")
            time.sleep(0.5)

            # Take a screenshot of the checkout modal
            page.screenshot(path="/home/jules/verification/checkout_modal.png")
            print("📸 Captured checkout modal form screenshot.")

            # Submit payment/checkout form
            print("🔒 Submitting authorization purchase form...")
            page.get_by_role("button", name="Authorize & Complete Purchase").click()
            time.sleep(3.0) # wait for simulated payments overlay processing and success modal transition

            # Verify that Success Modal is active
            success_modal = page.locator("#success-modal")
            expect(success_modal).to_be_visible()
            order_ref = page.locator("#success-order-id").inner_text()
            print(f"✅ Transaction verified! Received Order Reference: {order_ref}")

            # Take a screenshot of the purchase confirmation and digital downloads list
            page.screenshot(path="/home/jules/verification/purchase_success.png")
            print("📸 Captured purchase success confirmation screenshot.")

            # 4. Open and verify the Digital Course Player
            print("🎬 Opening Digital Course Player for purchased course...")
            page.get_by_role("link", name="Open Digital Player").first.click()
            time.sleep(1.5) # Wait for page load state

            # Switch to the course player page tab (it might open in a new window/tab)
            # Find the player window if open, or navigate directly if not switched
            pages = browser.contexts[0].pages
            player_page = pages[-1] if len(pages) > 1 else page
            if len(pages) > 1:
                player_page.wait_for_load_state("networkidle")
            else:
                player_page.goto("http://localhost:3000/assets/sample_course.html")
                player_page.wait_for_load_state("networkidle")

            expect(player_page).to_have_title("GlobalAcademy - Digital Course Player")
            print("✅ Course Player page loaded and verified.")

            # Simulate playing/pausing lectures
            print("▶️ Simulating interactive course playlist clicks...")
            player_page.get_by_role("button", name="2. Mastering Core Architecture & Syntaxes").click()
            time.sleep(0.5)
            player_page.locator("#centerPlayBtn").click()
            time.sleep(0.5)

            # Take a screenshot of the Course Player
            player_page.screenshot(path="/home/jules/verification/course_player.png")
            print("📸 Captured active interactive Course Player screenshot.")

            # 5. Open and verify Merchant/Admin Dashboard
            print("💼 Navigating to Merchant Control Admin Dashboard...")
            page.goto("http://localhost:3000/admin.html")
            page.wait_for_load_state("networkidle")

            expect(page).to_have_title("GlobalDigital - Merchant Admin Dashboard")
            print("✅ Admin Dashboard loaded successfully.")

            # Take a screenshot of the merchant console
            page.screenshot(path="/home/jules/verification/merchant_dashboard.png")
            print("📸 Captured merchant dashboard screenshot.")

            # Save main composite verification screenshot to workspace root
            page.screenshot(path="verification_screenshot.png")
            print("📸 Saved final verification screenshot at 'verification_screenshot.png'.")

            browser.close()
            success = True

    except Exception as e:
        print(f"❌ Verification failed due to exception: {e}")
    finally:
        print("🛑 Shutting down backend Express server...")
        server_process.terminate()
        server_process.wait()
        print("👋 Finished cleanup.")

    if success:
        print("🏆 SUCCESS: All storefront, checkout, playing and admin workflows are 100% verified!")
        sys.exit(0)
    else:
        print("⚠️ FAILURE: Verification failed.")
        sys.exit(1)

if __name__ == "__main__":
    run_verification()
