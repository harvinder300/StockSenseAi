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

@app.get("/debug")
async def debug():
    from config import settings
    import httpx
    
    # Test Twelve Data directly
    test_result = None
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://api.twelvedata.com/quote",
                params={
                    "symbol": "NIFTY50:NSE",
                    "apikey": settings.TWELVE_DATA_KEY
                },
                timeout=10.0
            )
            test_result = res.json()
    except Exception as e:
        test_result = {"error": str(e)}
    
    return {
        "twelve_data_key_set": bool(settings.TWELVE_DATA_KEY),
        "twelve_data_key_preview": settings.TWELVE_DATA_KEY[:8] + "..." if settings.TWELVE_DATA_KEY else "NOT SET",
        "gemini_key_set": bool(settings.GEMINI_KEY),
        "redis_url_set": bool(settings.REDIS_URL),
        "twelve_data_test": test_result
    }

@app.get("/test-symbols")
async def test_symbols():
    from config import settings
    import httpx
    
    results = {}
    
    # Test these symbol formats
    symbols_to_test = [
        "NIFTY50:NSE",
        "NIFTY:NSE",
        "NIFTY50",
        "NIFTY",
        "^NSEI",
        "SENSEX:BSE",
        "SENSEX",
        "^BSESN",
        "RELIANCE:NSE",
        "RELIANCE",
        "TCS:NSE",
        "TCS"
    ]
    
    async with httpx.AsyncClient() as client:
        for symbol in symbols_to_test:
            try:
                res = await client.get(
                    "https://api.twelvedata.com/quote",
                    params={
                        "symbol": symbol,
                        "apikey": settings.TWELVE_DATA_KEY
                    },
                    timeout=8.0
                )
                data = res.json()
                results[symbol] = {
                    "status": data.get("status", "ok"),
                    "has_close": bool(data.get("close")),
                    "close": data.get("close"),
                    "error": data.get("message") if data.get("status") == "error" else None
                }
            except Exception as e:
                results[symbol] = {"error": str(e)}
        
        # Check API plan/credits
        try:
            plan_res = await client.get(
                "https://api.twelvedata.com/api_usage",
                params={"apikey": settings.TWELVE_DATA_KEY},
                timeout=8.0
            )
            results["api_plan"] = plan_res.json()
        except Exception as e:
            results["api_plan"] = {"error": str(e)}
    
    return results

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
