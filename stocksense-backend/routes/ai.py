from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from config import settings

router = APIRouter()

class AnalysisRequest(BaseModel):
    stockName: str
    price: float
    fundamentalScore: float
    entryScore: float
    metrics: dict
    insights: list

@router.post("/analyse")
async def analyse_stock(request: AnalysisRequest):
    prompt = f"""You are an expert long term investment advisor for Indian retail investors.

Stock: {request.stockName}
Current Price: ₹{request.price}
Fundamental Score: {request.fundamentalScore}/100
Entry Score: {request.entryScore}/100

Key Metrics:
{request.metrics}

Key Insights:
{chr(10).join(request.insights)}

Write 4-5 lines in simple Hinglish covering:
1. Company ki overall health kaisi hai
2. Long term ke liye suitable hai ya nahi
3. Entry timing kaisa hai abhi
4. Investment strategy kya honi chahiye

Mention scores. Be specific.
End with SEBI disclaimer."""

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                params={"key": settings.GEMINI_KEY},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                },
                timeout=30.0
            )
            data = res.json()
        
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return {"analysis": text, "success": True}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="AI analysis failed"
        )
