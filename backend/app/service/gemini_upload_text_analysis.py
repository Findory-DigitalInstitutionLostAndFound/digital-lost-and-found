from google.genai import types
import json
import concurrent.futures

# Helper function to run a blocking API call with a strict time limit
def _call_with_timeout(func, *args, timeout=7.0, **kwargs):
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func, *args, **kwargs)
        try:
            return future.result(timeout=timeout)
        except concurrent.futures.TimeoutError:
            future.cancel()
            raise TimeoutError(f"Timed out after {timeout}s")

def analyze_text_for_sensitive_data(mode: str, data: str, gemini_client=None, openrouter_client=None) -> dict:
    prompt = f"""
        You are a privacy expert for a university lost-and-found system in Finland.

        Analyze the following description of a {mode} item (Note: mode is either "lost" or "found"):

        \"\"\"{data}\"\"\"

        Your tasks:

        1. Detect any sensitive information that should NOT be shown publicly:
        - Finnish personal identity codes (HETU / henkilötunnus)
        - Full names of people
        - Phone numbers, emails, home addresses
        - Credit/debit card numbers
        - Exact serial numbers, unique engravings, or codes that can be used to fraudulently claim the item
        - Student ID numbers or other unique personal identifiers

        2. Create a clean and attractive public description:
        - Keep as many useful details as possible (color, brand, material, size, condition, location, etc.)
        - Only remove the sensitive information listed above
        - Make the description natural and helpful for the real owner to recognize their item
        - Do NOT use [REDACTED] or any placeholder text
        - Do NOT make the description too short or generic

        3. Decide if the item is high-value:
        - Return true if the item is likely worth 100 euros or more
        - Return false if it is likely worth less than 100 euros
        - Do not mentionhow much it costs inside public description

        Return ONLY valid JSON in this exact format (no markdown, no extra text):

        {{
        "has_sensitive_data": true or false,
        "sensitive_items": [
            {{
            "type": "hetu | serial_number | name | phone | email | address | credit_card | other",
            "description": "short description of what was found"
            }}
        ],
        "public_description": "A clean, natural and attractive description that can be shown publicly",
        "is_high_value": true or false,
        "recommendation": "safe_to_publish | needs_redaction | high_risk"
        }}
        """

    # Try openrouter
    if openrouter_client:
        models = [
            "openrouter/free",
            "cohere/north-mini-code:free",
            "nvidia/nemotron-3.5-lightning:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "nvidia/nemotron-3.5-super-vl:free",
            "google/gemma-4-31b-it:free",
            "google/gemma-4-26b-a4b-it:free",
            "qwen/qwen3.8-27b:free",
        ]
        for model in models:
            try:
                print(f"Trying OpenRouter: {model}")
                response = _call_with_timeout(
                    openrouter_client.chat.completions.create,
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    timeout=7.0 # 7 seconds
                )
                result = _parse_json(response.choices[0].message.content)
                result["provider"] = "openrouter"
                result["model_used"] = model
                return result
            except Exception as e:
                print(f"OpenRouter {model} failed → {e}")

    # Try gemini
    if gemini_client:
        for model in ["gemini-3.5-flash-lite","gemini-3.5-flash", "gemini-3.8-flash"]:
            try:
                print(f"Trying Gemini: {model}")
                response = _call_with_timeout(
                    gemini_client.models.generate_content,
                    model=model,
                    contents=prompt,
                    timeout=7.0 # 7 seconds
                )
                result = _parse_json(response.text)
                result["provider"] = "gemini"
                result["model_used"] = model
                return result
            except Exception as e:
                print(f"Gemini {model} failed → {e}")

    

    return {
        "has_sensitive_data": True,
        "sensitive_items": [],
        "cleaned_text": data,
        "recommendation": "needs_redaction",
        "error": "All AI providers failed",
        "provider": "none",
        "model_used": "none"
    }

# Helper function to parse JSON from model response
def _parse_json(raw: str) -> dict:
    """Clean and parse JSON from model response"""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())