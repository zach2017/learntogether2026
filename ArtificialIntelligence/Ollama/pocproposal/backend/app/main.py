from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import get_settings
from .routers import router
from .db import Base, engine

settings = get_settings()
app = FastAPI(title="Recruitment Analysis POC", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    # Note: for POC, auto-create tables.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(router)
