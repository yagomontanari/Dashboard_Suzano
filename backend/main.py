from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, data

app = FastAPI(title="Dashboard MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(data.router, prefix="/data", tags=["data"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
