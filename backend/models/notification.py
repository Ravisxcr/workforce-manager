from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.base import Base, IdMixin, TimestampMixin


class Notification(Base, TimestampMixin, IdMixin):
    __tablename__ = "notifications"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    # info / warning / success / error
    type = Column(String, default="info")
    link = Column(String, nullable=True)
