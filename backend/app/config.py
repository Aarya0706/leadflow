from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App configuration, read from environment variables or a local .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./leadflow.db"
    # Comma-separated list of origins allowed to call the API from a browser.
    cors_origins: str = "http://localhost:3000"
    # Timezone used by the seed script to decide what "today" means.
    seed_timezone: str = "Asia/Kolkata"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
