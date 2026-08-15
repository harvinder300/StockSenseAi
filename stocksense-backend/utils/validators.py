import re

def validate_symbol(symbol: str) -> bool:
    if not symbol:
        return False
    if len(symbol) > 50:
        return False
    # Only alphanumeric and & - .
    pattern = r'^[A-Za-z0-9&\-\.]{1,50}$'
    return bool(re.match(pattern, symbol))
