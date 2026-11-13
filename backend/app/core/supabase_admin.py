import os
from supabase import create_client, Client

def get_admin_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, service_role_key)