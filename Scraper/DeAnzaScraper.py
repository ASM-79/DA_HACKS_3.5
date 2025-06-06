from bs4 import BeautifulSoup
from selenium import webdriver
import time
from urllib.parse import urljoin

baseurl = "https://deanza.elumenapp.com/catalog/"
url = "https://deanza.elumenapp.com/catalog/2024-2025/course-listings#mainContent"

driver = webdriver.Chrome()
driver.get(url)
time.sleep(2)

html = driver.page_source
driver.quit()

soup = BeautifulSoup(html, "lxml")
links = soup.find_all("a", href=True)

# Read once before writing
with open("classlinks.txt", "a+", encoding="utf-8") as file:
    file.seek(0)
    existing = file.read().splitlines()

    for tag in links:
        href = tag["href"]
        fullurl = urljoin(baseurl, href)

        if ("courses" in fullurl):
            file.write(fullurl + "\n")
with open("classlinks.txt", "r+", encoding="utf-8") as file:
    lines = file.readlines()
    file.seek(0)
    file.truncate()
    
    seen = set()
    for line in lines:
        if line not in seen:
            file.write(line)
            seen.add(line)
with open("classlinks.txt", "r+", encoding="utf-8") as file:
    lines = file.readlines()
    file.seek(0)
    file.truncate()

    for line in lines:
        clean_line = line.strip()
        if clean_line.endswith("courses") and "repeating" not in clean_line:
            file.write(clean_line + "\n")
