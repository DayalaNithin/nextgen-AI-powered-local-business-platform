from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.firefox.options import Options
from swiftshadow import QuickProxy
import time
import random
import datetime
import re

class ProxyInput:
    def __init__(self, ip, protocol, port):
        self.ip = ip
        self.protocol = protocol
        self.port = port

def wait(a=1.0, b=2.0):
    time.sleep(random.uniform(a, b))

def convert_relative_date(raw):
    if not raw:
        return None
    raw = raw.lower()
    today = datetime.date.today()

    try:
        match = re.search(r'\d+', raw)
        if match:
            num = int(match.group())
        else:
            num = 0
    except:
        return None

    if "minutes" in raw:
        return today
    if "hours" in raw:
        return today
    if "day" in raw:
        return today - datetime.timedelta(days=num)
    if "week" in raw:
        return today - datetime.timedelta(weeks=num)
    if "month" in raw:
        return today - datetime.timedelta(days=num * 30)
    if "year" in raw:
        return today - datetime.timedelta(days=num * 365)
    
    return None


# --------------------------
# Main Scraper
# --------------------------

def scrape_google_reviews(url, max_scrolls=2):
    # The variable you have:
    my_proxy_data = QuickProxy()
    # 2. Extract data from that specific object structure
    PROXY_IP = my_proxy_data.ip
    PROXY_PORT = my_proxy_data.port # Already an integer

    options = Options()

    # 3. Use the extracted data to set Firefox internal preferences
    options.set_preference("network.proxy.type", 1) # Manual proxy settings

    # We use the same IP/Port for both HTTP and SSL (HTTPS) traffic
    options.set_preference("network.proxy.http", PROXY_IP)
    options.set_preference("network.proxy.http_port", PROXY_PORT)
    options.set_preference("network.proxy.ssl", PROXY_IP)
    options.set_preference("network.proxy.ssl_port", PROXY_PORT)
    options.set_preference("network.proxy.no_proxies_on", "")
    opts = Options()
    opts.add_argument("--headless")
    driver = webdriver.Firefox(options=opts)

    driver.get(url)
    wait(3, 4)

    # ----------------------------------
    # 1. CLICK SORT BUTTON
    # ----------------------------------
    try:
        print("Clicking SORT button...")
        sort_btn = driver.find_element(By.CSS_SELECTOR, "div.TrU0dc:nth-child(2) > button:nth-child(1)")
        sort_btn.click()
        wait()
    except Exception as e:
        print("❌ Failed to open sort menu:", e)

    # ----------------------------------
    # 2. CLICK NEWEST
    # ----------------------------------
    try:
        print("Selecting NEWEST...")
        newest = driver.find_element(By.CSS_SELECTOR, "div.fxNQSd:nth-child(2)")
        newest.click()
        wait()
        print("✔ NEWEST selected")
    except Exception as e:
        print("❌ Failed to click NEWEST:", e)

    # ----------------------------------
    # 3. GET SCROLL CONTAINER
    # ----------------------------------
    scroll_box = driver.find_element(By.CSS_SELECTOR, ".DxyBCb")
    time.sleep(5)

    # ----------------------------------
    # 4. SCROLL REVIEW PANEL
    # ----------------------------------
    print("Scrolling reviews...")
    old_count = 0
    for _ in range(max_scrolls):
        driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight;", scroll_box)
        time.sleep(5)

        new_count = len(driver.find_elements(By.CSS_SELECTOR, "div.jftiEf"))
        if new_count == old_count:
            print("No more new reviews. Done.")
            break

        old_count = new_count


    # ----------------------------------
    # 5. EXTRACT REVIEWS
    # ----------------------------------
    print("Extracting reviews...")

    review_blocks = driver.find_elements(By.CLASS_NAME, "jJc9Ad")
    print("Found reviews:", len(review_blocks))
    # print('review block:',review_blocks.text)
    rows = driver.find_elements(By.CSS_SELECTOR, "div[jslog='126926']")

    review_data = {}

    for row in rows:
        try:
            spans = row.find_elements(By.CSS_SELECTOR, "[jslog='127691']")
            if len(spans) >= 2:
                label = spans[0].text.strip().replace(":", "")
                value = spans[1].text.strip()
                review_data[label] = value
        except:
            pass

    reviews = []

    for r in review_blocks:
            # author
        try:
            author = r.find_element(By.CSS_SELECTOR, "div.d4r55").text
        except:
            author = None

        # rating
        try:
            rating = r.find_element(By.CSS_SELECTOR, "span[aria-label*='star']").get_attribute("aria-label")
        except:
            rating = None

        # text
        try:
            text = r.find_element(By.CSS_SELECTOR, "span.wiI7pd").text
        except:
            text = None

        # date
        try:
            date_raw = r.find_element(By.CLASS_NAME, "rsqaWe").text
        except:
            date_raw = None

        date_parsed = convert_relative_date(date_raw)


        reviews.append({
            "author": author,
            "rating": rating,
            "text": text,
            "date_raw": date_raw,
            "date": str(date_parsed) if date_parsed else None
        })

    driver.quit()
    return reviews, review_data


# ------------------------------------------
# Example usage
# ------------------------------------------

if __name__ == "__main__":
    # url = "https://maps.app.goo.gl/EQaGq6jrXpSL5gjP8"
    url = ""
    data = scrape_google_reviews(url)

    for r in data:
        print(r)

