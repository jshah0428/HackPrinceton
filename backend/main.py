from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from dotenv import load_dotenv
import os

from database import get_db, init_db, close_db
from models import User, Item

# Load environment variables
load_dotenv()

app = FastAPI(
    title="HackPrinceton Backend",
    description="Backend API for HackPrinceton project",
    version="0.1.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",  # Next.js default dev server
    "http://localhost:3001",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()
    print("Database initialized successfully!")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    await close_db()
    print("Database connections closed.")


@app.get("/")
async def root():
    return {"message": "Hello from HackPrinceton Backend!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/db-health")
async def db_health_check(db: AsyncSession = Depends(get_db)):
    """Check database connectivity"""
    try:
        # Try to execute a simple query
        result = await db.execute(select(1))
        result.scalar()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@app.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    """Example endpoint to get all users"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return {"users": users}


@app.get("/items")
async def get_items(db: AsyncSession = Depends(get_db)):
    """Example endpoint to get all items"""
    result = await db.execute(select(Item))
    items = result.scalars().all()
    return {"items": items}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
