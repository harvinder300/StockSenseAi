from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Keys
    TWELVE_DATA_KEY: str = ""
    GEMINI_KEY: str = ""
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Cache TTL (seconds)
    INDICES_CACHE_TTL: int = 60          # 1 min
    QUOTE_CACHE_TTL: int = 300           # 5 min
    CHART_CACHE_TTL: int = 900           # 15 min
    FUNDAMENTALS_CACHE_TTL: int = 86400  # 24 hr
    SEARCH_CACHE_TTL: int = 3600         # 1 hour
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 30
    RATE_LIMIT_WINDOW: int = 60          # per minute
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
