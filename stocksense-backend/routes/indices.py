from fastapi import APIRouter
from cache.redis_cache import cache_get, cache_set
from services.twelve_data import fetch_indices
from config import settings

router = APIRouter()

@router.get("/")
async def get_indices():
    cache_key = "indices_nifty_sensex"
    
    # Check cache
    cached = await cache_get(cache_key)
    if cached:
        return {**cached, "fromCache": True}
    
    # Fetch fresh
    data = await fetch_indices()
    if not data or (not data.get("nifty") and not data.get("sensex")):
        return {
            "error": "Could not fetch indices",
            "nifty": None,
            "sensex": None
        }
    
    # Cache 1 minute
    await cache_set(cache_key, data, settings.INDICES_CACHE_TTL)
    
    return {**data, "fromCache": False}
