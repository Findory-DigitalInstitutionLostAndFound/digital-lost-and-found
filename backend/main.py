from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router

# create fast api
app = FastAPI(title="Digital Lost and Found API")  

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# include auth router
app.include_router(auth_router)

@app.get('/')
def home():
    return({"message": "Welcome to the Digital Lost and Found API"}) 