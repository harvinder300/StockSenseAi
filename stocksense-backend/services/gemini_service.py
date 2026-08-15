import httpx
from config import settings

async def analyze_with_gemini(prompt: str):
    if not settings.GEMINI_KEY:
        return None
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                params={"key": settings.GEMINI_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=30.0
            )
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None
