import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_KEY", "")  # same anon key

def get_user_supabase_client(access_token: str) -> Client:
    
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(access_token)
    client.options.headers["Authorization"] = f"Bearer {access_token}"
    return client