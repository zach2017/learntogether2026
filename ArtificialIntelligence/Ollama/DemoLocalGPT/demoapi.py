from fastapi import FastAPI, HTTPException

app = FastAPI()

# Example route
@app.get("/hello")
async def hello():
    return "Hello!"

try:
    # Example request
    response = app.post('"/world", data="foos"')
except HTTPException as e:
    if e.status_code == 400:
        explanation = e.detail["message"]
        raise HTTPException(status_code=400 . explanation)
