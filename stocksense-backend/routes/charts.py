from fastapi import APIRouter, HTTPException, Query
from cache.redis_cache import cache_get, cache_set
from services.twelve_data import fetch_chart
from services.stooq_service import fetch_stooq_chart
from utils.validators import validate_symbol
from config import settings

router = APIRouter()

@router.get("/{symbol}")
async def get_chart(
    symbol: str,
    days: int = Query(default=90, le=365)
):
    if not validate_symbol(symbol):
        raise HTTPException(
            status_code=400,
            detail="Invalid symbol"
        )
    
    symbol = symbol.upper().strip()
    cache_key = f"chart_{symbol}_{days}"
    
    # Check cache
    cached = await cache_get(cache_key)
    if cached:
        return {
            "symbol": symbol,
            "candles": cached,
            "fromCache": True
        }
    
    # Try Twelve Data first
    candles = await fetch_chart(symbol, days)
    
    # Fallback to Stooq
    if not candles:
        candles = await fetch_stooq_chart(symbol)
    
    if not candles:
        raise HTTPException(
            status_code=404,
            detail=f"Chart data unavailable for {symbol}"
        )
    
    # Cache 15 minutes
    await cache_set(cache_key, candles, settings.CHART_CACHE_TTL)
    
    return {
        "symbol": symbol,
        "candles": candles,
        "count": len(candles),
        "fromCache": False
    }
