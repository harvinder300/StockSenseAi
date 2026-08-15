# Maps common names to NSE symbols
COMPANY_MAP = {
    "ADANI ENT": "ADANIENT",
    "ADANI ENTERPRISES": "ADANIENT",
    "ADANI PORTS": "ADANIPORTS",
    "AIRTEL": "BHARTIARTL",
    "BHARTI AIRTEL": "BHARTIARTL",
    "BAJAJ FINANCE": "BAJFINANCE",
    "BAJAJ FINSERV": "BAJAJFINSV",
    "CG POWER": "CGPOWER",
    "GLAND PHARMA": "GLAND",
    "HDFC BANK": "HDFCBANK",
    "HDFC LIFE": "HDFCLIFE",
    "HERO MOTO": "HEROMOTOCO",
    "HINDUSTAN UNILEVER": "HINDUNILVR",
    "HUL": "HINDUNILVR",
    "ICICI BANK": "ICICIBANK",
    "INFOSYS": "INFY",
    "ITC LTD": "ITC",
    "KOTAK BANK": "KOTAKBANK",
    "KOTAK MAHINDRA": "KOTAKBANK",
    "LARSEN": "LT",
    "L&T": "LT",
    "MAHINDRA": "M&M",
    "MARUTI SUZUKI": "MARUTI",
    "NESTLE": "NESTLEIND",
    "NTPC LTD": "NTPC",
    "ONGC LTD": "ONGC",
    "RELIANCE IND": "RELIANCE",
    "RELIANCE INDUSTRIES": "RELIANCE",
    "SBI": "SBIN",
    "STATE BANK": "SBIN",
    "STALLION IND": "STALLION",
    "SUN PHARMA": "SUNPHARMA",
    "TATA CONSUMER": "TATACONSUM",
    "TATA MOTORS": "TATAMOTORS",
    "TATA STEEL": "TATASTEEL",
    "ULTRA CEMENT": "ULTRACEMCO",
    "VADILAL IND": "VADILALIND",
    "WIPRO LTD": "WIPRO",
}

def resolve_symbol(raw_input: str) -> str:
    clean = raw_input.strip().upper()
    
    # Check company name map
    if clean in COMPANY_MAP:
        return COMPANY_MAP[clean]
    
    # Remove common suffixes
    for suffix in [
        ' LIMITED', ' LTD', ' LTD.',
        ' INC', ' CORP', '.NS', 
        '.BO', ':NSE', ':BSE'
    ]:
        clean = clean.replace(suffix, '')
    
    return clean.strip()

def format_for_twelve_data(symbol: str) -> str:
    resolved = resolve_symbol(symbol)
    return f"{resolved}:NSE"

def format_for_stooq(symbol: str) -> str:
    resolved = resolve_symbol(symbol)
    return f"{resolved.lower()}.in"
