from typing import Any

from pydantic import BaseModel


class MessageResponse(BaseModel):
    success: bool = True
    message: str
    data: Any = None
    extra: dict[str, Any] = {}
