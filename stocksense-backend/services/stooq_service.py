import httpx
from datetime import datetime
from utils.symbol_resolver import format_for_stooq

async def fetch_stooq_chart(symbol: str):
    stooq_sym = format_for_stooq(symbol)
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://stooq.com/q/d/l/",
                params={"s": stooq_sym, "i": "d"},
                timeout=10.0
            )
            text = res.text
        
        lines = text.strip().split("\n")
        if len(lines) < 2:
            return None
        
        candles = []
        for line in lines[1:]:  # Skip header
            parts = line.split(",")
            if len(parts) < 5:
                continue
            try:
                date, open_, high, low, close = parts[:5]
                volume = int(parts[5]) if len(parts) > 5 and parts[5].strip().isdigit() else 0
                
                candles.append({
                    "time": int(datetime.strptime(date.strip(), "%Y-%m-%d").timestamp()),
                    "open": float(open_),
                    "high": float(high),
                    "low": float(low),
                    "close": float(close),
                    "volume": volume
                })
            except Exception:
                continue
        
        candles.sort(key=lambda x: x["time"])
        return candles[-90:] if candles else None
        
    except Exception:
        return None
