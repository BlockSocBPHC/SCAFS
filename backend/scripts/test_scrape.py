import os
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
from dotenv import load_dotenv

# Load API Key
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

URL = "https://code4rena.com/reports/2023-01-biconomy"

print(f"Step 1: Downloading HTML from {URL}...")
response = requests.get(URL)
print(f"Status Code: {response.status_code}\n")

soup = BeautifulSoup(response.text, 'html.parser')
raw_text = soup.get_text(separator='\n', strip=True)

print("============= WHAT PYTHON SEES (First 1000 characters) =============")
print(raw_text[:1000])
print("====================================================================\n")

print("Step 2: Sending this text to Gemini...")
model = genai.GenerativeModel('gemini-3.5-flash-lite')
prompt = f"""
I am debugging a scraper. Look at the text below. 
Does it contain smart contract vulnerabilities? If yes, list them. If no, explain what the text actually is.

Raw Text:
{raw_text[:25000]}
"""

try:
    resp = model.generate_content(prompt)
    print("============= WHAT GEMINI RESPONDED =============")
    print(resp.text)
    print("=================================================")
except Exception as e:
    print(f"Gemini Error: {e}")
