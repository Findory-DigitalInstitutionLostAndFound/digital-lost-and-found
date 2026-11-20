import os
import httpx

def send_guest_match_email(email: str, name: str, match_link: str, item_title: str):
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("BREVO_SENDER_EMAIL")

    if not api_key or not sender_email:
        print("Missing BREVO_API_KEY or BREVO_SENDER_EMAIL.")
        return

    payload = {
        "sender": {"name": "Findory", "email": sender_email},
        "to": [{"email": email, "name": name}],
        "subject": f"Findory: Track matches for your lost item ({item_title})",
        "htmlContent": f"""
            <p>Hello {name},</p>
            <p>Your lost item report for <strong>{item_title}</strong> has been received.</p>
            <p>Use the link below to view matching found items and submit a claim:</p>
            <p><a href="{match_link}">View Matching Items</a></p>
            <p>This link remains valid for a limited time.</p>
        """,
    }

    try:
        response = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10.0,
        )
        if response.status_code >= 400:
            print(f"Brevo error ({response.status_code}): {response.text}")
            return
        print(f"Brevo email queued ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"Failed to send guest email to {email}: {e}")