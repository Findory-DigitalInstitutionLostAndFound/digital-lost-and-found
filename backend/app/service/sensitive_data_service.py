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

# Finnish / EU style dates like 01.01.1995 
DATE_PATTERN = re.compile(
    r'\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b'
)

# Only these entity types are considered serious
STRICT_ENTITIES = {
    "PHONE_NUMBER",
    "EMAIL_ADDRESS",
    "CREDIT_CARD",
    "IBAN_CODE",
    "US_SSN",
    "FI_PERSONAL_IDENTITY_CODE",
    "PASSPORT_NUMBER",
    "DRIVER_LICENSE_NUMBER",
    "PERSON",
    "DATE_TIME",
    "DATE_OF_BIRTH",
}


def is_sensitive_text(text: str, analyzer) -> bool:
    # Check if the given text contains sensitive data.
    text = text.strip()
    if not text or len(text) < 2: # 2 characters is a reasonable minimum length for sensitive data
        return False

    # Finnish HETU check
    if HETU_PATTERN.search(text):
        return True

    # Dates (birthday, issue, expiry)
    if DATE_PATTERN.search(text):
        return True

    # Presidio analyzer check for sensitive data also check 2nd time for finnish HETU
    results = analyzer.analyze(text=text, language= 'en')
    print("Presidio results on cleaned text:", results)
    for result in results:
        # only accept hig-confidence matches
        if result.score < 0.6:
            continue

        if result.entity_type in STRICT_ENTITIES:
            return True    

    if re.search(r'\b[A-Z0-9]*\d[A-Z0-9\-]*\b', text, re.IGNORECASE):
        # avoid pure years like 2026 
        for match in re.finditer(r'\b[A-Z0-9\-]*\d[A-Z0-9\-]*\b', text, re.IGNORECASE):
            token = match.group(0)
            if len(token) >= 4 and not re.fullmatch(r'\d{4}', token):  # skip plain years
                return True

    # Short pure names (capitalized word 3–12 letters)
    if re.fullmatch(r'[A-Z][a-z]{2,11}', text):
        return True

    return False