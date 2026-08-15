from fastapi import Request, HTTPException
from cache.redis_cache import cache_get, cache_set

async def rate_limit_check(request: Request):
    ip = request.client.host if request.client else "127.0.0.1"
    key = f"ratelimit_{ip}"
    
    current = await cache_get(key)
    
    if current and int(current.get("count", 0)) >= 30:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a minute."
        )
    
    count = int((current or {}).get("count", 0)) + 1
    await cache_set(key, {"count": count}, 60)
