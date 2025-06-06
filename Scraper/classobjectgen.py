from bs4 import BeautifulSoup
from selenium import webdriver
import time

with open("classlist.txt", "r") as f:
    url_list = [line.strip() for line in f if line.strip()]

driver = webdriver.Chrome()
file = open("finalclassdata.txt","a+")

for url in url_list:
    driver.get(url)
    time.sleep(2) 
    html = driver.page_source
    soup = BeautifulSoup(html, "lxml")

    course_header = soup.find("h2", id="title-designator")
    if course_header:
        course_code = course_header.find("small").text.strip()
        course_title = course_header.get_text(separator="|", strip=True).split("|")[1]
    else:
        course_code = course_title = "N/A"


    desc_tag = soup.find("p", id="c-desc")
    course_description = desc_tag.get_text(strip=True) if desc_tag else "None"


    transfer_text = "None"
    prerequisite_text = "None"
    advisory_text = "None"

   
    all_dts = soup.select("dl.row > dt.col-sm-4")
    for dt in all_dts:
        label = dt.get_text(strip=True).lower()
        dd = dt.find_next_sibling("dd")
        if not dd:
            continue
        content = dd.get_text(" ", strip=True)

        if "transferability" in label:
            transfer_text = content
        elif "prerequisite" in label:
            prerequisite_text = content
        elif "advisory" in label:
            advisory_text = content

    file.write(f"URL: {url}\nCourse Code: {course_code}\nCourse Title: {course_title}\nDescription: {course_description}\nTransferability: {transfer_text}\nPrerequisite(s): {prerequisite_text}\nAdvisory(ies): {advisory_text}\n{'=' * 60}\n")

    print("URL:", url)
    print("Course Code:", course_code)
    print("Course Title:", course_title)
    print("Description:", course_description)
    print("Transferability:", transfer_text)
    print("Prerequisite(s):", prerequisite_text)
    print("Advisory(ies):", advisory_text)
    print("=" * 60)

driver.quit()
