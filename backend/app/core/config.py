import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file to os.environ
load_dotenv()

# Get the Supabase URL and API key from environment variables
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

# create a Supabase client instance
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)