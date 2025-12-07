from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./hr_app.db"
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ENABLE_ADD_USER: bool = True
    ENABLE_DELETE_USER: bool = True


settings = Settings()
