from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from routes import indices, stocks, charts, fundamentals, search, ai

app = FastAPI(
    title="StockSense AI Backend",
    description="Stock data API for StockSense AI",
    version="1.0.0"
)

# CORS — Only allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stock-sense-ai-nine.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Include routes
app.include_router(indices.router, prefix="/api/indices", tags=["Indices"])
app.include_router(stocks.router, prefix="/api/stock", tags=["Stocks"])
app.include_router(charts.router, prefix="/api/chart", tags=["Charts"])
app.include_router(fundamentals.router, prefix="/api/fundamentals", tags=["Fundamentals"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])

@app.get("/")
async def root():
    return {
        "status": "StockSense AI Backend Running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
