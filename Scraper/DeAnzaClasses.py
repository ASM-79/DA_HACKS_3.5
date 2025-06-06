from bs4 import BeautifulSoup
from selenium import webdriver
import time

baseurl = "https://deanza.elumenapp.com/catalog/"


with open("classlinks.txt", "r", encoding="utf-8") as f:
    url_list = [line.strip() for line in f if line.strip()]


with open("classlist.txt", "w", encoding="utf-8") as classlist:
    driver = webdriver.Chrome()

    for url in url_list:
        driver.get(url)
        time.sleep(1)
        html = driver.page_source
        soup = BeautifulSoup(html, "lxml")
        links = soup.find_all("a", href=True)

        for link in links:
            if link["href"].startswith("2024-2025/course/"):
                full_url = baseurl + link["href"]
                print(full_url)
                classlist.write(full_url + "\n")

    driver.quit()
