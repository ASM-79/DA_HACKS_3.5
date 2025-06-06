# DO NOT RUN
from bs4 import BeautifulSoup
from selenium import webdriver
import time

driver = webdriver.Chrome()
year =75
base_url = "https://assist.org/transfer/results?year={yearno}&institution=113&agreement={agreement}&agreementType=to&viewAgreementsOptions=true&view=agreement"

for agreementnumber in range(0,300):
    url = base_url.format(agreement=agreementnumber,yearno=year)
    driver.get(url)
    time.sleep(1)  

    html = driver.page_source

   
    with open("agreementnonyear.txt", "a+", encoding="utf-8") as file:
        soup = BeautifulSoup(html, "lxml")
        criteria_divs = soup.find_all("div", class_="criteria")

        for div in criteria_divs:
            span = div.find("span")
            if span and span.text.strip(): 
                print(f"Agreement #{agreementnumber}: {span.text.strip()}")
                file.write(f"{span.text.strip()} : {url}\n") 
                
with open("agreementnonyear.txt", "r") as infile, open("FilteredDeAnzaToUniAgreements.txt", "a+") as outfile:
    for line in infile:
        if "university" in line.lower() or "california" in line.lower():
            outfile.write(line)



driver.quit()
