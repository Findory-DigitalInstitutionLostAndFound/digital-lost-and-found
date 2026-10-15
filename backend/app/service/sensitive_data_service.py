import cv2 # This is used to read and process images
import numpy as np # For numerical operations
from PIL import Image # For image handling
import re # For regular expressions
from pathlib import Path # For handling file paths

# Finnish HETU pattern
HETU_PATTERN = re.compile(
    r'\b\d{6}[-+A-FU-Y]\d{3}[0-9A-Z]\b',
    re.IGNORECASE
)

def is_sensitive_text(text: str, analyzer) -> bool:
    """Check if the given text contains sensitive data."""
    text = text.strip()
    if not text or len(text) < 3: # 3 characters is a reasonable minimum length for sensitive data
        return False

    # Finnish HETU check
    if HETU_PATTERN.search(text):
        return True

    # Presidio analyzer check for sensitive data also check 2nd time for finnish HETU
    results_en = analyzer.analyze(text=text, language= 'en')
    if results_en:
        return True    

    # Long alphanumeric codes check (e.g., serial numbers, IDs)
    if re.search(r'\b[A-Z0-9]{6,}\b', text): # this matches sequences of 6 or more alphanumeric characters
        return True

    return False