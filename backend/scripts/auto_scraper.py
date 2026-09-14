import os
import sys
import json
import time
import logging
import requests
import argparse
from bs4 import BeautifulSoup
import google.generativeai as genai
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

DATASET_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'test_dataset.json')

def fetch_html_text(url):
    """Fetches the frontend webpage and strips out all the HTML tags to get raw text."""
    logger.info(f"Downloading HTML from {url}...")
    try:
        # Code4rena blocks default Python user-agents. We need to disguise it as a real browser.
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code != 200:
            logger.error(f"Failed to fetch webpage. Status Code: {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        return soup.get_text(separator='\n', strip=True)
    except Exception as e:
        logger.error(f"Error fetching URL: {e}")
        return None

def extract_vulnerabilities(raw_text):
    """Uses Gemini to parse the messy webpage text into a JSON array of up to 10 vulnerabilities."""
    model = genai.GenerativeModel('gemini-3.5-flash-lite')
    
    prompt = f"""
    You are an expert smart contract auditor data pipeline.
    I will give you the raw text scraped from an audit report webpage. 
    Your job is to extract up to 10 distinct vulnerabilities from this report.
    
    If a vulnerability doesn't have an explicit code snippet shown in the text, just write "N/A" for the code fields. Do NOT skip the vulnerability just because the code snippet is missing!
    
    Return ONLY a raw JSON array with NO markdown formatting, NO backticks, and NO extra text.
    It must exactly match this schema:
    [
        {{
            "bug_type": "Short name of the vulnerability (e.g. Reentrancy)",
            "description": "A 2-3 sentence summary of the exploit",
            "severity": "CRITICAL, HIGH, or MEDIUM",
            "original_contract": "The raw vulnerable solidity code snippet OR 'N/A'",
            "fixed_contract": "The raw fixed solidity code snippet OR 'N/A'"
        }}
    ]

    Raw Webpage Text:
    {raw_text[:150000]} 
    """
    
    try:
        response = model.generate_content(prompt)
        cleaned = response.text.replace('```json', '').replace('```', '').strip()
        
        if not cleaned:
            return []
            
        parsed = json.loads(cleaned)
        if not parsed:
            logger.error("Gemini returned an empty JSON array. It couldn't fulfill the schema requirements.")
            
        return parsed
    except Exception as e:
        logger.error(f"Failed to parse LLM response: {e}\nRaw output was: {response.text if 'response' in locals() else 'None'}")
        return None

def run_pipeline(urls):
    logger.info("Starting Web Scraping Pipeline...")
    
    dataset = []
    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
            
    highest_id = len(dataset)
    new_entries = 0
    
    for url in urls:
        raw_text = fetch_html_text(url)
        if not raw_text:
            continue
            
        logger.info(f"Extracting vulnerabilities from webpage via Gemini...")
        extracted_list = extract_vulnerabilities(raw_text)
        
        if extracted_list and isinstance(extracted_list, list):
            for extracted in extracted_list:
                highest_id += 1
                extracted['id'] = f"vuln_{highest_id:03d}"
                extracted['source'] = url
                dataset.append(extracted)
                new_entries += 1
                
                logger.info(f"[log] {extracted.get('bug_type', 'Vulnerability')} added to database")
                
                if new_entries >= 10:
                    logger.info("\n\u2705 Reached target of 10 new vulnerabilities.")
                    break
                    
                logger.info("  -> Applying strict 10-second delay...")
                time.sleep(10)
        
        if new_entries >= 10:
            break
            
    with open(DATASET_PATH, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=4)
        
    logger.info(f"\nPipeline Complete! Added {new_entries} new vulnerabilities to the dataset.")
    logger.info("Automatically triggering ChromaDB Knowledge Base build...")
    
    try:
        import sys
        sys.path.append(os.path.dirname(__file__))
        from build_knowledge_base import build_knowledge_base
        build_knowledge_base()
    except Exception as e:
        logger.error(f"Failed to auto-build knowledge base: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Code4rena frontend reports.")
    parser.add_argument("urls", nargs="+", help="One or more full URLs to scrape")
    args = parser.parse_args()
    
    run_pipeline(args.urls)
