import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def create_openrouter_client():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return None  

    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )