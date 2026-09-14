import logging
import json
import os

logger = logging.getLogger(__name__)

import os
import time
import google.generativeai as genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Configure the API key securely
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.warning("GEMINI_API_KEY is not set in the environment or .env file.")
genai.configure(api_key=api_key)

def call_llm(prompt: str, temperature: float = 0.0, require_json: bool = False) -> str:
    """
    Calls the Gemini API with exponential backoff, falling back between models.
    """
    models_to_try = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    max_retries = 4
    
    for attempt in range(max_retries):
        model_name = models_to_try[attempt % len(models_to_try)]
        
        try:
            logger.debug(f"Calling {model_name} (Attempt {attempt+1})...")
            model = genai.GenerativeModel(model_name)
            
            # Formatting configurations
            config = genai.types.GenerationConfig(
                temperature=temperature,
                response_mime_type="application/json" if require_json else "text/plain",
            )
            
            response = model.generate_content(prompt, generation_config=config)
            return response.text
            
        except Exception as e:
            wait_time = 2 ** attempt
            logger.warning(f"{model_name} failed: {e}. Retrying in {wait_time}s...")
            time.sleep(wait_time)
            
    logger.error("All LLM attempts failed.")
    return "[]" if require_json else "// LLM generation failed"

def run_subprocess(command: list) -> tuple[bool, str, str]:
    """
    Wrapper for running CLI tools like Slither and solc.
    """
    import subprocess
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        logger.error(f"Subprocess error: {e}")
        return False, "", str(e)

def strip_markdown(text: str) -> str:
    """Strips markdown code blocks from LLM output to extract raw code."""
    import re
    pattern = r"```(?:solidity|sol)?\n?(.*?)\n?```"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text.strip()
