from pydantic import BaseModel
from typing import Any

class MessageResponse(BaseModel):
    success: bool = True
    message: str
    data: Any = None
    extra: dict[str, Any] = {}