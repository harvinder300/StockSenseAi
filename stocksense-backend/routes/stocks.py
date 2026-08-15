from fastapi import APIRouter, HTTPException
from cache.redis_cache import cache_get, cache_set
from services.twelve_data import fetch_quote
from utils.validators import validate_symbol
from config import settings

router = APIRouter()

@router.get("/{symbol}")
async def get_stock_quote(symbol: str):
    # Validate input
    if not validate_symbol(symbol):
        raise HTTPException(
            status_code=400,
            detail="Invalid stock symbol"
        )
    
    symbol = symbol.upper().strip()
    cache_key = f"quote_{symbol}"
    
    # Check cache
    cached = await cache_get(cache_key)
    if cached:
        return {**cached, "fromCache": True}
    
    # Fetch fresh
    data = await fetch_quote(symbol)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for {symbol}"
        )
    
    # Cache 5 minutes
    await cache_set(cache_key, data, settings.QUOTE_CACHE_TTL)
    
    return {**data, "fromCache": False}
