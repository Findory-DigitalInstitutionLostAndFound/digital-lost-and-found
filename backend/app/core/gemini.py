# core/gemini.py
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def create_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")
    return genai.Client(api_key=api_key) # Create a new Gemini client with the provided API key