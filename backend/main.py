from fastapi import FastAPI

# create fast api
app = FastAPI(title="Digital Lost and Found API")  

@app.get('/')
def home():
    return({"message": "Welcome to the Digital Lost and Found API"}) 