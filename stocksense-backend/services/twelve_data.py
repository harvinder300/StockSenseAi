import httpx
import asyncio
from datetime import datetime
from config import settings
from utils.symbol_resolver import format_for_twelve_data

BASE_URL = "https://api.twelvedata.com"

async def fetch_quote(symbol: str):
    formatted = format_for_twelve_data(symbol)
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{BASE_URL}/quote",
                params={
                    "symbol": formatted,
                    "apikey": settings.TWELVE_DATA_KEY
                },
                timeout=10.0
            )
            data = res.json()
        except Exception:
            return None
    
    if data.get("status") == "error" or not data.get("close"):
        return None
    
    price = float(data["close"])
    prev = float(data.get("previous_close", price))
    change = price - prev
    change_pct = (change / prev * 100) if prev else 0.0
    
    return {
        "symbol": symbol,
        "name": data.get("name", symbol),
        "price": round(price, 2),
        "previousClose": round(prev, 2),
        "change": round(change, 2),
        "changePercent": round(change_pct, 2),
        "open": float(data.get("open", price)),
        "high": float(data.get("high", price)),
        "low": float(data.get("low", price)),
        "volume": int(data.get("volume", 0)),
        "exchange": data.get("exchange", "NSE"),
        "isPositive": change >= 0,
        "source": "Twelve Data"
    }

async def fetch_chart(symbol: str, days: int = 90):
    formatted = format_for_twelve_data(symbol)
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{BASE_URL}/time_series",
                params={
                    "symbol": formatted,
                    "interval": "1day",
                    "outputsize": days,
                    "apikey": settings.TWELVE_DATA_KEY
                },
                timeout=15.0
            )
            data = res.json()
        except Exception:
            return None
    
    if data.get("status") == "error":
        return None
    
    values = data.get("values", [])
    if not values:
        return None
    
    candles = []
    for v in values:
        try:
            candles.append({
                "time": int(datetime.strptime(v["datetime"], "%Y-%m-%d").timestamp()),
                "open": float(v["open"]),
                "high": float(v["high"]),
                "low": float(v["low"]),
                "close": float(v["close"]),
                "volume": int(v.get("volume", 0))
            })
        except Exception:
            continue
    
    candles.sort(key=lambda x: x["time"])
    return candles

async def fetch_fundamentals(symbol: str):
    formatted = format_for_twelve_data(symbol)
    
    async with httpx.AsyncClient() as client:
        try:
            stats_res, profile_res = await asyncio.gather(
                client.get(
                    f"{BASE_URL}/statistics",
                    params={
                        "symbol": formatted,
                        "apikey": settings.TWELVE_DATA_KEY
                    },
                    timeout=15.0
                ),
                client.get(
                    f"{BASE_URL}/profile",
                    params={
                        "symbol": formatted,
                        "apikey": settings.TWELVE_DATA_KEY
                    },
                    timeout=15.0
                ),
                return_exceptions=True
            )
            stats = stats_res.json() if not isinstance(stats_res, Exception) else {}
            profile = profile_res.json() if not isinstance(profile_res, Exception) else {}
        except Exception:
            return None
    
    if stats.get("status") == "error" and profile.get("status") == "error":
        return None
    
    s = stats.get("statistics", {})
    v = s.get("valuations_metrics", {})
    f = s.get("financials", {})
    st = s.get("stock_statistics", {})
    
    def safe_float(val):
        try:
            return float(val) if val is not None else None
        except Exception:
            return None
    
    return {
        # Valuation
        "pe": safe_float(v.get("trailing_pe")),
        "forwardPe": safe_float(v.get("forward_pe")),
        "pb": safe_float(v.get("price_to_book_mrq")),
        "peg": safe_float(v.get("peg_ratio")),
        
        # Profitability
        "roe": safe_float(f.get("return_on_equity_ttm")),
        "profitMargin": safe_float(f.get("profit_margin")),
        "operatingMargin": safe_float(f.get("operating_margin_ttm")),
        
        # Growth
        "revenueGrowth": safe_float(f.get("quarterly_revenue_growth_yoy")),
        "earningsGrowth": safe_float(f.get("quarterly_earnings_growth_yoy")),
        
        # Health
        "debtToEquity": safe_float(st.get("total_debt_to_equity_mrq")),
        "currentRatio": safe_float(st.get("current_ratio_mrq")),
        
        # Price levels
        "ma50": safe_float(st.get("50_day_moving_average")),
        "ma200": safe_float(st.get("200_day_moving_average")),
        "high52": safe_float(st.get("52_week_high")),
        "low52": safe_float(st.get("52_week_low")),
        
        # Company info
        "sector": profile.get("sector"),
        "industry": profile.get("industry"),
        "description": profile.get("description"),
        "source": "Twelve Data"
    }

async def fetch_indices():
    import logging
    logger = logging.getLogger(__name__)
    
    if not settings.TWELVE_DATA_KEY:
        logger.error("TWELVE_DATA_KEY not set")
        return None
    
    logger.info(f"Using key: {settings.TWELVE_DATA_KEY[:8]}")
    
    async with httpx.AsyncClient() as client:
        # Try multiple symbol formats
        # Twelve Data uses different formats
        nifty_symbols = [
            "NIFTY50:NSE",
            "NIFTY:NSE", 
            "^NSEI",
            "NIFTY50"
        ]
        sensex_symbols = [
            "SENSEX:BSE",
            "SENSEX:NSE",
            "^BSESN",
            "SENSEX"
        ]
        
        nifty_data = None
        sensex_data = None
        
        # Try each nifty symbol until one works
        for symbol in nifty_symbols:
            try:
                res = await client.get(
                    "https://api.twelvedata.com/quote",
                    params={
                        "symbol": symbol,
                        "apikey": settings.TWELVE_DATA_KEY
                    },
                    timeout=10.0
                )
                data = res.json()
                logger.info(f"Nifty {symbol}: {data.get('status', 'ok')} - close: {data.get('close')}")
                
                if data.get("status") != "error" and data.get("close"):
                    price = float(data["close"])
                    prev = float(data.get("previous_close", price))
                    change = price - prev
                    nifty_data = {
                        "price": round(price, 2),
                        "change": round(change, 2),
                        "changePercent": round(change/prev*100, 2) if prev else 0,
                        "high": float(data.get("high", 0)),
                        "low": float(data.get("low", 0)),
                        "isPositive": change >= 0,
                        "symbol": symbol
                    }
                    break
            except Exception as e:
                logger.error(f"Nifty {symbol} error: {e}")
                continue
        
        # Try each sensex symbol until one works
        for symbol in sensex_symbols:
            try:
                res = await client.get(
                    "https://api.twelvedata.com/quote",
                    params={
                        "symbol": symbol,
                        "apikey": settings.TWELVE_DATA_KEY
                    },
                    timeout=10.0
                )
                data = res.json()
                logger.info(f"Sensex {symbol}: {data.get('status', 'ok')} - close: {data.get('close')}")
                
                if data.get("status") != "error" and data.get("close"):
                    price = float(data["close"])
                    prev = float(data.get("previous_close", price))
                    change = price - prev
                    sensex_data = {
                        "price": round(price, 2),
                        "change": round(change, 2),
                        "changePercent": round(change/prev*100, 2) if prev else 0,
                        "high": float(data.get("high", 0)),
                        "low": float(data.get("low", 0)),
                        "isPositive": change >= 0,
                        "symbol": symbol
                    }
                    break
            except Exception as e:
                logger.error(f"Sensex {symbol} error: {e}")
                continue
    
    return {
        "nifty": nifty_data,
        "sensex": sensex_data
    }
