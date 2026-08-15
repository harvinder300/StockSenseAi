import redis.asyncio as redis
import json
from config import settings

redis_client = None

async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    return redis_client

async def cache_get(key: str):
    try:
        r = await get_redis()
        data = await r.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception:
        return None

async def cache_set(key: str, value: dict | list, ttl: int):
    try:
        r = await get_redis()
        await r.setex(key, ttl, json.dumps(value))
        return True
    except Exception:
        return False

async def cache_delete(key: str):
    try:
        r = await get_redis()
        await r.delete(key)
    except Exception:
        pass
