from fastapi import APIRouter, Query
from cache.redis_cache import cache_get, cache_set
import httpx
from config import settings

router = APIRouter()

@router.get("/")
async def search_stocks(
    q: str = Query(..., min_length=1, max_length=50)
):
    # Sanitize
    q = q.strip().upper()
    cache_key = f"search_{q}"
    
    # Check cache
    cached = await cache_get(cache_key)
    if cached:
        return {"results": cached, "fromCache": True}
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://api.twelvedata.com/symbol_search",
                params={
                    "symbol": q,
                    "apikey": settings.TWELVE_DATA_KEY
                },
                timeout=10.0
            )
            data = res.json()
        
        # Filter Indian stocks only
        results = [
            {
                "symbol": item["symbol"].replace(":NSE", "").replace(":BSE", ""),
                "name": item.get("instrument_name", item["symbol"]),
                "exchange": item.get("exchange", "NSE"),
                "type": item.get("instrument_type", "EQUITY")
            }
            for item in data.get("data", [])
            if item.get("exchange") in ["NSE", "BSE"] or item.get("country") == "India"
        ][:8]  # Top 8 results
        
        # Cache 1 hour
        await cache_set(cache_key, results, settings.SEARCH_CACHE_TTL)
        
        return {
            "results": results,
            "fromCache": False
        }
        
    except Exception:
        return {"results": [], "error": True}
