import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from backend.app.database.session import engine, Base
from backend.app.database.seed import seed_database
from backend.app.api import auth, claims, reasoning, review, admin, health

# Create DB schema
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

# Startup / lifespan hook to automatically seed initial demo accounts
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure storage directories exist
    storage_root = Path(os.getenv("STORAGE_DIR", "../storage"))
    (storage_root / "evidence").mkdir(parents=True, exist_ok=True)
    (storage_root / "reports").mkdir(parents=True, exist_ok=True)
    # Seed users and demo data
    try:
        seed_database()
    except Exception as e:
        print(f"[Warning] Seeding skipped or error: {e}")
    yield

app = FastAPI(
    title="NexusClaim – Autonomous Multimodal Claims Intelligence Platform",
    description="Enterprise-grade autonomous multimodal insurance investigation platform powered by LangGraph and Gemini.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(claims.router)
app.include_router(reasoning.router)
app.include_router(review.router)
app.include_router(admin.router)

# Mount local storage securely for file previews (under auth or static in demo mode)
storage_path = Path(__file__).resolve().parent.parent.parent / "storage"
storage_path.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(storage_path)), name="storage")

@app.get("/")
def root():
    return {
        "message": "Welcome to NexusClaim API",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }
