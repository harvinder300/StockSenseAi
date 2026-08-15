from fastapi import APIRouter, HTTPException
from cache.redis_cache import cache_get, cache_set
from services.twelve_data import fetch_fundamentals
from utils.validators import validate_symbol
from config import settings

router = APIRouter()

@router.get("/{symbol}")
async def get_fundamentals(symbol: str):
    if not validate_symbol(symbol):
        raise HTTPException(
            status_code=400,
            detail="Invalid symbol"
        )
    
    symbol = symbol.upper().strip()
    cache_key = f"fundamentals_{symbol}"
    
    # Check cache
    cached = await cache_get(cache_key)
    if cached:
        return {**cached, "fromCache": True}
    
    # Fetch fresh
    data = await fetch_fundamentals(symbol)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Fundamentals unavailable for {symbol}"
        )
    
    # Cache 24 hours
    await cache_set(cache_key, data, settings.FUNDAMENTALS_CACHE_TTL)
    
    return {**data, "fromCache": False}
