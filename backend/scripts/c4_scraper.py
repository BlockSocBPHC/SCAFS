import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("C4-Scraper")

def fetch_code4rena_findings(repo_name: str):
    """
    Code4rena stores contest findings in public GitHub repositories.
    Example repo: 'code-423n4/2023-01-pooltogether-findings'
    
    This is a starter script to fetch issues via the GitHub API. 
    Note: Extracting the EXACT 'before' and 'after' code requires parsing 
    the Markdown bodies of the issues or tracking the linked PRs.
    """
    url = f"https://api.github.com/repos/{repo_name}/issues"
    
    # You will need a GitHub Personal Access Token (PAT) for rate limits
    headers = {
        "Accept": "application/vnd.github.v3+json",
        # "Authorization": "token YOUR_GITHUB_TOKEN" 
    }
    
    logger.info(f"Fetching issues from {repo_name}...")
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        logger.error(f"Failed to fetch data: {response.status_code}")
        return []
        
    issues = response.json()
    dataset = []
    
    for issue in issues:
        # Code4rena uses labels to indicate severity (e.g., '3 (High Risk)')
        labels = [l['name'] for l in issue.get('labels', [])]
        
        if '3 (High Risk)' in labels or '2 (Med Risk)' in labels:
            finding = {
                "id": f"C4-{issue['number']}",
                "source": "Code4rena",
                "title": issue['title'],
                "url": issue['html_url'],
                "labels": labels,
                # The body contains the markdown report. You would need to write
                # regex here to extract the specific Solidity code blocks.
                "raw_markdown": issue['body'] 
            }
            dataset.append(finding)
            
    return dataset

if __name__ == "__main__":
    # Example: Fetching a past contest's findings
    # findings = fetch_code4rena_findings("code-423n4/2023-01-pooltogether-findings")
    # with open("scraped_c4_data.json", "w") as f:
    #     json.dump(findings, f, indent=2)
    logger.info("Scraper stub ready. See code for GitHub API implementation details.")
