import cv2
import numpy as np
from app.service.sensitive_data_service import is_sensitive_text

def redact_sensitive_areas(
    img_bytes: bytes, 
    reader,
    analyzer,  
    force_redact_all_text: bool = False      
) -> bytes:
    # Convert bytes to numpy array
    nparr = np.frombuffer(img_bytes, np.uint8)
    # Decode image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not read the uploaded image. Please ensure it is a valid image file.")

    #======Detect and redact sensitive text=========

    results = reader.readtext(img) # Detect text in the image
    
    for (bbox, text, confidence) in results: # Loop through detected text
        if confidence < 0.2: # Skip low-confidence detections
            continue

        text_clean = text.strip() # Clean the detected text
        if len(text_clean) < 1:
            continue

        should_redact = force_redact_all_text or is_sensitive_text(text_clean, analyzer) # Determine if the text should be redacted

        if should_redact:
            pts = np.array(bbox, dtype=np.int32) # Convert detexted coordinates to numpy array

            x_min = max(0, int(np.min(pts[:,0])) - 20) # Get minimum x-coordinate and add padding
            y_min = max(0, int(np.min(pts[:,1])) - 15) # Get minimum y-coordinate and add padding
            x_max = min(img.shape[1], int(np.max(pts[:,0])) + 20) # Get maximum x-coordinate and add padding
            y_max = min(img.shape[0], int(np.max(pts[:,1])) + 15) # Get maximum y-coordinate and add padding

            # Draw permanent black rectangle over the sensitive text area
            cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 0, 0), -1)

    # Detect and redact faces in the image

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) # Convert image to grayscale

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    ) # Here we use OpenCV's pre-trained Haar Cascade classifier for face detection

    faces = face_cascade.detectMultiScale(
        gray, # Input image
        scaleFactor=1.1, # Parameter specifying how much the image size is reduced at each image scale
        minNeighbors=5,
        minSize=(30, 30) # Minimum possible object size. Objects smaller than this are ignored.
    ) 

    for (x, y, w, h) in faces: # Loop through detected faces
        # Add a little margin around the detected face
        x1 = max(0, x - 10)
        y1 = max(0, y - 10)
        x2 = min(img.shape[1], x + w + 10)
        y2 = min(img.shape[0], y + h + 10)

        # Draw a permanent black rectangle over the detected face
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 0), -1)

    #======Convert the redacted image back to bytes=========
    success, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 90]) # Encode the image as JPEG

    if not success:
        raise ValueError("Could not encode the redacted image. Please try again.")

    return buffer.tobytes() # Convert the buffer to bytes and return